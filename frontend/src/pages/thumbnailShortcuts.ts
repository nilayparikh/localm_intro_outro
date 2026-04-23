export type ThumbnailShortcutAction = "save" | "undo" | "redo";

export interface ThumbnailShortcutEventLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

export function resolveThumbnailShortcutAction(
  event: ThumbnailShortcutEventLike,
): ThumbnailShortcutAction | null {
  const modifierPressed = event.ctrlKey === true || event.metaKey === true;
  if (!modifierPressed || event.altKey === true) {
    return null;
  }

  const key = event.key.toLowerCase();

  if (key === "s" && event.shiftKey !== true) {
    return "save";
  }

  if (key === "z") {
    return event.shiftKey === true ? "redo" : "undo";
  }

  if (key === "y" && event.shiftKey !== true) {
    return "redo";
  }

  return null;
}
