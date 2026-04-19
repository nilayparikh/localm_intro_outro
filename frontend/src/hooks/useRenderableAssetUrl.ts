import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { resolveBlobAssetUrl } from "../services";

function isInlineAsset(reference: string): boolean {
  return reference.startsWith("data:") || reference.startsWith("blob:");
}

export function useRenderableAssetUrl(reference: string | null): string | null {
  const { authState } = useAuth();
  const [assetUrl, setAssetUrl] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let objectUrl: string | null = null;

    async function resolveUrl() {
      if (!reference) {
        setAssetUrl(null);
        return;
      }

      if (isInlineAsset(reference)) {
        setAssetUrl(reference);
        return;
      }

      if (!authState) {
        setAssetUrl(null);
        return;
      }

      try {
        const nextUrl = await resolveBlobAssetUrl(reference, authState);
        if (disposed) {
          if (nextUrl.startsWith("blob:")) {
            URL.revokeObjectURL(nextUrl);
          }
          return;
        }

        objectUrl = nextUrl.startsWith("blob:") ? nextUrl : null;
        setAssetUrl(nextUrl);
      } catch (error) {
        console.error("Failed to resolve asset URL", error);
        if (!disposed) {
          setAssetUrl(null);
        }
      }
    }

    void resolveUrl();

    return () => {
      disposed = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [authState, reference]);

  return assetUrl;
}
