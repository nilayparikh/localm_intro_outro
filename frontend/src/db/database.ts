import {
  addRxPlugin,
  createRxDatabase,
  type RxDatabase,
  type RxCollection,
} from "rxdb";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import {
  settingsSchema,
  presetsSchema,
  bannersSchema,
  themesSchema,
  appStateMigrationStrategies,
  appStateSchema,
} from "./schemas";
import { createAsyncSingleton } from "./asyncSingleton";
import { getDatabaseOptions } from "./databaseOptions";

export type BannersDatabase = RxDatabase<{
  settings: RxCollection;
  presets: RxCollection;
  banners: RxCollection;
  themes: RxCollection;
  app_state: RxCollection;
}>;

let dbInstance: BannersDatabase | null = null;
let pluginsRegistered = false;

function ensureRxdbPlugins() {
  if (pluginsRegistered) {
    return;
  }

  addRxPlugin(RxDBMigrationSchemaPlugin);

  pluginsRegistered = true;
}

const getDatabaseSingleton = createAsyncSingleton(async () => {
  ensureRxdbPlugins();

  const db = await createRxDatabase<BannersDatabase>(
    getDatabaseOptions(import.meta.env.DEV),
  );

  await db.addCollections({
    settings: { schema: settingsSchema },
    presets: { schema: presetsSchema },
    banners: { schema: bannersSchema },
    themes: { schema: themesSchema },
    app_state: {
      schema: appStateSchema,
      migrationStrategies: appStateMigrationStrategies,
    },
  });

  dbInstance = db;
  return db;
});

export async function initDatabase(): Promise<BannersDatabase> {
  return getDatabaseSingleton();
}

export function getDatabase(): BannersDatabase | null {
  return dbInstance;
}
