import { useCallback, useState } from "react";
import { useAuth } from "../auth";
import {
  uploadBlob,
  deleteBlob,
  extractBlobPath,
} from "../services/blobStorage";
import { useSettings } from "./useSettings";
import { useRenderableAssetUrl } from "./useRenderableAssetUrl";
import toast from "react-hot-toast";

const LOGO_PATH = "logos";
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
];

export function useLogoUpload() {
  const { authState } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [uploading, setUploading] = useState(false);
  const logoUrl = useRenderableAssetUrl(settings.logo_url);

  const upload = useCallback(
    async (file: File) => {
      if (!authState) return;
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error("Unsupported file type. Use PNG, JPG, SVG, or WebP.");
        return;
      }

      setUploading(true);
      try {
        const ext = file.name.split(".").pop() ?? "png";
        const filePath = `${LOGO_PATH}/logo.${ext}`;
        await uploadBlob(filePath, file, authState);
        await updateSettings({ logo_url: filePath });
        toast.success("Logo uploaded");
      } catch (err: any) {
        toast.error(`Upload failed: ${err.message}`);
      } finally {
        setUploading(false);
      }
    },
    [authState, updateSettings],
  );

  const remove = useCallback(async () => {
    if (!authState || !settings.logo_url) return;
    try {
      const path = extractBlobPath(settings.logo_url, authState);
      if (path) {
        await deleteBlob(path, authState);
      }
      await updateSettings({ logo_url: null });
      toast.success("Logo removed");
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  }, [authState, settings.logo_url, updateSettings]);

  return { logoUrl, upload, remove, uploading };
}
