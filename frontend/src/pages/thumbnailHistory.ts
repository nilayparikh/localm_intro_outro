import {
  normalizeDraftBannerState,
  type DraftBannerState,
} from "../hooks/useAppState";

export interface ThumbnailHistory {
  entries: DraftBannerState[];
  index: number;
  snapshot: DraftBannerState;
}

const DEFAULT_HISTORY_LIMIT = 60;

function cloneSnapshot(snapshot: DraftBannerState): DraftBannerState {
  return JSON.parse(JSON.stringify(snapshot)) as DraftBannerState;
}

function normalizeSnapshot(snapshot: DraftBannerState): DraftBannerState {
  const normalized = normalizeDraftBannerState(snapshot);
  if (!normalized) {
    throw new Error("Thumbnail history requires a draft snapshot");
  }

  return cloneSnapshot(normalized);
}

function snapshotKey(snapshot: DraftBannerState): string {
  return JSON.stringify(snapshot);
}

export function createThumbnailHistory(
  snapshot: DraftBannerState,
): ThumbnailHistory {
  const normalizedSnapshot = normalizeSnapshot(snapshot);

  return {
    entries: [normalizedSnapshot],
    index: 0,
    snapshot: normalizedSnapshot,
  };
}

export function pushThumbnailHistory(
  history: ThumbnailHistory,
  snapshot: DraftBannerState,
  maxEntries = DEFAULT_HISTORY_LIMIT,
): ThumbnailHistory {
  const normalizedSnapshot = normalizeSnapshot(snapshot);
  const currentEntry = history.entries[history.index];

  if (
    currentEntry &&
    snapshotKey(currentEntry) === snapshotKey(normalizedSnapshot)
  ) {
    return {
      ...history,
      snapshot: currentEntry,
    };
  }

  const nextEntries = history.entries
    .slice(0, history.index + 1)
    .concat(normalizedSnapshot);
  const overflow = Math.max(0, nextEntries.length - maxEntries);
  const trimmedEntries =
    overflow > 0 ? nextEntries.slice(overflow) : nextEntries;
  const nextIndex = trimmedEntries.length - 1;

  return {
    entries: trimmedEntries,
    index: nextIndex,
    snapshot: trimmedEntries[nextIndex]!,
  };
}

export function undoThumbnailHistory(
  history: ThumbnailHistory,
): ThumbnailHistory {
  if (history.index === 0) {
    return history;
  }

  const nextIndex = history.index - 1;
  return {
    entries: history.entries,
    index: nextIndex,
    snapshot: history.entries[nextIndex]!,
  };
}

export function redoThumbnailHistory(
  history: ThumbnailHistory,
): ThumbnailHistory {
  if (history.index >= history.entries.length - 1) {
    return history;
  }

  const nextIndex = history.index + 1;
  return {
    entries: history.entries,
    index: nextIndex,
    snapshot: history.entries[nextIndex]!,
  };
}
