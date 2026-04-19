import { useCallback, useState } from "react";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import toast from "react-hot-toast";

interface ExportOptions {
  transparent?: boolean;
  quality?: number;
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportPng = useCallback(
    async (
      element: HTMLElement,
      filename: string,
      options: ExportOptions = {},
    ) => {
      setIsExporting(true);
      try {
        const dataUrl = await toPng(element, {
          quality: options.quality ?? 1,
          pixelRatio: 1,
          skipAutoScale: true,
        });

        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        link.click();

        toast.success(`Exported ${filename}`);
      } catch (err) {
        console.error("Export failed:", err);
        toast.error("Export failed");
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  const exportZip = useCallback(
    async (
      items: { element: HTMLElement; filename: string }[],
      zipName: string,
      options: ExportOptions = {},
    ) => {
      setIsExporting(true);
      try {
        const zip = new JSZip();

        for (const item of items) {
          const dataUrl = await toPng(item.element, {
            quality: options.quality ?? 1,
            pixelRatio: 1,
            skipAutoScale: true,
          });

          const response = await fetch(dataUrl);
          const blob = await response.blob();
          zip.file(item.filename, blob);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, zipName);

        toast.success(`Exported ${zipName} with ${items.length} files`);
      } catch (err) {
        console.error("ZIP export failed:", err);
        toast.error("ZIP export failed");
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  return { exportPng, exportZip, isExporting };
}
