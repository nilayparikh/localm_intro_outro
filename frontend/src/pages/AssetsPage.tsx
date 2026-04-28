import { useCallback, useDeferredValue, useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
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
  StatusChip,
} from "@common";
import { useAuth } from "../auth";
import { AssetEditDialog } from "../components/AssetEditDialog";
import { SettingsDialog } from "../components/SettingsDialog";
import { SyncMenu } from "../components/SyncMenu";
import {
  collectAssetTags,
  filterAssets,
  useAssets,
  type AssetDoc,
} from "../hooks/useAssets";
import { useRenderableAssetUrl } from "../hooks/useRenderableAssetUrl";
import {
  buildAssetBlobPath,
  classifyAssetKind,
  formatAssetOptionLabel,
  type AssetKind,
} from "../persistence/assetPersistence";
import { deleteBlob, deleteCachedAssetBlob, uploadBlob } from "../services";
import {
  appendAssetSearchToken,
  buildAssetSearchToken,
  parseAssetTagInput,
} from "./assetsMetadata";

const FILTER_OPTIONS: Array<{ value: AssetKind | "all"; label: string }> = [
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

function formatDimensionLabel(asset: AssetDoc): string {
  if (!asset.width || !asset.height) {
    return "No dimensions";
  }

  return `${asset.width}×${asset.height}`;
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

function AssetPreview({
  asset,
  compact = false,
}: {
  asset: AssetDoc;
  compact?: boolean;
}) {
  const assetUrl = useRenderableAssetUrl(asset.blobPath);

  if (!assetUrl) {
    return (
      <Box
        sx={{
          minHeight: compact ? 160 : 96,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          borderRadius: 1,
          color: "text.secondary",
          textAlign: "center",
          p: 2,
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
          height: compact ? 160 : "auto",
          maxHeight: compact ? 160 : 220,
          objectFit: "contain",
          bgcolor: "background.default",
          borderRadius: 1,
        }}
      />
    );
  }

  if (compact) {
    return (
      <Stack
        spacing={1}
        sx={{
          minHeight: 160,
          justifyContent: "center",
          alignItems: "center",
          p: 2,
          bgcolor: "background.default",
          borderRadius: 1,
          textAlign: "center",
        }}
      >
        <AssetKindIcon kind={asset.kind} />
        <Typography variant="body2">{asset.fileName}</Typography>
      </Stack>
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

export function AssetsPage() {
  const { authState } = useAuth();
  const { assets, saveAsset, deleteAsset, refreshAssets } = useAssets();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadTagInputValue, setUploadTagInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filterKind, setFilterKind] = useState<AssetKind | "all">("all");
  const [searchText, setSearchText] = useState("");
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [savingAssetId, setSavingAssetId] = useState<string | null>(null);

  const deferredSearchText = useDeferredValue(searchText);
  const availableTags = useMemo(() => collectAssetTags(assets), [assets]);
  const editingAsset = useMemo(
    () => assets.find((asset) => asset.id === editingAssetId) ?? null,
    [assets, editingAssetId],
  );
  const normalizedUploadTags = useMemo(
    () => parseAssetTagInput(uploadTags),
    [uploadTags],
  );

  const filteredAssets = useMemo(
    () =>
      filterAssets(assets, {
        kind: filterKind,
        searchText: deferredSearchText,
      }),
    [assets, deferredSearchText, filterKind],
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
        category: "",
        tags: parseAssetTagInput(uploadTags),
      });

      setSelectedFile(null);
      setUploadName("");
      setUploadTags("");
      setUploadTagInputValue("");
      toast.success("Asset uploaded");
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }, [authState, saveAsset, selectedFile, uploadName, uploadTags]);

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

  const handleSaveAssetDetails = useCallback(
    async (values: { name: string; tags: string }) => {
      if (!editingAsset) {
        return;
      }

      setSavingAssetId(editingAsset.id);

      try {
        await saveAsset({
          id: editingAsset.id,
          name: values.name.trim(),
          fileName: editingAsset.fileName,
          kind: editingAsset.kind,
          mimeType: editingAsset.mimeType,
          blobPath: editingAsset.blobPath,
          sizeBytes: editingAsset.sizeBytes,
          durationMs: editingAsset.durationMs,
          previewImagePath: editingAsset.previewImagePath,
          width: editingAsset.width,
          height: editingAsset.height,
          category: "",
          tags: parseAssetTagInput(values.tags),
        });
        setEditingAssetId(null);
        toast.success(`Saved asset details for ${editingAsset.name}`);
      } catch (error: any) {
        toast.error(`Asset update failed: ${error.message}`);
      } finally {
        setSavingAssetId(null);
      }
    },
    [editingAsset, saveAsset],
  );

  const appendTagToken = useCallback((tag: string) => {
    setSearchText((currentSearchText) =>
      appendAssetSearchToken(
        currentSearchText,
        buildAssetSearchToken("#", tag),
      ),
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchText("");
    setFilterKind("all");
  }, []);

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
              <SectionCard
                title="Upload Assets"
                icon={<UploadFileIcon />}
                collapsible
                defaultExpanded
              >
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
                  <Autocomplete
                    multiple
                    freeSolo
                    filterSelectedOptions
                    options={availableTags}
                    value={normalizedUploadTags}
                    inputValue={uploadTagInputValue}
                    onInputChange={(_, value) => setUploadTagInputValue(value)}
                    onChange={(_, value) => {
                      const resolvedTags = value.map((tag) => String(tag));
                      setUploadTags(resolvedTags.join(", "));
                      setUploadTagInputValue("");
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tags"
                        helperText="Reuse existing tags or add new ones to improve search and filtering."
                        size="small"
                        fullWidth
                      />
                    )}
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
                  {selectedFile ? (
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
                  ) : null}
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
                    label={`${availableTags.length} tags`}
                    status="default"
                  />
                </Stack>
              </SectionCard>
            </Box>
          </Stack>

          <SectionCard title="Asset Management" icon={<LibraryMusicIcon />}>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", lg: "row" }}
                spacing={2}
                alignItems={{ lg: "flex-start" }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <TextField
                    label="Search Assets"
                    helperText="Use #tags with free text to refine results."
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    size="small"
                    fullWidth
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: "text.secondary" }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>
                <Box sx={{ width: { xs: "100%", lg: 180 } }}>
                  <ActionButton
                    label="Clear Filters"
                    variant="secondary"
                    onClick={clearFilters}
                  />
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {FILTER_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    clickable
                    color={filterKind === option.value ? "primary" : "default"}
                    variant={
                      filterKind === option.value ? "filled" : "outlined"
                    }
                    onClick={() => setFilterKind(option.value)}
                  />
                ))}
              </Stack>

              <Stack spacing={1}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1}
                  alignItems={{ md: "center" }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocalOfferOutlinedIcon
                      sx={{ color: "text.secondary", fontSize: 18 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Filter by Tags
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Click a tag chip to append a search token, or type your own
                    free-text query.
                  </Typography>
                </Stack>

                {availableTags.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    Add tags to uploaded assets to unlock faster filtering.
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {availableTags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        clickable
                        variant="outlined"
                        onClick={() => appendTagToken(tag)}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                useFlexGap
                flexWrap="wrap"
              >
                <StatusChip
                  label={`Showing ${filteredAssets.length} of ${assets.length} assets`}
                  status="info"
                />
                {filterKind !== "all" ? (
                  <StatusChip label={`type:${filterKind}`} status="default" />
                ) : null}
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
                  {assets.length === 0
                    ? "No assets yet. Upload MP3, MP4, image, or document files to build the shared library."
                    : "No assets match the current search and filter settings."}
                </Box>
              ) : (
                <Box
                  sx={{
                    maxHeight: { xs: 520, lg: 720 },
                    overflowY: "auto",
                    pr: 1,
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(148, 163, 184, 0.8) transparent",
                    "&::-webkit-scrollbar": {
                      width: 10,
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "rgba(148, 163, 184, 0.8)",
                      borderRadius: 999,
                    },
                    "&::-webkit-scrollbar-track": {
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        md: "repeat(3, minmax(0, 1fr))",
                        lg: "repeat(4, minmax(0, 1fr))",
                        xl: "repeat(7, minmax(0, 1fr))",
                      },
                      gap: 2,
                    }}
                  >
                    {filteredAssets.map((asset) => (
                      <Box
                        key={asset.id}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 3,
                          bgcolor: "background.paper",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          minWidth: 0,
                        }}
                      >
                        <Box sx={{ p: 1.5, pb: 0 }}>
                          <AssetPreview asset={asset} compact />
                        </Box>
                        <Stack
                          spacing={1.25}
                          sx={{ p: 1.5, flex: 1, minWidth: 0 }}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <AssetKindIcon kind={asset.kind} />
                            <Typography
                              variant="subtitle1"
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
                            <StatusChip
                              label={`Type: ${asset.kind}`}
                              status="info"
                            />
                          </Stack>
                          <Stack
                            direction="row"
                            spacing={1}
                            useFlexGap
                            flexWrap="wrap"
                          >
                            <StatusChip
                              label={formatDimensionLabel(asset)}
                              status="default"
                            />
                            <StatusChip
                              label={formatFileSize(asset.sizeBytes)}
                              status="default"
                            />
                          </Stack>
                          <Stack
                            direction="row"
                            spacing={1}
                            useFlexGap
                            flexWrap="wrap"
                          >
                            {asset.tags.length > 0 ? (
                              asset.tags.map((tag) => (
                                <Chip
                                  key={`${asset.id}-${tag}`}
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                  onClick={() => appendTagToken(tag)}
                                />
                              ))
                            ) : (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                No tags added yet.
                              </Typography>
                            )}
                          </Stack>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                            sx={{ mt: "auto" }}
                          >
                            <ActionButton
                              label="Edit Asset"
                              variant="secondary"
                              icon={<EditOutlinedIcon />}
                              onClick={() => setEditingAssetId(asset.id)}
                            />
                            <ActionButton
                              label="Delete Asset"
                              variant="secondary"
                              icon={<DeleteOutlineIcon />}
                              onClick={() => void handleDelete(asset)}
                            />
                          </Stack>
                        </Stack>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Stack>
          </SectionCard>
        </Stack>
      </Box>
      <AssetEditDialog
        open={Boolean(editingAsset)}
        asset={editingAsset}
        saving={savingAssetId === (editingAsset?.id ?? "")}
        availableTags={availableTags}
        onClose={() => setEditingAssetId(null)}
        onSave={handleSaveAssetDetails}
      />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </PageLayout>
  );
}
