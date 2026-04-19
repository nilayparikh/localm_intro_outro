import {
  replicateRxCollection,
  type RxReplicationState,
} from "rxdb/plugins/replication";
import type { BannersDatabase } from "../db";
import { createPullHandler, createPushHandler } from "./azureTableSync";
import type { StoredAuthState } from "../auth";

const SYNC_INTERVAL = 30_000;

interface ReplicationSet {
  settings: RxReplicationState<any, any>;
  presets: RxReplicationState<any, any>;
  banners: RxReplicationState<any, any>;
  app_state: RxReplicationState<any, any>;
}

let activeReplications: ReplicationSet | null = null;

export function startReplication(
  db: BannersDatabase,
  authState: StoredAuthState,
): ReplicationSet {
  if (activeReplications) return activeReplications;

  const collections = ["settings", "presets", "banners", "app_state"] as const;
  const replications: Partial<ReplicationSet> = {};

  for (const name of collections) {
    replications[name] = replicateRxCollection({
      collection: db[name],
      replicationIdentifier: `azure-table-${name}`,
      live: true,
      retryTime: SYNC_INTERVAL,
      autoStart: true,
      pull: {
        handler: createPullHandler(name, authState),
        batchSize: 100,
      },
      push: {
        handler: createPushHandler(name, authState),
        batchSize: 10,
      },
    });
  }

  activeReplications = replications as ReplicationSet;
  return activeReplications;
}

export async function stopReplication(): Promise<void> {
  if (!activeReplications) return;
  await Promise.all(Object.values(activeReplications).map((r) => r.cancel()));
  activeReplications = null;
}
