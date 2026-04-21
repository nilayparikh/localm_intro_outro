import { useCallback, useState } from "react";
import { toPng } from "html-to-image";
import * as FileSaver from "file-saver";
import JSZip from "jszip";
import toast from "react-hot-toast";

interface ExportOptions {
  transparent?: boolean;
  quality?: number;
}

export function buildCaptureOptions(options: ExportOptions = {}) {
  return {
    quality: options.quality ?? 1,
    pixelRatio: 1,
    skipAutoScale: true,
    skipFonts: false,
  };
}

async function waitForDocumentFonts(doc: Document = document): Promise<void> {
  const fontFaceSet = (
    doc as Document & {
      fonts?: { ready?: Promise<unknown> };
    }
  ).fonts;

  if (!fontFaceSet?.ready) {
    return;
  }

  try {
    await fontFaceSet.ready;
  } catch {
    // Fall back to capture if the browser font API does not settle cleanly.
  }
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
        await waitForDocumentFonts();
        const dataUrl = await toPng(element, buildCaptureOptions(options));

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
        await waitForDocumentFonts();

        for (const item of items) {
          const dataUrl = await toPng(
            item.element,
            buildCaptureOptions(options),
          );

          const response = await fetch(dataUrl);
          const blob = await response.blob();
          zip.file(item.filename, blob);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        FileSaver.saveAs(zipBlob, zipName);

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
