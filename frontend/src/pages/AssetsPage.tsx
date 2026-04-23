import { useCallback, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VideocamIcon from "@mui/icons-material/Videocam";
import WallpaperIcon from "@mui/icons-material/Wallpaper";
import DescriptionIcon from "@mui/icons-material/Description";
import toast from "react-hot-toast";

import {
  ActionButton,
  AppBar,
  PageLayout,
  SectionCard,
  SelectControl,
  StatusChip,
} from "@common";
import { useAuth } from "../auth";
import { SettingsDialog } from "../components/SettingsDialog";
import { SyncMenu } from "../components/SyncMenu";
import { useAssets, type AssetDoc } from "../hooks/useAssets";
import { useRenderableAssetUrl } from "../hooks/useRenderableAssetUrl";
import {
  buildAssetBlobPath,
  classifyAssetKind,
  formatAssetOptionLabel,
  type AssetKind,
} from "../persistence/assetPersistence";
import { deleteBlob, deleteCachedAssetBlob, uploadBlob } from "../services";

const FILTER_OPTIONS = [
  { value: "all", label: "All Assets" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "image", label: "Images" },
  { value: "file", label: "Files" },
];

function deriveAssetName(fileName: string): string {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  const cleaned = baseName.replace(/[_-]+/g, " ").trim();
  return cleaned || fileName;
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (sizeBytes >= 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${sizeBytes} B`;
}

function readImageMetadata(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read image dimensions."));
    };
    image.src = objectUrl;
  });
}

function readTimedMediaMetadata(
  file: File,
  kind: "audio" | "video",
): Promise<{
  durationMs: number;
  width: number | null;
  height: number | null;
}> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const media = document.createElement(kind);
    media.preload = "metadata";
    media.onloadedmetadata = () => {
      resolve({
        durationMs: Math.round(media.duration * 1000),
        width: kind === "video" ? (media as HTMLVideoElement).videoWidth : null,
        height:
          kind === "video" ? (media as HTMLVideoElement).videoHeight : null,
      });
      URL.revokeObjectURL(objectUrl);
    };
    media.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read media metadata."));
    };
    media.src = objectUrl;
  });
}

async function readAssetMetadata(
  file: File,
  kind: AssetKind,
): Promise<{
  durationMs: number | null;
  width: number | null;
  height: number | null;
}> {
  if (kind === "image") {
    const dimensions = await readImageMetadata(file);
    return {
      durationMs: null,
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  if (kind === "audio" || kind === "video") {
    return readTimedMediaMetadata(file, kind);
  }

  return { durationMs: null, width: null, height: null };
}

function AssetPreview({ asset }: { asset: AssetDoc }) {
  const assetUrl = useRenderableAssetUrl(asset.blobPath);

  if (!assetUrl) {
    return (
      <Box
        sx={{
          minHeight: 96,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          borderRadius: 1,
          color: "text.secondary",
        }}
      >
        <Typography variant="caption">Preview unavailable</Typography>
      </Box>
    );
  }

  if (asset.kind === "image") {
    return (
      <Box
        component="img"
        src={assetUrl}
        alt={asset.name}
        sx={{
          width: "100%",
          maxHeight: 160,
          objectFit: "contain",
          bgcolor: "background.default",
          borderRadius: 1,
        }}
      />
    );
  }

  if (asset.kind === "audio") {
    return (
      <Box component="audio" src={assetUrl} controls sx={{ width: "100%" }} />
    );
  }

  if (asset.kind === "video") {
    return (
      <Box
        component="video"
        src={assetUrl}
        controls
        sx={{
          width: "100%",
          maxHeight: 180,
          borderRadius: 1,
          bgcolor: "background.default",
        }}
      />
    );
  }

  return (
    <Stack
      spacing={1}
      sx={{
        minHeight: 96,
        justifyContent: "center",
        p: 2,
        bgcolor: "background.default",
        borderRadius: 1,
      }}
    >
      <Typography variant="body2">
        No inline preview for this file type.
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Stored at {asset.blobPath}
      </Typography>
    </Stack>
  );
}

function AssetKindIcon({ kind }: { kind: AssetKind }) {
  if (kind === "audio") {
    return <LibraryMusicIcon sx={{ color: "primary.main" }} />;
  }

  if (kind === "video") {
    return <VideocamIcon sx={{ color: "primary.main" }} />;
  }

  if (kind === "image") {
    return <WallpaperIcon sx={{ color: "primary.main" }} />;
  }

  return <DescriptionIcon sx={{ color: "primary.main" }} />;
}

export function AssetsPage() {
  const { authState } = useAuth();
  const { assets, saveAsset, deleteAsset, refreshAssets } = useAssets();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filterKind, setFilterKind] = useState<AssetKind | "all">("all");

  const filteredAssets = useMemo(
    () =>
      filterKind === "all"
        ? assets
        : assets.filter((asset) => asset.kind === filterKind),
    [assets, filterKind],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      setSelectedFile(file);
      if (file && !uploadName.trim()) {
        setUploadName(deriveAssetName(file.name));
      }
    },
    [uploadName],
  );

  const handleUpload = useCallback(async () => {
    if (!authState) {
      toast.error("Authentication is required to upload assets.");
      return;
    }

    if (!selectedFile) {
      toast.error("Choose a file to upload first.");
      return;
    }

    setUploading(true);

    try {
      const kind = classifyAssetKind(
        selectedFile.type || "application/octet-stream",
      );
      const blobPath = buildAssetBlobPath({
        fileName: selectedFile.name,
        kind,
      });
      const metadata = await readAssetMetadata(selectedFile, kind);

      await uploadBlob(blobPath, selectedFile, authState);
      await saveAsset({
        name: uploadName.trim() || deriveAssetName(selectedFile.name),
        fileName: selectedFile.name,
        kind,
        mimeType: selectedFile.type || "application/octet-stream",
        blobPath,
        sizeBytes: selectedFile.size,
        durationMs: metadata.durationMs,
        previewImagePath: null,
        width: metadata.width,
        height: metadata.height,
      });

      setSelectedFile(null);
      setUploadName("");
      toast.success("Asset uploaded");
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }, [authState, saveAsset, selectedFile, uploadName]);

  const handleDelete = useCallback(
    async (asset: AssetDoc) => {
      if (!authState) {
        toast.error("Authentication is required to delete assets.");
        return;
      }

      try {
        await deleteBlob(asset.blobPath, authState);
        await deleteCachedAssetBlob(asset.blobPath);
        await deleteAsset(asset.id);
        toast.success(`Deleted ${asset.name}`);
      } catch (error: any) {
        toast.error(`Delete failed: ${error.message}`);
      }
    },
    [authState, deleteAsset],
  );

  const goHome = useCallback(() => {
    window.location.assign("/");
  }, []);

  return (
    <PageLayout
      header={
        <AppBar
          title="Asset Library"
          showHomeButton
          onHomeClick={goHome}
          rightContent={
            <Stack direction="row" spacing={1}>
              <SyncMenu />
              <IconButton
                onClick={() => void refreshAssets()}
                size="small"
                sx={{ color: "text.secondary" }}
              >
                <RefreshIcon />
              </IconButton>
              <IconButton
                onClick={() => setSettingsOpen(true)}
                size="small"
                sx={{ color: "text.secondary" }}
              >
                <SettingsIcon />
              </IconButton>
            </Stack>
          }
        />
      }
    >
      <Box sx={{ flex: 1, p: 3 }}>
        <Stack spacing={3}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={3}
            alignItems="stretch"
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <SectionCard title="Upload Assets" icon={<UploadFileIcon />}>
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Upload shared media once to Azure Blob Storage, then reuse
                    it across banners and templates.
                  </Typography>
                  <TextField
                    label="Display Name"
                    value={uploadName}
                    onChange={(event) => setUploadName(event.target.value)}
                    size="small"
                    fullWidth
                  />
                  <Box
                    component="label"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px dashed",
                      borderColor: "divider",
                      borderRadius: 1,
                      bgcolor: "background.default",
                      p: 2,
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <UploadFileIcon
                        sx={{ fontSize: 18, color: "primary.main" }}
                      />
                      <Typography variant="body2" color="primary">
                        {selectedFile
                          ? `Selected: ${selectedFile.name}`
                          : "Choose Asset File"}
                      </Typography>
                    </Stack>
                    <input type="file" hidden onChange={handleFileChange} />
                  </Box>
                  {selectedFile && (
                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      flexWrap="wrap"
                    >
                      <StatusChip
                        label={selectedFile.type || "Unknown type"}
                        status="info"
                      />
                      <StatusChip
                        label={formatFileSize(selectedFile.size)}
                        status="default"
                      />
                    </Stack>
                  )}
                  <ActionButton
                    label="Upload Asset"
                    onClick={handleUpload}
                    loading={uploading}
                    icon={<UploadFileIcon />}
                  />
                </Stack>
              </SectionCard>
            </Box>

            <Box sx={{ width: { xs: "100%", lg: 280 }, flexShrink: 0 }}>
              <SectionCard title="Library Status" icon={<LibraryMusicIcon />}>
                <Stack spacing={1.5}>
                  <StatusChip
                    label={`${assets.length} total assets`}
                    status="info"
                  />
                  <StatusChip
                    label={`${assets.filter((asset) => asset.kind === "audio").length} audio`}
                    status="default"
                  />
                  <StatusChip
                    label={`${assets.filter((asset) => asset.kind === "image").length} images`}
                    status="default"
                  />
                  <StatusChip
                    label={`${assets.filter((asset) => asset.kind === "video").length} videos`}
                    status="default"
                  />
                </Stack>
              </SectionCard>
            </Box>
          </Stack>

          <SectionCard title="Asset Management" icon={<LibraryMusicIcon />}>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ sm: "center" }}
              >
                <Box sx={{ width: { xs: "100%", sm: 240 } }}>
                  <SelectControl
                    label="Filter"
                    value={filterKind}
                    onChange={(value) =>
                      setFilterKind(value as AssetKind | "all")
                    }
                    options={FILTER_OPTIONS}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Shared asset labels use the same format as the intro/outro
                  dropdowns: Name [filename] | duration.
                </Typography>
              </Stack>

              {filteredAssets.length === 0 ? (
                <Box
                  sx={{
                    border: "1px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                    p: 4,
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  No assets yet. Upload MP3, MP4, image, or document files to
                  build the shared library.
                </Box>
              ) : (
                <Stack spacing={2} divider={<Divider flexItem />}>
                  {filteredAssets.map((asset) => (
                    <Stack
                      key={asset.id}
                      direction={{ xs: "column", lg: "row" }}
                      spacing={2.5}
                    >
                      <Box
                        sx={{ width: { xs: "100%", lg: 320 }, flexShrink: 0 }}
                      >
                        <AssetPreview asset={asset} />
                      </Box>
                      <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AssetKindIcon kind={asset.kind} />
                          <Typography
                            variant="h6"
                            sx={{ minWidth: 0, wordBreak: "break-word" }}
                          >
                            {asset.name}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {formatAssetOptionLabel(asset)}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          flexWrap="wrap"
                        >
                          <StatusChip label={asset.kind} status="info" />
                          <StatusChip
                            label={formatFileSize(asset.sizeBytes)}
                            status="default"
                          />
                          {asset.width && asset.height ? (
                            <StatusChip
                              label={`${asset.width}×${asset.height}`}
                              status="default"
                            />
                          ) : null}
                        </Stack>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ wordBreak: "break-all" }}
                        >
                          Blob path: {asset.blobPath}
                        </Typography>
                        <Box>
                          <ActionButton
                            label="Delete Asset"
                            variant="secondary"
                            icon={<DeleteOutlineIcon />}
                            onClick={() => void handleDelete(asset)}
                          />
                        </Box>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          </SectionCard>
        </Stack>
      </Box>
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </PageLayout>
  );
}
