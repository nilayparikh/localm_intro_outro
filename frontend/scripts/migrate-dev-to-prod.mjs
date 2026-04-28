import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AzureSASCredential,
  TableClient,
  TableServiceClient,
} from "@azure/data-tables";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const appRoot = path.resolve(scriptDir, "..", "..");
const envPath = path.join(appRoot, ".env");

const DEFAULT_TABLE_ENDPOINT = "https://satutslocalm.table.core.windows.net";
const DEFAULT_SOURCE_TABLE = "BannersDev";
const DEFAULT_TARGET_TABLE = "BannersProd";
const SYSTEM_PROPERTIES = new Set(["etag", "odata.etag", "timestamp"]);

function parseArgs(argv) {
  const args = new Set(argv);
  return {
    execute: args.has("--execute"),
    pruneTarget: args.has("--prune-target"),
  };
}

function parseDotEnv(text) {
  const values = new Map();

  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values.set(key, value);
  }

  return values;
}

async function loadConfiguration() {
  const envValues = parseDotEnv(await readFile(envPath, "utf8"));
  const sasToken = (process.env.AZURE_SAS ?? envValues.get("AZURE_SAS") ?? "")
    .trim()
    .replace(/^\?+/, "");

  if (!sasToken) {
    throw new Error(
      `AZURE_SAS was not found in ${envPath} or the environment.`,
    );
  }

  return {
    sasToken,
    tableEndpoint: (
      process.env.AZURE_TABLE_ENDPOINT ?? DEFAULT_TABLE_ENDPOINT
    ).replace(/\/+$/u, ""),
    sourceTable: process.env.AZURE_SOURCE_TABLE ?? DEFAULT_SOURCE_TABLE,
    targetTable: process.env.AZURE_TARGET_TABLE ?? DEFAULT_TARGET_TABLE,
  };
}

async function ensureTableExists(serviceClient, tableName) {
  try {
    await serviceClient.createTable(tableName);
  } catch (error) {
    if (error?.statusCode !== 409 && error?.code !== "TableAlreadyExists") {
      throw error;
    }
  }
}

async function listEntities(client) {
  const entities = [];
  for await (const entity of client.listEntities()) {
    entities.push(entity);
  }
  return entities;
}

function buildCountMap(entities) {
  const counts = new Map();
  for (const entity of entities) {
    const partitionKey = String(entity.partitionKey ?? "");
    counts.set(partitionKey, (counts.get(partitionKey) ?? 0) + 1);
  }
  return counts;
}

function buildEntityKey(entity) {
  return `${entity.partitionKey}||${entity.rowKey}`;
}

function toUpsertEntity(entity) {
  return Object.fromEntries(
    Object.entries(entity).filter(([key]) => !SYSTEM_PROPERTIES.has(key)),
  );
}

function formatCountMap(label, counts) {
  const entries = [...counts.entries()].sort((left, right) =>
    left[0].localeCompare(right[0]),
  );

  if (entries.length === 0) {
    return `${label}: none`;
  }

  return `${label}: ${entries
    .map(([partition, count]) => `${partition}=${count}`)
    .join(", ")}`;
}

async function main() {
  const { execute, pruneTarget } = parseArgs(process.argv.slice(2));
  const config = await loadConfiguration();
  const credential = new AzureSASCredential(config.sasToken);
  const serviceClient = new TableServiceClient(
    config.tableEndpoint,
    credential,
  );
  const sourceClient = new TableClient(
    config.tableEndpoint,
    config.sourceTable,
    credential,
  );
  const targetClient = new TableClient(
    config.tableEndpoint,
    config.targetTable,
    credential,
  );

  await ensureTableExists(serviceClient, config.targetTable);

  const sourceEntities = await listEntities(sourceClient);
  const targetEntitiesBefore = await listEntities(targetClient);

  console.log(`Source table: ${config.sourceTable}`);
  console.log(`Target table: ${config.targetTable}`);
  console.log(`Source entities: ${sourceEntities.length}`);
  console.log(`Target entities before: ${targetEntitiesBefore.length}`);
  console.log(
    formatCountMap("Source partitions", buildCountMap(sourceEntities)),
  );
  console.log(
    formatCountMap(
      "Target partitions before",
      buildCountMap(targetEntitiesBefore),
    ),
  );

  if (!execute) {
    console.log(
      "Dry run only. Re-run with --execute to migrate Dev entities to Prod.",
    );
    return;
  }

  let upserted = 0;
  for (const entity of sourceEntities) {
    await targetClient.upsertEntity(toUpsertEntity(entity), "Replace");
    upserted += 1;
  }

  let deleted = 0;
  if (pruneTarget) {
    const sourceKeys = new Set(sourceEntities.map(buildEntityKey));
    for (const entity of targetEntitiesBefore) {
      if (sourceKeys.has(buildEntityKey(entity))) {
        continue;
      }

      await targetClient.deleteEntity(entity.partitionKey, entity.rowKey);
      deleted += 1;
    }
  }

  const targetEntitiesAfter = await listEntities(targetClient);
  console.log(`Upserted entities: ${upserted}`);
  console.log(`Deleted target-only entities: ${deleted}`);
  console.log(`Target entities after: ${targetEntitiesAfter.length}`);
  console.log(
    formatCountMap(
      "Target partitions after",
      buildCountMap(targetEntitiesAfter),
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
