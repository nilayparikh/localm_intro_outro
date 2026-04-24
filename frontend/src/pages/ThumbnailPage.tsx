/**
 * ThumbnailPage - Thumbnail Generator Editor
 *
 * Full editor for creating thumbnails.
 * Uses EditorLayout with SettingsPanel for controls and a live preview canvas.
 * Profiles are stored in RxDB via useBanners hook (replaces localStorage).
 */

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import SettingsIcon from "@mui/icons-material/Settings";
import DownloadIcon from "@mui/icons-material/Download";
import Stack from "@mui/material/Stack";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import PaletteIcon from "@mui/icons-material/Palette";
import SaveIcon from "@mui/icons-material/Save";
import ImageIcon from "@mui/icons-material/Image";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import toast from "react-hot-toast";

import {
  PageLayout,
  AppBar,
  EditorLayout,
  SettingsPanel,
  SectionCard,
  SelectControl,
  SliderControl,
  SwitchControl,
  ActionButton,
  StatusChip,
} from "@common";

import {
  BORDER_STYLE_OPTIONS,
  CAPSULE_STYLE_OPTIONS,
  getTemplatesForTool,
  TEMPLATE_COMPONENTS,
  getDefaultValues,
  SIZE_PRESET_OPTIONS,
  SURFACE_SHADOW_OPTIONS,
  SURFACE_STYLE_OPTIONS,
} from "../templates/index";
import type { FieldDef } from "../templates/types";
import { type OutroArrowOverlay } from "../templates/outroArrowAssets";
import { DEFAULT_THEME_ID } from "../themes/themeDefinitions";
import { useExport, type ExportActivityState } from "../hooks/useExport";
import { buildAssetOptions, filterAssets, useAssets } from "../hooks/useAssets";
import { useBanners, type BannerDoc } from "../hooks/useBanners";
import { useAppState, type DraftBannerState } from "../hooks/useAppState";
import { useRenderableAssetUrl } from "../hooks/useRenderableAssetUrl";
import { useSettings } from "../hooks/useSettings";
import { useThemes } from "../hooks/useThemes";
import { BannerLibraryDialog } from "../components/BannerLibraryDialog";
import { SettingsDialog } from "../components/SettingsDialog";
import { SyncMenu } from "../components/SyncMenu";
import { useSync } from "../sync";
import {
  createTemplateEntryFromLegacySource,
  findTemplateEntry,
  normalizeTemplateEntries,
  resolveTemplateSelection,
  type BannerTemplateEntry,
} from "../persistence/bannerTemplateEntries";
import {
  createThumbnailHistory,
  pushThumbnailHistory,
  redoThumbnailHistory,
  type ThumbnailHistory,
  undoThumbnailHistory,
} from "./thumbnailHistory";
import { resolveThumbnailShortcutAction } from "./thumbnailShortcuts";
import {
  MAX_SPLIT_BREAKPOINTS,
  SPLIT_PARTITION_MAX,
  getSplitDividerDistancePx,
  insertSplitBreakpoint,
  removeSplitBreakpoint,
  resolveSplitPartitionPoints,
  serializeSplitPartitionPoints,
  updateSplitBreakpoint,
} from "./thumbnailSplitPartition";
import {
  DEFAULT_COPYRIGHT_TEXT,
  buildThumbnailPageTitle,
  buildThumbnailTemplateRenderProps,
  buildBannerDialogState,
  buildThumbnailContentFieldRows,
  clampBrandLogoSize,
  getTemplateAudioAssetFieldId,
  getThumbnailTemplateCapabilities,
  getThemeBorderColor,
  resolveThumbnailTemplateAssetBindings,
  resolveExportActionLoadingState,
  resolveMotionDurationSeconds,
  resolveLoadedBrandLogoUrl,
  resolveBrandLogoUrlFromSettings,
  resolvePersistedBrandLogoUrl,
} from "./thumbnailSettings";
import {
  buildSplitBlendBackground,
  clampSplitBackgroundOpacity,
} from "../services/splitBlend";

const THUMBNAIL_TEMPLATES = getTemplatesForTool("thumbnail");

const GOOGLE_FONTS = [
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Roboto', sans-serif", label: "Roboto" },
  { value: "'Montserrat', sans-serif", label: "Montserrat" },
  { value: "'Oswald', sans-serif", label: "Oswald" },
  { value: "'Poppins', sans-serif", label: "Poppins" },
  { value: "'Lato', sans-serif", label: "Lato" },
  { value: "'Outfit', sans-serif", label: "Outfit (Light)" },
  { value: "'Share Tech Mono', monospace", label: "Share Tech Mono" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Anton', sans-serif", label: "Anton" },
  { value: "'Bebas Neue', sans-serif", label: "Bebas Neue" },
];

interface FontPairPreset {
  id: string;
  label: string;
  secondaryFontFamily: string;
  primaryFontFamily: string;
}

const FONT_PAIR_PRESETS: FontPairPreset[] = [
  {
    id: "share-tech-outfit",
    label: "Share Tech Mono + Outfit (Requested)",
    secondaryFontFamily: "'Share Tech Mono', monospace",
    primaryFontFamily: "'Outfit', sans-serif",
  },
  {
    id: "bebas-montserrat",
    label: "Bebas Neue + Montserrat",
    secondaryFontFamily: "'Bebas Neue', sans-serif",
    primaryFontFamily: "'Montserrat', sans-serif",
  },
  {
    id: "oswald-lato",
    label: "Oswald + Lato",
    secondaryFontFamily: "'Oswald', sans-serif",
    primaryFontFamily: "'Lato', sans-serif",
  },
  {
    id: "anton-outfit",
    label: "Anton + Outfit",
    secondaryFontFamily: "'Anton', sans-serif",
    primaryFontFamily: "'Outfit', sans-serif",
  },
  {
    id: "playfair-poppins",
    label: "Playfair Display + Poppins",
    secondaryFontFamily: "'Playfair Display', serif",
    primaryFontFamily: "'Poppins', sans-serif",
  },
  {
    id: "poppins-inter",
    label: "Poppins + Inter",
    secondaryFontFamily: "'Poppins', sans-serif",
    primaryFontFamily: "'Inter', sans-serif",
  },
];

const PLATFORM_PRESETS = [
  {
    id: "landscape_1k",
    name: "Landscape 1K (1024\u00d7576)",
    width: 1024,
    height: 576,
  },
  {
    id: "landscape_2k",
    name: "Landscape 2K (2048\u00d71152)",
    width: 2048,
    height: 1152,
  },
  {
    id: "landscape_4k",
    name: "Landscape 4K (3840\u00d72160)",
    width: 3840,
    height: 2160,
  },
];

const CONTROL_LABEL_SX = {
  fontSize: "0.8125rem",
  fontWeight: 500,
  color: "text.secondary",
  mb: 1,
} as const;

const TEXT_INPUT_SX = {
  "& .MuiOutlinedInput-input": {
    py: 1,
    fontSize: "0.875rem",
  },
  "& .MuiOutlinedInput-inputMultiline": {
    py: 0,
  },
} as const;

const CONTROL_ROW_SX = {
  direction: { xs: "column", lg: "row" },
  alignItems: "flex-start",
} as const;

const CONTROL_CELL_SX = {
  flex: 1,
  minWidth: 0,
} as const;

const FIELD_LABEL_OVERRIDES: Record<string, string> = {
  show_duration_capsule: "Duration Capsule",
  show_level_capsule: "Skill Capsule",
  show_instructor_capsule: "Instructor Capsule",
  show_hands_on_lab_capsule: "Hands-On Lab Capsule",
  show_bite_capsule: "Bite Capsule",
  show_speed_capsule: "Speed Capsule",
  show_source_label: "Show Bite From",
  source_label: "Bite From",
  show_source_title: "Show Original Video Title",
  source_title: "Original Video Title",
  outro_background_svg_asset_id: "Background SVG Asset",
  outro_background_opacity: "Background SVG Opacity",
  split_title_side: "Title Side",
  split_partition_points: "Partition Points",
  split_foreground_asset_id: "Foreground Image Asset",
  split_foreground_scale: "Foreground Scale",
  split_foreground_x: "Foreground Position X",
  split_foreground_y: "Foreground Position Y",
  split_background_svg_asset_id: "Background SVG Asset",
  split_background_opacity: "Background SVG Opacity",
  split_background_scale: "Background SVG Scale",
  split_background_x: "Background SVG Position X",
  split_background_y: "Background SVG Position Y",
  split_corner_icon_asset_id_1: "Corner Icon 1",
  split_corner_icon_asset_id_2: "Corner Icon 2",
  split_corner_icon_asset_id_3: "Corner Icon 3",
  split_corner_icon_size: "Corner Icon Size",
  outro_background_scale: "Background SVG Scale",
  outro_background_x: "Background SVG Position X",
  outro_background_y: "Background SVG Position Y",
  split_type_capsule: "Type Capsule",
  title_size: "Title Style",
  secondary_size: "Secondary Style",
};
const PREVIEW_DEBOUNCE_MS = 2000;
const FONT_SIZE_MIN = 24;
const FONT_SIZE_MAX = 120;
const IDLE_EXPORT_ACTIVITY_STATE: ExportActivityState = {
  png: 0,
  zip: 0,
  motion: 0,
};
const SPLIT_CORNER_ICON_FIELD_IDS = [
  "split_corner_icon_asset_id_1",
  "split_corner_icon_asset_id_2",
  "split_corner_icon_asset_id_3",
] as const;

function getUsedSplitCornerIconCount(assetIds: readonly string[]): number {
  for (let index = assetIds.length - 1; index >= 0; index -= 1) {
    if (assetIds[index]?.trim()) {
      return index + 1;
    }
  }

  return 0;
}

function clampFontSize(value: number): number {
  return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, value));
}

function isCapsuleFieldId(fieldId: string): boolean {
  return fieldId.includes("capsule") || fieldId === "level_capsule_value";
}

function renderTemplateFieldControl({
  field,
  value,
  onChange,
  errorText,
  helperText,
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
  errorText?: string | null;
  helperText?: string;
}) {
  if (field.type === "select") {
    return (
      <SelectControl
        label={FIELD_LABEL_OVERRIDES[field.id] ?? field.label}
        value={value}
        onChange={onChange}
        options={
          field.options?.map((option) => ({
            value: option.value,
            label: option.label,
          })) ?? []
        }
      />
    );
  }

  if (field.type === "slider") {
    return (
      <SliderControl
        label={field.label}
        value={parseFloat(value || field.defaultValue || "0")}
        onChange={(nextValue) => onChange(String(nextValue))}
        min={field.min ?? 0}
        max={field.max ?? 100}
        step={field.step ?? 1}
      />
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      <Typography sx={CONTROL_LABEL_SX}>
        {FIELD_LABEL_OVERRIDES[field.id] ?? field.label}
      </Typography>
      <TextField
        value={value}
        onChange={(event) => onChange(event.target.value)}
        fullWidth
        size="small"
        multiline={field.multiline}
        rows={field.multiline ? 3 : undefined}
        error={Boolean(errorText)}
        helperText={errorText ?? helperText}
        sx={TEXT_INPUT_SX}
        slotProps={{
          htmlInput: {
            name: field.id,
            "aria-label": FIELD_LABEL_OVERRIDES[field.id] ?? field.label,
          },
        }}
      />
    </Box>
  );
}

function renderColorTextField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Box sx={{ py: 1 }}>
      <Typography sx={CONTROL_LABEL_SX}>{label}</Typography>
      <TextField
        value={value}
        onChange={(event) => onChange(event.target.value)}
        size="small"
        fullWidth
        disabled={disabled}
        sx={TEXT_INPUT_SX}
        slotProps={{
          input: {
            startAdornment: (
              <Box
                component="input"
                type="color"
                value={value}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  onChange(event.target.value)
                }
                disabled={disabled}
                sx={{
                  width: 24,
                  height: 24,
                  border: "none",
                  background: "none",
                  cursor: disabled ? "not-allowed" : "pointer",
                  p: 0,
                  mr: 1,
                }}
              />
            ),
          },
        }}
      />
    </Box>
  );
}

function clampTutorialImagePercent(value: number): number {
  return Math.min(250, Math.max(50, Math.round(value)));
}

function clampTutorialBottomPadding(value: number): number {
  return Math.min(160, Math.max(0, Math.round(value)));
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

function isSvgFile(file: File): boolean {
  return (
    file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")
  );
}

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image"));
    img.src = dataUrl;
  });
}

async function cropTransparentMargins(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  const width = img.naturalWidth;
  const height = img.naturalHeight;
  if (width <= 0 || height <= 0) return dataUrl;

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0);

  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if ((alpha ?? 0) > 0) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return dataUrl;
  if (minX === 0 && minY === 0 && maxX === width - 1 && maxY === height - 1) {
    return dataUrl;
  }

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropWidth;
  cropCanvas.height = cropHeight;
  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) return dataUrl;

  cropCtx.drawImage(
    canvas,
    minX,
    minY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );

  return cropCanvas.toDataURL("image/png");
}

export function ThumbnailPage() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { exportMotion, exportPng, activeExportActions } = useExport();
  const [preExportActions, setPreExportActions] = useState<ExportActivityState>(
    IDLE_EXPORT_ACTIVITY_STATE,
  );
  const { isImageExporting, isMotionExporting } = useMemo(
    () =>
      resolveExportActionLoadingState(activeExportActions, preExportActions),
    [activeExportActions, preExportActions],
  );
  const { banners, saveBanner, deleteBanner, getBanner } = useBanners();
  const {
    appState,
    updateAppState,
    isHydrated: isAppStateHydrated,
  } = useAppState();
  const { settings } = useSettings();
  const { themes, themeOptions, getTheme, getRenderableTheme } = useThemes();
  const { syncOnSave } = useSync();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bannerDialogMode, setBannerDialogMode] = useState<
    "load" | "save" | null
  >(null);
  const [bannerDialogName, setBannerDialogName] = useState("");
  const [dialogSelectedBannerId, setDialogSelectedBannerId] = useState("");
  const hasLoadedDraftRef = useRef(false);
  const suppressDraftWriteRef = useRef(false);
  const previousSettingsLogoUrlRef = useRef<string | null>(null);
  const historyRef = useRef<ThumbnailHistory | null>(null);
  const splitPreviewRef = useRef<SVGSVGElement | null>(null);
  const splitDragDidMoveRef = useRef(false);
  const skipSplitPreviewClickRef = useRef(false);

  // State
  const [templateId, setTemplateId] = useState(
    THUMBNAIL_TEMPLATES[0]?.id ?? "tutorial_thumbnail",
  );
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [platformId, setPlatformId] = useState("landscape_4k");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    getDefaultValues(THUMBNAIL_TEMPLATES[0]?.id ?? "tutorial_thumbnail"),
  );
  const [previewFieldValues, setPreviewFieldValues] =
    useState<Record<string, string>>(fieldValues);
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState(
    getThemeBorderColor(DEFAULT_THEME_ID),
  );
  const [hasCustomBorderColor, setHasCustomBorderColor] = useState(false);
  const [selectedFontPairId, setSelectedFontPairId] = useState(
    FONT_PAIR_PRESETS[0]?.id ?? "",
  );
  const [secondaryFontFamily, setSecondaryFontFamily] = useState(
    FONT_PAIR_PRESETS[0]?.secondaryFontFamily ?? "'Share Tech Mono', monospace",
  );
  const [primaryFontFamily, setPrimaryFontFamily] = useState(
    FONT_PAIR_PRESETS[0]?.primaryFontFamily ?? "'Outfit', sans-serif",
  );
  const [fontSize, setFontSize] = useState(48);
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);
  const [brandLogoSize, setBrandLogoSize] = useState(90);
  const [showCopyrightMessage, setShowCopyrightMessage] = useState(true);
  const [copyrightText, setCopyrightText] = useState(DEFAULT_COPYRIGHT_TEXT);
  const [tutorialImageUrl, setTutorialImageUrl] = useState<string | null>(null);
  const [tutorialImageSize, setTutorialImageSize] = useState(100);
  const [tutorialImageBottomPadding, setTutorialImageBottomPadding] =
    useState(24);
  const [tutorialImageOpacity, setTutorialImageOpacity] = useState(100);
  const [outroArrowOverlays, setOutroArrowOverlays] = useState<
    OutroArrowOverlay[]
  >([]);
  const [templateEntries, setTemplateEntries] = useState<BannerTemplateEntry[]>(
    [],
  );
  const [profileName, setProfileName] = useState("default");
  const [selectedBannerId, setSelectedBannerId] = useState("");
  const [previewSplitBlendImageUrl, setPreviewSplitBlendImageUrl] = useState<
    string | null
  >(null);
  const [exportSplitBlendImageUrl, setExportSplitBlendImageUrl] = useState<
    string | null
  >(null);
  const [isSplitBreakpointEditorVisible, setIsSplitBreakpointEditorVisible] =
    useState(false);
  const [isCapsuleEditorVisible, setIsCapsuleEditorVisible] = useState(false);
  const [visibleSplitCornerIconCount, setVisibleSplitCornerIconCount] =
    useState(0);
  const [activeSplitDragIndex, setActiveSplitDragIndex] = useState<
    number | null
  >(null);
  const { assets, audioAssetOptions } = useAssets();
  const splitForegroundAssetOptions = useMemo(
    () =>
      buildAssetOptions(
        filterAssets(assets, {
          kind: "image",
          tags: ["foreground"],
        }),
      ),
    [assets],
  );
  const splitBackgroundSvgAssetOptions = useMemo(
    () =>
      buildAssetOptions(
        filterAssets(assets, {
          kind: "image",
          tags: ["background"],
        }),
      ),
    [assets],
  );
  const splitCornerIconAssetOptions = useMemo(
    () =>
      buildAssetOptions(
        filterAssets(assets, {
          kind: "image",
          tags: ["icon"],
        }),
      ),
    [assets],
  );
  const renderableBrandLogoUrl = useRenderableAssetUrl(brandLogoUrl);

  const setDraftWithSuppression = useCallback((callback: () => void) => {
    suppressDraftWriteRef.current = true;
    callback();
    queueMicrotask(() => {
      suppressDraftWriteRef.current = false;
    });
  }, []);

  // Get current values
  const currentTheme = getRenderableTheme(themeId);
  const previewTheme = useMemo(
    () => ({
      ...currentTheme,
      textPrimary:
        previewFieldValues["font_color_primary"]?.trim() ||
        currentTheme.textPrimary,
      textSecondary:
        previewFieldValues["font_color_secondary"]?.trim() ||
        currentTheme.textSecondary,
    }),
    [currentTheme, previewFieldValues],
  );
  const currentThemeDefinition = getTheme(themeId);
  const currentPlatform =
    PLATFORM_PRESETS.find((p) => p.id === platformId) ?? PLATFORM_PRESETS[0]!;
  const currentTemplate = THUMBNAIL_TEMPLATES.find((t) => t.id === templateId);
  const isOutroTemplate = templateId === "outro_thumbnail";
  const isIntroSplitTemplate = templateId === "intro_split_thumbnail";
  const currentTemplateFields = useMemo(() => {
    const templateFields = currentTemplate?.fields ?? [];

    if (!isIntroSplitTemplate && !isOutroTemplate) {
      return templateFields;
    }

    return templateFields.map((field) => {
      if (isIntroSplitTemplate && field.id === "split_foreground_asset_id") {
        return {
          ...field,
          options: [
            { value: "", label: "None" },
            ...splitForegroundAssetOptions,
          ],
        };
      }

      if (
        field.id === "split_background_svg_asset_id" ||
        field.id === "outro_background_svg_asset_id"
      ) {
        return {
          ...field,
          options: [
            { value: "", label: "None" },
            ...splitBackgroundSvgAssetOptions,
          ],
        };
      }

      return field;
    });
  }, [
    currentTemplate?.fields,
    isIntroSplitTemplate,
    isOutroTemplate,
    splitBackgroundSvgAssetOptions,
    splitForegroundAssetOptions,
  ]);
  const currentTemplateFieldMap = new Map(
    currentTemplateFields.map((field) => [field.id, field]),
  );
  const selectedBorderStyle =
    fieldValues["border_style"] ??
    currentTemplateFieldMap.get("border_style")?.defaultValue ??
    "solid";
  const selectedSurfaceStyle =
    fieldValues["surface_style"] ??
    currentTemplateFieldMap.get("surface_style")?.defaultValue ??
    "standard";
  const selectedSurfaceShadow =
    fieldValues["surface_shadow"] ??
    currentTemplateFieldMap.get("surface_shadow")?.defaultValue ??
    "middle";
  const secondaryBorderColorValue =
    fieldValues["border_color_secondary"]?.trim() ||
    currentTheme.borderColor ||
    currentTheme.accent;
  const capsuleStyleValue =
    fieldValues["capsule_style"] ??
    currentTemplateFieldMap.get("capsule_style")?.defaultValue ??
    "glass";
  const capsuleColorValue =
    fieldValues["capsule_color"]?.trim() || currentTheme.accent;
  const capsuleSizeValue =
    fieldValues["capsule_size"] ??
    currentTemplateFieldMap.get("capsule_size")?.defaultValue ??
    "small";
  const hasCapsuleStyleControls = currentTemplateFieldMap.has("capsule_size");
  const hasSurfaceControls = currentTemplateFieldMap.has("surface_style");
  const hasBorderControls = currentTemplateFieldMap.has("border_style");
  const contentFieldRows = buildThumbnailContentFieldRows(currentTemplateFields)
    .map((row) =>
      row
        .map((fieldId) => currentTemplateFieldMap.get(fieldId))
        .filter((field): field is FieldDef => !!field),
    )
    .filter((row) => row.length > 0);
  const capsuleContentFieldRows = contentFieldRows.filter((row) =>
    row.some((field) => isCapsuleFieldId(field.id)),
  );
  const primaryContentFieldRows = contentFieldRows.filter((row) =>
    row.every((field) => !isCapsuleFieldId(field.id)),
  );
  const hasCapsuleControls =
    capsuleContentFieldRows.length > 0 || hasCapsuleStyleControls;
  const templateCapabilities = getThumbnailTemplateCapabilities(templateId);
  const tutorialImageSectionTitle = isOutroTemplate
    ? "Suggested Preview Image"
    : "Tutorial Image";
  const tutorialImageUploadLabel = tutorialImageUrl
    ? `Change ${tutorialImageSectionTitle}`
    : `Upload ${tutorialImageSectionTitle}`;
  const splitPartitionValidation = resolveSplitPartitionPoints(
    fieldValues["split_partition_points"] ?? "",
  );
  const splitPartitionPoints = splitPartitionValidation.points;
  const splitPartitionError = isIntroSplitTemplate
    ? splitPartitionValidation.error
    : null;
  const splitBackgroundOpacityValue = clampSplitBackgroundOpacity(
    fieldValues["split_background_opacity"],
  );
  const splitBackgroundScaleValue = Math.min(
    180,
    Math.max(
      50,
      Number.parseInt(fieldValues["split_background_scale"] ?? "100", 10) ||
        100,
    ),
  );
  const splitBackgroundXValue = Math.min(
    24,
    Math.max(
      -24,
      Number.parseInt(fieldValues["split_background_x"] ?? "0", 10) || 0,
    ),
  );
  const splitBackgroundYValue = Math.min(
    24,
    Math.max(
      -24,
      Number.parseInt(fieldValues["split_background_y"] ?? "0", 10) || 0,
    ),
  );
  const outroBackgroundOpacityValue = Math.min(
    100,
    Math.max(
      0,
      Number.parseInt(fieldValues["outro_background_opacity"] ?? "55", 10) ||
        55,
    ),
  );
  const outroBackgroundScaleValue = Math.min(
    180,
    Math.max(
      50,
      Number.parseInt(fieldValues["outro_background_scale"] ?? "100", 10) ||
        100,
    ),
  );
  const outroBackgroundXValue = Math.min(
    24,
    Math.max(
      -24,
      Number.parseInt(fieldValues["outro_background_x"] ?? "0", 10) || 0,
    ),
  );
  const outroBackgroundYValue = Math.min(
    24,
    Math.max(
      -24,
      Number.parseInt(fieldValues["outro_background_y"] ?? "0", 10) || 0,
    ),
  );
  const previewSplitBackgroundScaleValue = Math.min(
    180,
    Math.max(
      50,
      Number.parseInt(
        previewFieldValues["split_background_scale"] ?? "100",
        10,
      ) || 100,
    ),
  );
  const previewSplitBackgroundXValue = Math.min(
    24,
    Math.max(
      -24,
      Number.parseInt(previewFieldValues["split_background_x"] ?? "0", 10) || 0,
    ),
  );
  const previewSplitBackgroundYValue = Math.min(
    24,
    Math.max(
      -24,
      Number.parseInt(previewFieldValues["split_background_y"] ?? "0", 10) || 0,
    ),
  );
  const previewOutroBackgroundScaleValue = Math.min(
    180,
    Math.max(
      50,
      Number.parseInt(
        previewFieldValues["outro_background_scale"] ?? "100",
        10,
      ) || 100,
    ),
  );
  const previewOutroBackgroundXValue = Math.min(
    24,
    Math.max(
      -24,
      Number.parseInt(previewFieldValues["outro_background_x"] ?? "0", 10) || 0,
    ),
  );
  const previewOutroBackgroundYValue = Math.min(
    24,
    Math.max(
      -24,
      Number.parseInt(previewFieldValues["outro_background_y"] ?? "0", 10) || 0,
    ),
  );
  const motionDurationSeconds = resolveMotionDurationSeconds(fieldValues);
  const audioAssetFieldId = getTemplateAudioAssetFieldId(templateId);
  const selectedAudioAssetId = audioAssetFieldId
    ? (fieldValues[audioAssetFieldId] ?? "")
    : "";
  const selectedSplitForegroundAssetId = isIntroSplitTemplate
    ? (fieldValues["split_foreground_asset_id"] ?? "")
    : "";
  const selectedSplitBackgroundSvgAssetId = isIntroSplitTemplate
    ? (fieldValues["split_background_svg_asset_id"] ?? "")
    : "";
  const selectedOutroBackgroundSvgAssetId = isOutroTemplate
    ? (fieldValues["outro_background_svg_asset_id"] ?? "")
    : "";
  const previewSplitForegroundAssetId = isIntroSplitTemplate
    ? (previewFieldValues["split_foreground_asset_id"] ?? "")
    : "";
  const previewSplitBackgroundSvgAssetId = isIntroSplitTemplate
    ? (previewFieldValues["split_background_svg_asset_id"] ?? "")
    : "";
  const previewOutroBackgroundSvgAssetId = isOutroTemplate
    ? (previewFieldValues["outro_background_svg_asset_id"] ?? "")
    : "";
  const selectedSplitCornerIconAssetIds = isIntroSplitTemplate
    ? SPLIT_CORNER_ICON_FIELD_IDS.map((fieldId) => fieldValues[fieldId] ?? "")
    : ["", "", ""];
  const usedSplitCornerIconCount = isIntroSplitTemplate
    ? getUsedSplitCornerIconCount(selectedSplitCornerIconAssetIds)
    : 0;
  const previewSplitCornerIconAssetIds = isIntroSplitTemplate
    ? SPLIT_CORNER_ICON_FIELD_IDS.map(
        (fieldId) => previewFieldValues[fieldId] ?? "",
      )
    : ["", "", ""];
  const selectedAudioAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAudioAssetId) ?? null,
    [assets, selectedAudioAssetId],
  );
  const selectedSplitForegroundAsset = useMemo(
    () =>
      assets.find((asset) => asset.id === selectedSplitForegroundAssetId) ??
      null,
    [assets, selectedSplitForegroundAssetId],
  );
  const selectedSplitBackgroundSvgAsset = useMemo(
    () =>
      assets.find((asset) => asset.id === selectedSplitBackgroundSvgAssetId) ??
      null,
    [assets, selectedSplitBackgroundSvgAssetId],
  );
  const selectedOutroBackgroundSvgAsset = useMemo(
    () =>
      assets.find((asset) => asset.id === selectedOutroBackgroundSvgAssetId) ??
      null,
    [assets, selectedOutroBackgroundSvgAssetId],
  );
  const selectedSplitCornerIconAssets = useMemo(
    () =>
      selectedSplitCornerIconAssetIds.map(
        (assetId) => assets.find((asset) => asset.id === assetId) ?? null,
      ),
    [assets, selectedSplitCornerIconAssetIds],
  );
  const previewSplitForegroundAsset = useMemo(
    () =>
      assets.find((asset) => asset.id === previewSplitForegroundAssetId) ??
      null,
    [assets, previewSplitForegroundAssetId],
  );
  const previewSplitBackgroundSvgAsset = useMemo(
    () =>
      assets.find((asset) => asset.id === previewSplitBackgroundSvgAssetId) ??
      null,
    [assets, previewSplitBackgroundSvgAssetId],
  );
  const previewOutroBackgroundSvgAsset = useMemo(
    () =>
      assets.find((asset) => asset.id === previewOutroBackgroundSvgAssetId) ??
      null,
    [assets, previewOutroBackgroundSvgAssetId],
  );
  const previewSplitCornerIconAsset1 = useMemo(
    () =>
      assets.find((asset) => asset.id === previewSplitCornerIconAssetIds[0]) ??
      null,
    [assets, previewSplitCornerIconAssetIds],
  );
  const previewSplitCornerIconAsset2 = useMemo(
    () =>
      assets.find((asset) => asset.id === previewSplitCornerIconAssetIds[1]) ??
      null,
    [assets, previewSplitCornerIconAssetIds],
  );
  const previewSplitCornerIconAsset3 = useMemo(
    () =>
      assets.find((asset) => asset.id === previewSplitCornerIconAssetIds[2]) ??
      null,
    [assets, previewSplitCornerIconAssetIds],
  );
  const renderableSelectedAudioAssetUrl = useRenderableAssetUrl(
    selectedAudioAsset?.blobPath ?? null,
  );
  const renderableSplitForegroundAssetUrl = useRenderableAssetUrl(
    selectedSplitForegroundAsset?.blobPath ?? null,
  );
  const renderableSplitBackgroundSvgAssetUrl = useRenderableAssetUrl(
    selectedSplitBackgroundSvgAsset?.blobPath ?? null,
  );
  const renderableOutroBackgroundSvgAssetUrl = useRenderableAssetUrl(
    selectedOutroBackgroundSvgAsset?.blobPath ?? null,
  );
  const renderablePreviewSplitCornerIconUrl1 = useRenderableAssetUrl(
    previewSplitCornerIconAsset1?.blobPath ?? null,
  );
  const renderablePreviewSplitCornerIconUrl2 = useRenderableAssetUrl(
    previewSplitCornerIconAsset2?.blobPath ?? null,
  );
  const renderablePreviewSplitCornerIconUrl3 = useRenderableAssetUrl(
    previewSplitCornerIconAsset3?.blobPath ?? null,
  );
  const resolvedSplitForegroundAssetOptions = useMemo(() => {
    if (
      !selectedSplitForegroundAsset ||
      selectedSplitForegroundAsset.kind !== "image" ||
      splitForegroundAssetOptions.some(
        (option) => option.value === selectedSplitForegroundAsset.id,
      )
    ) {
      return splitForegroundAssetOptions;
    }

    return [
      ...splitForegroundAssetOptions,
      ...buildAssetOptions([selectedSplitForegroundAsset]),
    ];
  }, [selectedSplitForegroundAsset, splitForegroundAssetOptions]);
  const resolvedSplitBackgroundSvgAssetOptions = useMemo(() => {
    if (
      !selectedSplitBackgroundSvgAsset ||
      selectedSplitBackgroundSvgAsset.kind !== "image" ||
      splitBackgroundSvgAssetOptions.some(
        (option) => option.value === selectedSplitBackgroundSvgAsset.id,
      )
    ) {
      return splitBackgroundSvgAssetOptions;
    }

    return [
      ...splitBackgroundSvgAssetOptions,
      ...buildAssetOptions([selectedSplitBackgroundSvgAsset]),
    ];
  }, [selectedSplitBackgroundSvgAsset, splitBackgroundSvgAssetOptions]);
  const resolvedOutroBackgroundSvgAssetOptions = useMemo(() => {
    if (
      !selectedOutroBackgroundSvgAsset ||
      selectedOutroBackgroundSvgAsset.kind !== "image" ||
      splitBackgroundSvgAssetOptions.some(
        (option) => option.value === selectedOutroBackgroundSvgAsset.id,
      )
    ) {
      return splitBackgroundSvgAssetOptions;
    }

    return [
      ...splitBackgroundSvgAssetOptions,
      ...buildAssetOptions([selectedOutroBackgroundSvgAsset]),
    ];
  }, [selectedOutroBackgroundSvgAsset, splitBackgroundSvgAssetOptions]);
  const resolvedSplitCornerIconAssetOptions = useMemo(() => {
    const missingSelectedAssets = selectedSplitCornerIconAssets.filter(
      (asset) =>
        asset !== null &&
        asset.kind === "image" &&
        !splitCornerIconAssetOptions.some(
          (option) => option.value === asset.id,
        ),
    );

    if (missingSelectedAssets.length === 0) {
      return splitCornerIconAssetOptions;
    }

    return [
      ...splitCornerIconAssetOptions,
      ...buildAssetOptions(missingSelectedAssets),
    ];
  }, [selectedSplitCornerIconAssets, splitCornerIconAssetOptions]);
  const renderablePreviewSplitForegroundAssetUrl = useRenderableAssetUrl(
    previewSplitForegroundAsset?.blobPath ?? null,
  );
  const renderablePreviewSplitBackgroundSvgAssetUrl = useRenderableAssetUrl(
    previewSplitBackgroundSvgAsset?.blobPath ?? null,
  );
  const renderablePreviewOutroBackgroundSvgAssetUrl = useRenderableAssetUrl(
    previewOutroBackgroundSvgAsset?.blobPath ?? null,
  );
  const safeSelectedSplitForegroundAssetId = useMemo(
    () =>
      resolvedSplitForegroundAssetOptions.some(
        (option) => option.value === selectedSplitForegroundAssetId,
      )
        ? selectedSplitForegroundAssetId
        : "",
    [resolvedSplitForegroundAssetOptions, selectedSplitForegroundAssetId],
  );
  const safeSelectedSplitBackgroundSvgAssetId = useMemo(
    () =>
      resolvedSplitBackgroundSvgAssetOptions.some(
        (option) => option.value === selectedSplitBackgroundSvgAssetId,
      )
        ? selectedSplitBackgroundSvgAssetId
        : "",
    [resolvedSplitBackgroundSvgAssetOptions, selectedSplitBackgroundSvgAssetId],
  );
  const safeSelectedOutroBackgroundSvgAssetId = useMemo(
    () =>
      resolvedOutroBackgroundSvgAssetOptions.some(
        (option) => option.value === selectedOutroBackgroundSvgAssetId,
      )
        ? selectedOutroBackgroundSvgAssetId
        : "",
    [resolvedOutroBackgroundSvgAssetOptions, selectedOutroBackgroundSvgAssetId],
  );
  const safeSelectedSplitCornerIconAssetIds = useMemo(
    () =>
      selectedSplitCornerIconAssetIds.map((assetId) =>
        resolvedSplitCornerIconAssetOptions.some(
          (option) => option.value === assetId,
        )
          ? assetId
          : "",
      ),
    [resolvedSplitCornerIconAssetOptions, selectedSplitCornerIconAssetIds],
  );

  useEffect(() => {
    if (!isIntroSplitTemplate) {
      setActiveSplitDragIndex(null);
      setIsSplitBreakpointEditorVisible(false);
      setPreviewSplitBlendImageUrl(null);
      setExportSplitBlendImageUrl(null);
      setVisibleSplitCornerIconCount(0);
    }
  }, [isIntroSplitTemplate]);

  useEffect(() => {
    if (!isIntroSplitTemplate) {
      return;
    }

    const usedCount = getUsedSplitCornerIconCount(
      selectedSplitCornerIconAssetIds,
    );
    setVisibleSplitCornerIconCount((currentCount) =>
      Math.max(currentCount, usedCount),
    );
  }, [isIntroSplitTemplate, selectedSplitCornerIconAssetIds]);

  useEffect(() => {
    setPreviewFieldValues(fieldValues);
  }, [templateId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreviewFieldValues(fieldValues);
    }, PREVIEW_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [fieldValues]);

  useEffect(() => {
    if (!isIntroSplitTemplate || !renderablePreviewSplitForegroundAssetUrl) {
      setPreviewSplitBlendImageUrl(null);
      return;
    }

    let isCancelled = false;

    void (async () => {
      const nextBlendImageUrl = await buildSplitBlendBackground({
        foregroundImageUrl: renderablePreviewSplitForegroundAssetUrl,
        theme: currentTheme,
        width: currentPlatform.width,
        height: currentPlatform.height,
        mode: "preview",
      });

      if (isCancelled) {
        return;
      }

      setPreviewSplitBlendImageUrl(nextBlendImageUrl);
    })();

    return () => {
      isCancelled = true;
    };
  }, [
    currentPlatform.height,
    currentPlatform.width,
    currentTheme,
    isIntroSplitTemplate,
    renderablePreviewSplitForegroundAssetUrl,
  ]);

  useEffect(() => {
    setIsCapsuleEditorVisible(false);
  }, [templateId]);
  const TemplateComponent = TEMPLATE_COMPONENTS[templateId];
  const activeBannerName = profileName.trim() || "Untitled";
  const activeTemplateEntry = useMemo(
    () =>
      createTemplateEntryFromLegacySource({
        templateId,
        themeId,
        platformId,
        fieldValues,
        borderWidth,
        borderColor,
        fontPairId: selectedFontPairId,
        primaryFontFamily,
        secondaryFontFamily,
        fontSize,
        brandLogoUrl: resolvePersistedBrandLogoUrl({
          currentBrandLogoUrl: brandLogoUrl,
          settingsLogoUrl: settings.logo_url,
        }),
        brandLogoSize,
        showCopyrightMessage,
        copyrightText,
        tutorialImageUrl,
        tutorialImageSize,
        tutorialImageBottomPadding,
        tutorialImageOpacity,
        outroArrowOverlays,
      }),
    [
      borderColor,
      borderWidth,
      brandLogoSize,
      brandLogoUrl,
      copyrightText,
      fieldValues,
      fontSize,
      platformId,
      primaryFontFamily,
      secondaryFontFamily,
      selectedFontPairId,
      settings.logo_url,
      showCopyrightMessage,
      templateId,
      themeId,
      outroArrowOverlays,
      tutorialImageBottomPadding,
      tutorialImageOpacity,
      tutorialImageSize,
      tutorialImageUrl,
    ],
  );
  const resolvedTemplateEntries = useMemo(
    () => normalizeTemplateEntries(templateEntries, activeTemplateEntry),
    [activeTemplateEntry, templateEntries],
  );
  const storedTemplateCount = resolvedTemplateEntries.length;
  const selectedBanner =
    banners.find((banner) => banner.id === selectedBannerId) ?? null;

  const resolveTemplateState = useCallback(
    (
      bannerLike: Pick<
        DraftBannerState,
        | "templateId"
        | "templateEntries"
        | "themeId"
        | "platformId"
        | "fieldValues"
        | "borderWidth"
        | "borderColor"
        | "fontPairId"
        | "primaryFontFamily"
        | "secondaryFontFamily"
        | "fontSize"
        | "brandLogoUrl"
        | "brandLogoSize"
        | "showCopyrightMessage"
        | "copyrightText"
        | "tutorialImageUrl"
        | "tutorialImageSize"
        | "tutorialImageBottomPadding"
        | "tutorialImageOpacity"
        | "outroArrowOverlays"
      >,
    ) => {
      const fallbackEntry = createTemplateEntryFromLegacySource(bannerLike);
      const normalizedEntries = normalizeTemplateEntries(
        bannerLike.templateEntries,
        fallbackEntry,
      ).map((entry) => ({
        ...entry,
        brandLogoUrl: resolveLoadedBrandLogoUrl({
          storedBrandLogoUrl: entry.brandLogoUrl,
          settingsLogoUrl: settings.logo_url,
        }),
      }));
      const activeEntry = findTemplateEntry(
        normalizedEntries,
        bannerLike.templateId,
      ) ??
        normalizedEntries[0] ?? {
          ...fallbackEntry,
          brandLogoUrl: resolveLoadedBrandLogoUrl({
            storedBrandLogoUrl: fallbackEntry.brandLogoUrl,
            settingsLogoUrl: settings.logo_url,
          }),
        };

      return {
        templateEntries: normalizedEntries,
        activeEntry,
      };
    },
    [settings.logo_url],
  );

  const applyTemplateEntryState = useCallback(
    (entry: BannerTemplateEntry) => {
      const resolvedBorderColor =
        entry.borderColor || getThemeBorderColor(entry.themeId, themes);

      setTemplateId(entry.templateId);
      setThemeId(entry.themeId);
      setPlatformId(entry.platformId);
      setFieldValues({ ...entry.fieldValues });
      setBorderWidth(entry.borderWidth);
      setBorderColor(resolvedBorderColor);
      setHasCustomBorderColor(
        resolvedBorderColor.toLowerCase() !==
          getThemeBorderColor(entry.themeId, themes).toLowerCase(),
      );
      setSelectedFontPairId(entry.fontPairId);
      setSecondaryFontFamily(entry.secondaryFontFamily);
      setPrimaryFontFamily(entry.primaryFontFamily);
      setFontSize(clampFontSize(entry.fontSize));
      setBrandLogoUrl(entry.brandLogoUrl);
      setBrandLogoSize(clampBrandLogoSize(entry.brandLogoSize));
      setShowCopyrightMessage(entry.showCopyrightMessage ?? true);
      setCopyrightText(entry.copyrightText || DEFAULT_COPYRIGHT_TEXT);
      setTutorialImageUrl(entry.tutorialImageUrl);
      setTutorialImageSize(clampTutorialImagePercent(entry.tutorialImageSize));
      setTutorialImageBottomPadding(
        clampTutorialBottomPadding(entry.tutorialImageBottomPadding),
      );
      setTutorialImageOpacity(
        Math.min(100, Math.max(0, entry.tutorialImageOpacity)),
      );
      setOutroArrowOverlays(entry.outroArrowOverlays ?? []);
    },
    [themes],
  );

  const createSeededTemplateEntry = useCallback(
    (nextTemplateId: string): BannerTemplateEntry => ({
      ...activeTemplateEntry,
      templateId: nextTemplateId,
      fieldValues: getDefaultValues(nextTemplateId),
      outroArrowOverlays:
        nextTemplateId === "outro_thumbnail"
          ? activeTemplateEntry.outroArrowOverlays
          : [],
    }),
    [activeTemplateEntry],
  );

  // Handle template change
  const handleTemplateChange = useCallback(
    (newId: string) => {
      if (newId === templateId) {
        return;
      }

      const nextSelection = resolveTemplateSelection({
        entries: resolvedTemplateEntries,
        nextTemplateId: newId,
        createEntry: () => createSeededTemplateEntry(newId),
      });

      setTemplateEntries(nextSelection.templateEntries);
      setDraftWithSuppression(() => {
        applyTemplateEntryState(nextSelection.activeEntry);
      });
    },
    [
      applyTemplateEntryState,
      createSeededTemplateEntry,
      resolvedTemplateEntries,
      setDraftWithSuppression,
      templateId,
    ],
  );

  // Handle field change
  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleAddSplitCornerIcon = useCallback(() => {
    setVisibleSplitCornerIconCount((currentCount) =>
      currentCount === 0
        ? Math.max(1, usedSplitCornerIconCount)
        : Math.min(SPLIT_CORNER_ICON_FIELD_IDS.length, currentCount + 1),
    );
  }, [usedSplitCornerIconCount]);

  const handleHideSplitCornerIcons = useCallback(() => {
    setVisibleSplitCornerIconCount(0);
  }, []);

  const handleRemoveSplitCornerIcon = useCallback(
    (index: number) => {
      const fieldId = SPLIT_CORNER_ICON_FIELD_IDS[index];
      handleFieldChange(fieldId, "");
    },
    [handleFieldChange],
  );

  const commitSplitPartitionPoints = useCallback(
    (nextPoints: Array<{ x: number; y: number }>) => {
      handleFieldChange(
        "split_partition_points",
        serializeSplitPartitionPoints(nextPoints),
      );
    },
    [handleFieldChange],
  );

  const handleSplitBreakpointValueChange = useCallback(
    (index: number, axis: "x" | "y", rawValue: string) => {
      const parsedValue = Number.parseFloat(rawValue);
      if (!Number.isFinite(parsedValue)) {
        return;
      }

      const nextPoints = updateSplitBreakpoint(
        splitPartitionPoints,
        index,
        axis,
        parsedValue,
      );
      commitSplitPartitionPoints(nextPoints);
    },
    [commitSplitPartitionPoints, splitPartitionPoints],
  );

  const handleSplitBreakpointDelete = useCallback(
    (index: number) => {
      const nextPoints = removeSplitBreakpoint(splitPartitionPoints, index);
      commitSplitPartitionPoints(nextPoints);
    },
    [commitSplitPartitionPoints, splitPartitionPoints],
  );

  const handleSplitPreviewClick = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!isSplitBreakpointEditorVisible) {
        return;
      }

      if (skipSplitPreviewClickRef.current) {
        skipSplitPreviewClickRef.current = false;
        return;
      }

      const overlayRect = event.currentTarget.getBoundingClientRect();
      if (overlayRect.width <= 0 || overlayRect.height <= 0) {
        return;
      }

      const clickX = event.clientX - overlayRect.left;
      const clickY = event.clientY - overlayRect.top;
      const distanceFromDivider = getSplitDividerDistancePx(
        splitPartitionPoints,
        overlayRect.width,
        overlayRect.height,
        clickX,
        clickY,
      );

      if (distanceFromDivider > 18) {
        return;
      }

      if (splitPartitionPoints.length >= MAX_SPLIT_BREAKPOINTS) {
        toast.error(`You can add up to ${MAX_SPLIT_BREAKPOINTS} breakpoints.`);
        return;
      }

      const nextPoint = {
        x: (clickX / overlayRect.width) * SPLIT_PARTITION_MAX,
        y: (clickY / overlayRect.height) * SPLIT_PARTITION_MAX,
      };
      const hasVeryClosePoint = splitPartitionPoints.some(
        (point) =>
          Math.abs(point.x - nextPoint.x) < 0.25 &&
          Math.abs(point.y - nextPoint.y) < 0.25,
      );

      if (hasVeryClosePoint) {
        return;
      }

      const nextPoints = insertSplitBreakpoint(splitPartitionPoints, nextPoint);
      commitSplitPartitionPoints(nextPoints);
    },
    [
      commitSplitPartitionPoints,
      isSplitBreakpointEditorVisible,
      splitPartitionPoints,
    ],
  );

  const handleSplitBreakpointMouseDown = useCallback(
    (index: number, event: React.MouseEvent<SVGCircleElement>) => {
      if (!isSplitBreakpointEditorVisible) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      splitDragDidMoveRef.current = false;
      skipSplitPreviewClickRef.current = false;
      setActiveSplitDragIndex(index);
    },
    [isSplitBreakpointEditorVisible],
  );

  useEffect(() => {
    if (activeSplitDragIndex === null) {
      return;
    }

    if (!isSplitBreakpointEditorVisible) {
      setActiveSplitDragIndex(null);
      return;
    }

    function handlePointerMove(event: MouseEvent) {
      const overlayElement = splitPreviewRef.current;
      if (!overlayElement || activeSplitDragIndex === null) {
        return;
      }

      const overlayRect = overlayElement.getBoundingClientRect();
      if (overlayRect.width <= 0) {
        return;
      }

      const pointerX = Math.min(
        overlayRect.width,
        Math.max(0, event.clientX - overlayRect.left),
      );
      const nextX = (pointerX / overlayRect.width) * SPLIT_PARTITION_MAX;
      const nextPoints = updateSplitBreakpoint(
        splitPartitionPoints,
        activeSplitDragIndex,
        "x",
        nextX,
      );

      splitDragDidMoveRef.current = true;
      commitSplitPartitionPoints(nextPoints);
    }

    function handlePointerUp() {
      setActiveSplitDragIndex(null);

      if (splitDragDidMoveRef.current) {
        skipSplitPreviewClickRef.current = true;
      }
    }

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [
    activeSplitDragIndex,
    commitSplitPartitionPoints,
    isSplitBreakpointEditorVisible,
    splitPartitionPoints,
  ]);

  const handleFontPairChange = useCallback((pairId: string) => {
    setSelectedFontPairId(pairId);
    const pair = FONT_PAIR_PRESETS.find((preset) => preset.id === pairId);
    if (!pair) return;
    setSecondaryFontFamily(pair.secondaryFontFamily);
    setPrimaryFontFamily(pair.primaryFontFamily);
  }, []);

  const handleThemeChange = useCallback(
    (nextThemeId: string) => {
      setThemeId(nextThemeId);
      if (!hasCustomBorderColor) {
        setBorderColor(getThemeBorderColor(nextThemeId, themes));
      }
    },
    [hasCustomBorderColor, themes],
  );

  const handleBorderColorChange = useCallback(
    (nextBorderColor: string) => {
      setBorderColor(nextBorderColor);
      setHasCustomBorderColor(
        nextBorderColor.toLowerCase() !==
          getThemeBorderColor(themeId, themes).toLowerCase(),
      );
    },
    [themeId, themes],
  );

  const handleBrandLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setBrandLogoUrl(reader.result as string);
        reader.readAsDataURL(file);
      }
      input.value = "";
    },
    [],
  );

  const handleTutorialImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const file = e.target.files?.[0];
      if (file) {
        try {
          const rawDataUrl = await readFileAsDataUrl(file);
          if (isSvgFile(file)) {
            setTutorialImageUrl(rawDataUrl);
          } else {
            const croppedDataUrl = await cropTransparentMargins(rawDataUrl);
            setTutorialImageUrl(croppedDataUrl);
          }
        } catch {
          const fallbackDataUrl = await readFileAsDataUrl(file);
          setTutorialImageUrl(fallbackDataUrl);
        } finally {
          input.value = "";
        }
      } else {
        input.value = "";
      }
    },
    [],
  );

  const getBannerPayload = useCallback(
    (): Omit<BannerDoc, "id" | "updatedAt"> => ({
      name: profileName.trim() || "Untitled",
      ...activeTemplateEntry,
      templateEntries: resolvedTemplateEntries,
    }),
    [activeTemplateEntry, profileName, resolvedTemplateEntries],
  );

  const applyBannerPayload = useCallback(
    (banner: BannerDoc) => {
      const nextTemplateState = resolveTemplateState(banner);

      setDraftWithSuppression(() => {
        setTemplateEntries(nextTemplateState.templateEntries);
        applyTemplateEntryState(nextTemplateState.activeEntry);
        setProfileName(banner.name);
        setSelectedBannerId(banner.id);
      });
    },
    [applyTemplateEntryState, resolveTemplateState, setDraftWithSuppression],
  );

  const applyDraftState = useCallback(
    (draft: DraftBannerState) => {
      const nextTemplateState = resolveTemplateState(draft);

      setDraftWithSuppression(() => {
        setTemplateEntries(nextTemplateState.templateEntries);
        applyTemplateEntryState(nextTemplateState.activeEntry);
        setProfileName(draft.name);
        setSelectedBannerId(draft.bannerId ?? "");
      });
    },
    [applyTemplateEntryState, resolveTemplateState, setDraftWithSuppression],
  );

  useEffect(() => {
    if (!hasCustomBorderColor) {
      setBorderColor(getThemeBorderColor(themeId, themes));
    }
  }, [hasCustomBorderColor, themeId, themes]);

  useEffect(() => {
    if (themeOptions.some((option) => option.value === themeId)) {
      return;
    }

    setThemeId(currentThemeDefinition.id);
  }, [currentThemeDefinition.id, themeId, themeOptions]);

  useEffect(() => {
    if (!isAppStateHydrated) {
      return;
    }

    if (hasLoadedDraftRef.current) {
      return;
    }

    if (appState.currentDraft) {
      const draft = appState.currentDraft;
      const draftTemplateState = resolveTemplateState(draft);

      applyBannerPayload({
        id: draft.bannerId ?? "draft",
        name: draft.name,
        templateEntries: draftTemplateState.templateEntries,
        ...draftTemplateState.activeEntry,
        updatedAt: Date.now(),
      });
      previousSettingsLogoUrlRef.current = settings.logo_url;
      hasLoadedDraftRef.current = true;
      return;
    }

    if (settings.logo_url) {
      setDraftWithSuppression(() => {
        setBrandLogoUrl(settings.logo_url);
      });
    }
    previousSettingsLogoUrlRef.current = settings.logo_url;
    hasLoadedDraftRef.current = true;
  }, [
    appState.currentDraft,
    applyBannerPayload,
    isAppStateHydrated,
    setDraftWithSuppression,
    settings.logo_url,
    themes,
  ]);

  useEffect(() => {
    if (!hasLoadedDraftRef.current) {
      return;
    }

    const nextBrandLogoUrl = resolveBrandLogoUrlFromSettings({
      currentBrandLogoUrl: brandLogoUrl,
      previousSettingsLogoUrl: previousSettingsLogoUrlRef.current,
      nextSettingsLogoUrl: settings.logo_url,
    });

    previousSettingsLogoUrlRef.current = settings.logo_url;

    if (nextBrandLogoUrl === brandLogoUrl) {
      return;
    }

    setDraftWithSuppression(() => {
      setBrandLogoUrl(nextBrandLogoUrl);
    });
  }, [brandLogoUrl, setDraftWithSuppression, settings.logo_url]);

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const item = Array.from(event.clipboardData?.items ?? []).find((entry) =>
        entry.type.startsWith("image/"),
      );
      const file = item?.getAsFile();
      if (!file) {
        return;
      }

      event.preventDefault();
      void (async () => {
        const rawDataUrl = await readFileAsDataUrl(file);
        const imageDataUrl = isSvgFile(file)
          ? rawDataUrl
          : await cropTransparentMargins(rawDataUrl);
        setTutorialImageUrl(imageDataUrl);
        toast.success("Pasted image added to the tutorial image slot");
      })();
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const currentDraft = useCallback(
    (): DraftBannerState => ({
      bannerId: selectedBannerId || null,
      name: profileName.trim() || "Untitled",
      ...activeTemplateEntry,
      templateEntries: resolvedTemplateEntries,
    }),
    [
      activeTemplateEntry,
      profileName,
      resolvedTemplateEntries,
      selectedBannerId,
    ],
  );

  const currentDraftSnapshot = useMemo(() => currentDraft(), [currentDraft]);

  useEffect(() => {
    if (!hasLoadedDraftRef.current || suppressDraftWriteRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      void updateAppState({
        currentDraft: currentDraftSnapshot,
        draftDirty: true,
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [currentDraftSnapshot, updateAppState]);

  useEffect(() => {
    if (!isAppStateHydrated || !hasLoadedDraftRef.current) {
      return;
    }

    if (!historyRef.current) {
      historyRef.current = createThumbnailHistory(currentDraftSnapshot);
      return;
    }

    historyRef.current = pushThumbnailHistory(
      historyRef.current,
      currentDraftSnapshot,
    );
  }, [currentDraftSnapshot, isAppStateHydrated]);

  const handleUndo = useCallback(() => {
    if (!historyRef.current) {
      return;
    }

    const nextHistory = undoThumbnailHistory(historyRef.current);
    if (nextHistory.index === historyRef.current.index) {
      return;
    }

    historyRef.current = nextHistory;
    applyDraftState(nextHistory.snapshot);
  }, [applyDraftState]);

  const handleRedo = useCallback(() => {
    if (!historyRef.current) {
      return;
    }

    const nextHistory = redoThumbnailHistory(historyRef.current);
    if (nextHistory.index === historyRef.current.index) {
      return;
    }

    historyRef.current = nextHistory;
    applyDraftState(nextHistory.snapshot);
  }, [applyDraftState]);

  const handleSaveProfile = useCallback(
    async ({
      bannerId,
      bannerName,
    }: {
      bannerId?: string;
      bannerName?: string;
    } = {}) => {
      const name = (bannerName ?? profileName).trim();
      if (!name) {
        toast.error("Banner name is required");
        return false;
      }

      const resolvedBannerId = bannerId ?? selectedBannerId ?? undefined;

      setProfileName(name);

      try {
        const id = await saveBanner({
          ...getBannerPayload(),
          name,
          id: resolvedBannerId,
        });
        const savedBannerId = id ?? resolvedBannerId ?? "";

        if (savedBannerId) {
          setSelectedBannerId(savedBannerId);
        }

        await updateAppState({
          currentDraft: {
            ...currentDraft(),
            bannerId: savedBannerId || null,
            name,
          },
          draftDirty: false,
        });
        toast.success(
          resolvedBannerId ? `Updated "${name}"` : `Saved "${name}"`,
        );
        return true;
      } catch (err) {
        console.error("Failed to save banner:", err);
        toast.error("Failed to save");
        return false;
      }
    },
    [
      currentDraft,
      getBannerPayload,
      profileName,
      saveBanner,
      selectedBannerId,
      updateAppState,
    ],
  );

  const handleLoadProfile = useCallback(
    async (bannerId: string) => {
      if (!bannerId) {
        toast.error("Select a banner to load");
        return false;
      }

      const banner = await getBanner(bannerId);
      if (banner) {
        const nextTemplateState = resolveTemplateState(banner);

        applyBannerPayload(banner);
        await updateAppState({
          currentDraft: {
            bannerId: banner.id,
            name: banner.name,
            ...nextTemplateState.activeEntry,
            templateEntries: nextTemplateState.templateEntries,
          },
          draftDirty: false,
        });
        return true;
      }

      toast.error("Banner not found");
      return false;
    },
    [
      getBanner,
      applyBannerPayload,
      setDraftWithSuppression,
      settings.logo_url,
      updateAppState,
    ],
  );

  const handleDeleteProfile = useCallback(
    async (bannerId: string) => {
      if (!bannerId) {
        return;
      }

      try {
        await deleteBanner(bannerId);

        const deletedCurrentBanner = selectedBannerId === bannerId;

        if (deletedCurrentBanner) {
          setSelectedBannerId("");
          await updateAppState({
            currentDraft: {
              ...currentDraft(),
              bannerId: null,
            },
            draftDirty: true,
          });
        }

        if (dialogSelectedBannerId === bannerId) {
          setDialogSelectedBannerId("");
        }

        toast.success("Deleted");
      } catch (error) {
        console.error("Failed to delete banner:", error);
        toast.error("Failed to delete");
      }
    },
    [
      currentDraft,
      deleteBanner,
      dialogSelectedBannerId,
      selectedBannerId,
      updateAppState,
    ],
  );

  const openBannerDialog = useCallback(
    (mode: "load" | "save") => {
      const dialogState = buildBannerDialogState({
        mode,
        profileName,
        selectedBannerId,
        banners: banners.map((banner) => ({
          id: banner.id,
          name: banner.name,
        })),
      });

      setBannerDialogMode(mode);
      setBannerDialogName(dialogState.bannerName);
      setDialogSelectedBannerId(dialogState.selectedBannerId);
    },
    [banners, profileName, selectedBannerId],
  );

  const closeBannerDialog = useCallback(() => {
    setBannerDialogMode(null);
  }, []);

  const handleBannerDialogSelection = useCallback(
    (bannerId: string) => {
      setDialogSelectedBannerId(bannerId);

      if (bannerDialogMode !== "save") {
        return;
      }

      const banner = banners.find((entry) => entry.id === bannerId);
      if (banner) {
        setBannerDialogName(banner.name);
      }
    },
    [bannerDialogMode, banners],
  );

  const handleConfirmBannerDialog = useCallback(async () => {
    if (bannerDialogMode === "load") {
      const loaded = await handleLoadProfile(dialogSelectedBannerId);
      if (loaded) {
        closeBannerDialog();
      }
      return;
    }

    if (bannerDialogMode === "save") {
      const saved = await handleSaveProfile({
        bannerId: dialogSelectedBannerId || undefined,
        bannerName: bannerDialogName,
      });

      if (saved) {
        closeBannerDialog();
      }
    }
  }, [
    bannerDialogMode,
    bannerDialogName,
    closeBannerDialog,
    dialogSelectedBannerId,
    handleLoadProfile,
    handleSaveProfile,
  ]);

  const handleSaveShortcut = useCallback(async () => {
    const saved = await handleSaveProfile();
    if (saved) {
      await syncOnSave();
    }
  }, [handleSaveProfile, syncOnSave]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const action = resolveThumbnailShortcutAction(event);
      if (!action) {
        return;
      }

      event.preventDefault();

      if (action === "save") {
        void handleSaveShortcut();
        return;
      }

      if (action === "undo") {
        handleUndo();
        return;
      }

      handleRedo();
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [handleRedo, handleSaveShortcut, handleUndo]);

  const handleDeleteFromDialog = useCallback(async () => {
    if (!dialogSelectedBannerId) {
      return;
    }

    const remainingBanners = banners.filter(
      (banner) => banner.id !== dialogSelectedBannerId,
    );

    await handleDeleteProfile(dialogSelectedBannerId);

    if (remainingBanners[0]) {
      setDialogSelectedBannerId(remainingBanners[0].id);
      if (bannerDialogMode === "save") {
        setBannerDialogName(remainingBanners[0].name);
      }
    } else {
      setDialogSelectedBannerId("");
      if (bannerDialogMode === "save") {
        setBannerDialogName(profileName.trim());
      }
    }
  }, [
    bannerDialogMode,
    banners,
    dialogSelectedBannerId,
    handleDeleteProfile,
    profileName,
  ]);

  const clearBannerDialogSelection = useCallback(() => {
    setDialogSelectedBannerId("");
    if (bannerDialogMode === "save") {
      setBannerDialogName(profileName.trim());
    }
  }, [bannerDialogMode, profileName]);

  const goHome = useCallback(() => {
    window.location.assign("/");
  }, []);

  const pageTitle = buildThumbnailPageTitle(currentTemplate?.name);
  const templateAssetBindings = resolveThumbnailTemplateAssetBindings({
    templateId,
    tutorialImageUrl,
    splitForegroundAssetUrl: renderablePreviewSplitForegroundAssetUrl,
    splitBackgroundSvgAssetUrl: renderablePreviewSplitBackgroundSvgAssetUrl,
    outroBackgroundSvgAssetUrl: renderablePreviewOutroBackgroundSvgAssetUrl,
  });

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  const templateRenderProps = buildThumbnailTemplateRenderProps({
    width: currentPlatform.width,
    height: currentPlatform.height,
    values: previewFieldValues,
    theme: previewTheme,
    primaryFontFamily,
    secondaryFontFamily,
    fontSize,
    borderWidth,
    borderColor,
    overlayImageUrl: templateAssetBindings.overlayImageUrl,
    overlayImageScale: isIntroSplitTemplate
      ? previewSplitBackgroundScaleValue
      : isOutroTemplate
        ? previewOutroBackgroundScaleValue
        : undefined,
    overlayImageX: isIntroSplitTemplate
      ? previewSplitBackgroundXValue
      : isOutroTemplate
        ? previewOutroBackgroundXValue
        : undefined,
    overlayImageY: isIntroSplitTemplate
      ? previewSplitBackgroundYValue
      : isOutroTemplate
        ? previewOutroBackgroundYValue
        : undefined,
    splitBlendImageUrl: isIntroSplitTemplate
      ? (exportSplitBlendImageUrl ?? previewSplitBlendImageUrl)
      : null,
    splitCornerIconUrls: isIntroSplitTemplate
      ? [
          renderablePreviewSplitCornerIconUrl1,
          renderablePreviewSplitCornerIconUrl2,
          renderablePreviewSplitCornerIconUrl3,
        ].filter((url): url is string => Boolean(url))
      : undefined,
    splitCornerIconSize: isIntroSplitTemplate
      ? Number.parseInt(
          previewFieldValues["split_corner_icon_size"] ?? "100",
          10,
        )
      : undefined,
    brandLogoUrl: renderableBrandLogoUrl,
    brandLogoSize,
    tutorialImageUrl: templateAssetBindings.tutorialImageUrl,
    tutorialImageSize,
    tutorialImageBottomPadding,
    tutorialImageOpacity,
    outroArrowOverlays,
    showCopyrightMessage,
    copyrightText,
  });

  const handleExportMain = useCallback(async () => {
    if (!canvasRef.current) return;
    const name =
      fieldValues["title"]?.trim() || currentTemplate?.name || "thumbnail";
    const safeFilename = name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    await exportPng(canvasRef.current, `${safeFilename}_image.png`);
  }, [currentTemplate?.name, exportPng, fieldValues]);

  const handleExportMotion = useCallback(async () => {
    if (!canvasRef.current) return;

    if (selectedAudioAsset && !renderableSelectedAudioAssetUrl) {
      toast.error(
        "Audio track is still loading. Try exporting again in a moment.",
      );
      return;
    }

    const name =
      fieldValues["title"]?.trim() || currentTemplate?.name || "thumbnail";
    const safeFilename = name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    await exportMotion(canvasRef.current, `${safeFilename}_motion.mp4`, {
      durationSeconds: motionDurationSeconds,
      audioUrl: renderableSelectedAudioAssetUrl,
    });
  }, [
    currentTemplate?.name,
    exportMotion,
    fieldValues,
    motionDurationSeconds,
    renderableSelectedAudioAssetUrl,
    selectedAudioAsset,
  ]);

  const containerWidth = 720;
  const previewScale = containerWidth / currentPlatform.width;

  return (
    <PageLayout
      header={
        <AppBar
          title={pageTitle}
          showHomeButton
          onHomeClick={goHome}
          rightContent={
            <Stack direction="row" spacing={1}>
              <SyncMenu />
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
      <EditorLayout
        settings={
          <SettingsPanel title="Thumbnail Settings">
            <Stack spacing={2}>
              <SectionCard
                title="Start Here"
                icon={<DashboardIcon />}
                collapsible
                defaultExpanded
              >
                <Stack spacing={2.5}>
                  <Typography variant="body2" color="text.secondary">
                    Load a saved banner first if you want a reusable starting
                    point, then choose the template and output size for this
                    version.
                  </Typography>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    useFlexGap
                  >
                    <ActionButton
                      label="Load Banner"
                      variant="secondary"
                      onClick={() => openBannerDialog("load")}
                      fullWidth
                    />
                    <ActionButton
                      label="Save Banner"
                      variant="secondary"
                      onClick={() => openBannerDialog("save")}
                      icon={<SaveIcon />}
                      fullWidth
                    />
                  </Stack>
                  <Stack spacing={1}>
                    <StatusChip
                      label={
                        selectedBanner
                          ? `Loaded: ${selectedBanner.name} · ${storedTemplateCount} template${storedTemplateCount === 1 ? "" : "s"}`
                          : `Working draft: ${activeBannerName} · ${storedTemplateCount} template${storedTemplateCount === 1 ? "" : "s"}`
                      }
                      status={selectedBanner ? "info" : "default"}
                    />
                  </Stack>
                  <Stack spacing={2} {...CONTROL_ROW_SX}>
                    <Box sx={CONTROL_CELL_SX}>
                      <SelectControl
                        label="Template"
                        value={templateId}
                        onChange={handleTemplateChange}
                        options={THUMBNAIL_TEMPLATES.map((t) => ({
                          value: t.id,
                          label: t.name,
                        }))}
                        tooltip="Choose the layout style for this thumbnail"
                      />
                    </Box>
                    <Box sx={CONTROL_CELL_SX}>
                      <SelectControl
                        label="Resolution"
                        value={platformId}
                        onChange={setPlatformId}
                        options={PLATFORM_PRESETS.map((p) => ({
                          value: p.id,
                          label: p.name,
                        }))}
                        tooltip="Output resolution for the thumbnail"
                      />
                    </Box>
                  </Stack>
                  {currentTemplate && (
                    <Typography variant="caption" color="text.secondary">
                      {currentTemplate.description}
                    </Typography>
                  )}
                </Stack>
              </SectionCard>

              {currentTemplate && (
                <SectionCard
                  title="Content"
                  icon={<TextFieldsIcon />}
                  collapsible
                  defaultExpanded
                >
                  <Stack spacing={2}>
                    {primaryContentFieldRows.map((row) => (
                      <Stack
                        key={row.map((field) => field.id).join("-")}
                        spacing={2}
                        {...CONTROL_ROW_SX}
                      >
                        {row.map((field) => (
                          <Box key={field.id} sx={CONTROL_CELL_SX}>
                            {isOutroTemplate && field.id === "subtitle" ? (
                              <Stack spacing={1}>
                                {renderTemplateFieldControl({
                                  field,
                                  value:
                                    fieldValues[field.id] ??
                                    field.defaultValue ??
                                    "",
                                  onChange: (nextValue) =>
                                    handleFieldChange(field.id, nextValue),
                                })}
                                <ActionButton
                                  label="Add Support Line"
                                  variant="secondary"
                                  onClick={() =>
                                    handleFieldChange(
                                      "subtitle",
                                      `${fieldValues["subtitle"] ?? field.defaultValue ?? ""}\n`,
                                    )
                                  }
                                />
                              </Stack>
                            ) : (
                              renderTemplateFieldControl({
                                field,
                                value:
                                  fieldValues[field.id] ??
                                  field.defaultValue ??
                                  "",
                                onChange: (nextValue) =>
                                  handleFieldChange(field.id, nextValue),
                                errorText:
                                  field.id === "split_partition_points"
                                    ? splitPartitionError
                                    : null,
                                helperText:
                                  field.id === "split_partition_points"
                                    ? "Use points like: (12, 3), (9, 12), (12, 24). Coordinates can be any value from 0 to 24."
                                    : undefined,
                              })
                            )}
                          </Box>
                        ))}
                      </Stack>
                    ))}
                    {isIntroSplitTemplate && (
                      <Stack spacing={1.5}>
                        <ActionButton
                          label={
                            isSplitBreakpointEditorVisible
                              ? "Hide Breakpoints"
                              : "Show Breakpoints"
                          }
                          variant="secondary"
                          onClick={() =>
                            setIsSplitBreakpointEditorVisible(
                              (current) => !current,
                            )
                          }
                        />
                        {isSplitBreakpointEditorVisible && (
                          <Stack spacing={1.5}>
                            <Typography variant="subtitle2">
                              Breakpoints
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Click near the split line in preview to add a
                              breakpoint. Drag points left or right to reshape
                              the split.
                            </Typography>
                            {splitPartitionError && (
                              <Typography variant="caption" color="error.main">
                                {splitPartitionError}
                              </Typography>
                            )}
                            {splitPartitionPoints.map((point, index) => (
                              <Stack
                                key={`split-breakpoint-${index}-${point.x}-${point.y}`}
                                spacing={2}
                                {...CONTROL_ROW_SX}
                              >
                                <Box sx={CONTROL_CELL_SX}>
                                  <TextField
                                    label={`Point ${index + 1} X`}
                                    value={String(point.x)}
                                    onChange={(event) =>
                                      handleSplitBreakpointValueChange(
                                        index,
                                        "x",
                                        event.target.value,
                                      )
                                    }
                                    size="small"
                                    fullWidth
                                    type="number"
                                    inputProps={{
                                      min: 0,
                                      max: 24,
                                      step: 0.1,
                                    }}
                                    sx={TEXT_INPUT_SX}
                                  />
                                </Box>
                                <Box sx={CONTROL_CELL_SX}>
                                  <TextField
                                    label={`Point ${index + 1} Y`}
                                    value={String(point.y)}
                                    onChange={(event) =>
                                      handleSplitBreakpointValueChange(
                                        index,
                                        "y",
                                        event.target.value,
                                      )
                                    }
                                    size="small"
                                    fullWidth
                                    type="number"
                                    inputProps={{
                                      min: 0,
                                      max: 24,
                                      step: 0.1,
                                    }}
                                    sx={TEXT_INPUT_SX}
                                  />
                                </Box>
                                <Box sx={{ pt: { xs: 0, lg: 0.8 } }}>
                                  <IconButton
                                    color="error"
                                    onClick={() =>
                                      handleSplitBreakpointDelete(index)
                                    }
                                    disabled={splitPartitionPoints.length <= 2}
                                    aria-label={`Delete breakpoint ${index + 1}`}
                                  >
                                    <DeleteOutlineIcon />
                                  </IconButton>
                                </Box>
                              </Stack>
                            ))}
                          </Stack>
                        )}
                      </Stack>
                    )}
                    {hasCapsuleControls && (
                      <Stack spacing={1.5}>
                        <ActionButton
                          label={
                            isCapsuleEditorVisible
                              ? "Hide Capsules"
                              : "Show Capsules"
                          }
                          variant="secondary"
                          onClick={() =>
                            setIsCapsuleEditorVisible((current) => !current)
                          }
                        />
                        {isCapsuleEditorVisible && (
                          <Stack spacing={2}>
                            {capsuleContentFieldRows.map((row) => (
                              <Stack
                                key={row.map((field) => field.id).join("-")}
                                spacing={2}
                                {...CONTROL_ROW_SX}
                              >
                                {row.map((field) => (
                                  <Box key={field.id} sx={CONTROL_CELL_SX}>
                                    {renderTemplateFieldControl({
                                      field,
                                      value:
                                        fieldValues[field.id] ??
                                        field.defaultValue ??
                                        "",
                                      onChange: (nextValue) =>
                                        handleFieldChange(field.id, nextValue),
                                    })}
                                  </Box>
                                ))}
                              </Stack>
                            ))}

                            {hasCapsuleStyleControls && (
                              <Stack spacing={2} {...CONTROL_ROW_SX}>
                                <Box sx={CONTROL_CELL_SX}>
                                  <SelectControl
                                    label="Capsule Style"
                                    value={capsuleStyleValue}
                                    onChange={(value) =>
                                      handleFieldChange("capsule_style", value)
                                    }
                                    options={CAPSULE_STYLE_OPTIONS}
                                  />
                                </Box>
                                <Box sx={CONTROL_CELL_SX}>
                                  {renderColorTextField({
                                    label: "Capsule Color",
                                    value: capsuleColorValue,
                                    onChange: (value) =>
                                      handleFieldChange("capsule_color", value),
                                  })}
                                </Box>
                                <Box sx={CONTROL_CELL_SX}>
                                  <SelectControl
                                    label="Capsule Size"
                                    value={capsuleSizeValue}
                                    onChange={(value) =>
                                      handleFieldChange("capsule_size", value)
                                    }
                                    options={SIZE_PRESET_OPTIONS}
                                  />
                                </Box>
                              </Stack>
                            )}
                          </Stack>
                        )}
                      </Stack>
                    )}
                  </Stack>
                </SectionCard>
              )}

              <SectionCard
                title="Style"
                icon={<PaletteIcon />}
                collapsible
                defaultExpanded
              >
                <Stack spacing={2} sx={{ pr: "5%" }}>
                  <SelectControl
                    label="Color Theme"
                    value={themeId}
                    onChange={handleThemeChange}
                    options={themeOptions}
                    tooltip="Color scheme for the thumbnail"
                  />
                  {hasSurfaceControls && (
                    <Stack spacing={2} {...CONTROL_ROW_SX}>
                      <Box sx={CONTROL_CELL_SX}>
                        <SelectControl
                          label="Title Surface"
                          value={selectedSurfaceStyle}
                          onChange={(value) =>
                            handleFieldChange("surface_style", value)
                          }
                          options={SURFACE_STYLE_OPTIONS}
                        />
                      </Box>
                      <Box sx={CONTROL_CELL_SX}>
                        <SelectControl
                          label="Title Shadow"
                          value={selectedSurfaceShadow}
                          onChange={(value) =>
                            handleFieldChange("surface_shadow", value)
                          }
                          options={SURFACE_SHADOW_OPTIONS}
                        />
                      </Box>
                    </Stack>
                  )}
                  {hasBorderControls && (
                    <Stack spacing={2} {...CONTROL_ROW_SX}>
                      <Box sx={CONTROL_CELL_SX}>
                        <SelectControl
                          label="Border Style"
                          value={selectedBorderStyle}
                          onChange={(value) =>
                            handleFieldChange("border_style", value)
                          }
                          options={BORDER_STYLE_OPTIONS}
                        />
                      </Box>
                      <Box sx={CONTROL_CELL_SX}>
                        {renderColorTextField({
                          label: "Border Color 1",
                          value: borderColor,
                          onChange: handleBorderColorChange,
                        })}
                      </Box>
                      <Box sx={CONTROL_CELL_SX}>
                        {renderColorTextField({
                          label: "Border Color 2",
                          value: secondaryBorderColorValue,
                          onChange: (value) =>
                            handleFieldChange("border_color_secondary", value),
                          disabled: selectedBorderStyle !== "gradient",
                        })}
                      </Box>
                    </Stack>
                  )}
                  <Stack spacing={2} {...CONTROL_ROW_SX}>
                    <Box sx={CONTROL_CELL_SX}>
                      <SelectControl
                        label="Font Pair"
                        value={selectedFontPairId}
                        onChange={handleFontPairChange}
                        options={FONT_PAIR_PRESETS.map((pair) => ({
                          value: pair.id,
                          label: pair.label,
                        }))}
                        tooltip="Curated combinations from common web typography pairings"
                      />
                    </Box>
                    <Box sx={CONTROL_CELL_SX}>
                      <SelectControl
                        label="Title Font"
                        value={secondaryFontFamily}
                        onChange={(value) => {
                          setSecondaryFontFamily(value);
                          setSelectedFontPairId("");
                        }}
                        options={GOOGLE_FONTS}
                        tooltip="Applied to main title/headline"
                      />
                    </Box>
                    <Box sx={CONTROL_CELL_SX}>
                      <SelectControl
                        label="Body Font"
                        value={primaryFontFamily}
                        onChange={(value) => {
                          setPrimaryFontFamily(value);
                          setSelectedFontPairId("");
                        }}
                        options={GOOGLE_FONTS}
                        tooltip="Applied to description, badge, episode and supporting text"
                      />
                    </Box>
                  </Stack>
                  <Stack spacing={2} {...CONTROL_ROW_SX}>
                    <Box sx={CONTROL_CELL_SX}>
                      {renderColorTextField({
                        label: "Primary Font Color",
                        value:
                          fieldValues["font_color_primary"]?.trim() ||
                          currentTheme.textPrimary,
                        onChange: (value) =>
                          handleFieldChange("font_color_primary", value),
                      })}
                    </Box>
                    <Box sx={CONTROL_CELL_SX}>
                      {renderColorTextField({
                        label: "Secondary Font Color",
                        value:
                          fieldValues["font_color_secondary"]?.trim() ||
                          currentTheme.textSecondary,
                        onChange: (value) =>
                          handleFieldChange("font_color_secondary", value),
                      })}
                    </Box>
                  </Stack>
                  <SliderControl
                    label="Font Size"
                    value={fontSize}
                    onChange={(value) => setFontSize(clampFontSize(value))}
                    min={FONT_SIZE_MIN}
                    max={FONT_SIZE_MAX}
                    step={2}
                    formatValue={(v) => `${v}px`}
                    tooltip="Base font size in pixels"
                  />
                  <SliderControl
                    label="Border Width"
                    value={borderWidth}
                    onChange={setBorderWidth}
                    min={0}
                    max={200}
                    step={1}
                    formatValue={(v) => (v === 0 ? "None" : `${v}px`)}
                    tooltip="4K-reference border width that scales consistently across 1K, 2K, and 4K exports"
                  />
                </Stack>
              </SectionCard>

              <SectionCard
                title="Footer"
                icon={<TextFieldsIcon />}
                collapsible
                defaultExpanded
              >
                <Stack spacing={2}>
                  <Stack spacing={2} {...CONTROL_ROW_SX}>
                    <Box sx={CONTROL_CELL_SX}>
                      <SelectControl
                        label="Show Copyright"
                        value={showCopyrightMessage ? "true" : "false"}
                        onChange={(value) =>
                          setShowCopyrightMessage(value === "true")
                        }
                        options={[
                          { value: "true", label: "On" },
                          { value: "false", label: "Off" },
                        ]}
                        tooltip="Show or hide the footer copyright message"
                      />
                    </Box>
                    <Box sx={CONTROL_CELL_SX}>
                      <SelectControl
                        label="Footer Size"
                        value={fieldValues["footer_size"] ?? "small"}
                        onChange={(value) =>
                          handleFieldChange("footer_size", value)
                        }
                        options={SIZE_PRESET_OPTIONS}
                        tooltip="Scale the footer from the current small default up to medium or large"
                      />
                    </Box>
                  </Stack>
                  <Box sx={{ py: 1 }}>
                    <Typography sx={CONTROL_LABEL_SX}>
                      Copyright Text
                    </Typography>
                    <TextField
                      value={copyrightText}
                      onChange={(event) => setCopyrightText(event.target.value)}
                      size="small"
                      fullWidth
                      sx={TEXT_INPUT_SX}
                    />
                  </Box>
                </Stack>
              </SectionCard>

              <SectionCard
                title="Assets"
                icon={<ImageIcon />}
                collapsible
                defaultExpanded
              >
                <Stack spacing={2}>
                  {templateCapabilities.showsBrandLogo && (
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2">Brand Logo</Typography>
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
                          p: 1.5,
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <ImageIcon
                            sx={{ fontSize: 18, color: "primary.main" }}
                          />
                          <Typography variant="body2" color="primary">
                            {brandLogoUrl
                              ? "Change Brand Logo"
                              : "Upload Brand Logo"}
                          </Typography>
                        </Stack>
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleBrandLogoUpload}
                        />
                      </Box>
                      {brandLogoUrl && (
                        <Stack spacing={1}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              p: 1,
                              bgcolor: "background.default",
                              borderRadius: 1,
                            }}
                          >
                            <img
                              src={renderableBrandLogoUrl ?? undefined}
                              alt="Brand logo preview"
                              style={{
                                maxWidth: 120,
                                maxHeight: 48,
                                objectFit: "contain",
                              }}
                            />
                          </Box>
                          <ActionButton
                            label="Remove Logo"
                            variant="secondary"
                            onClick={() => setBrandLogoUrl(null)}
                          />
                          <SliderControl
                            label="Logo Size"
                            value={brandLogoSize}
                            onChange={(value) =>
                              setBrandLogoSize(clampBrandLogoSize(value))
                            }
                            min={60}
                            max={120}
                            step={5}
                            formatValue={(v) => `${v}px`}
                            tooltip="Width of the brand logo"
                          />
                        </Stack>
                      )}
                    </Stack>
                  )}

                  {templateCapabilities.showsTutorialImage && (
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2">
                        {tutorialImageSectionTitle}
                      </Typography>
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
                          p: 1.5,
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <ImageIcon
                            sx={{ fontSize: 18, color: "primary.main" }}
                          />
                          <Typography variant="body2" color="primary">
                            {tutorialImageUploadLabel}
                          </Typography>
                        </Stack>
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleTutorialImageUpload}
                        />
                      </Box>
                      {tutorialImageUrl && (
                        <Stack spacing={1}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              p: 1,
                              bgcolor: "background.default",
                              borderRadius: 1,
                            }}
                          >
                            <img
                              src={tutorialImageUrl}
                              alt={`${tutorialImageSectionTitle} preview`}
                              style={{
                                maxWidth: 120,
                                maxHeight: 80,
                                objectFit: "contain",
                              }}
                            />
                          </Box>
                          <SliderControl
                            label="Image Scale"
                            value={tutorialImageSize}
                            onChange={(value) =>
                              setTutorialImageSize(
                                clampTutorialImagePercent(value),
                              )
                            }
                            min={50}
                            max={250}
                            step={1}
                            formatValue={(v) => `${v}%`}
                            tooltip="Scales tutorial image from baseline size"
                          />
                          {templateCapabilities.showsTutorialImageBottomPadding && (
                            <SliderControl
                              label="Bottom Padding"
                              value={tutorialImageBottomPadding}
                              onChange={(value) =>
                                setTutorialImageBottomPadding(
                                  clampTutorialBottomPadding(value),
                                )
                              }
                              min={0}
                              max={160}
                              step={1}
                              formatValue={(v) => `${v}px`}
                              tooltip="Distance from canvas bottom to tutorial image anchor"
                            />
                          )}
                          {templateCapabilities.showsTutorialImageOpacity && (
                            <SliderControl
                              label="Image Opacity"
                              value={tutorialImageOpacity}
                              onChange={(value) =>
                                setTutorialImageOpacity(
                                  Math.min(100, Math.max(0, value)),
                                )
                              }
                              min={0}
                              max={100}
                              step={1}
                              formatValue={(v) => `${v}%`}
                              tooltip="Opacity of the tutorial image"
                            />
                          )}
                          <ActionButton
                            label="Remove Image"
                            variant="secondary"
                            onClick={() => setTutorialImageUrl(null)}
                          />
                        </Stack>
                      )}
                    </Stack>
                  )}
                  {isIntroSplitTemplate && (
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2">Split Assets</Typography>
                      <SelectControl
                        label="Foreground Image Asset"
                        value={safeSelectedSplitForegroundAssetId}
                        onChange={(value) =>
                          handleFieldChange("split_foreground_asset_id", value)
                        }
                        options={[
                          { value: "", label: "None" },
                          ...resolvedSplitForegroundAssetOptions,
                        ]}
                        tooltip="Shows image assets tagged with split from Asset Library"
                      />
                      {renderableSplitForegroundAssetUrl && (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            p: 1,
                            bgcolor: "background.default",
                            borderRadius: 1,
                          }}
                        >
                          <img
                            src={renderableSplitForegroundAssetUrl}
                            alt="Split foreground preview"
                            style={{
                              maxWidth: 160,
                              maxHeight: 100,
                              objectFit: "contain",
                            }}
                          />
                        </Box>
                      )}
                      <Stack spacing={2} {...CONTROL_ROW_SX}>
                        <Box sx={CONTROL_CELL_SX}>
                          <SliderControl
                            label="Foreground Scale"
                            value={Math.min(
                              180,
                              Math.max(
                                50,
                                Number.parseInt(
                                  fieldValues["split_foreground_scale"] ??
                                    "108",
                                  10,
                                ) || 108,
                              ),
                            )}
                            onChange={(value) =>
                              handleFieldChange(
                                "split_foreground_scale",
                                String(Math.round(value)),
                              )
                            }
                            min={50}
                            max={180}
                            step={1}
                            formatValue={(value) => `${value}%`}
                            tooltip="Scale for split foreground image"
                          />
                        </Box>
                        <Box sx={CONTROL_CELL_SX}>
                          <SliderControl
                            label="Foreground X"
                            value={Math.min(
                              24,
                              Math.max(
                                -24,
                                Number.parseInt(
                                  fieldValues["split_foreground_x"] ?? "0",
                                  10,
                                ) || 0,
                              ),
                            )}
                            onChange={(value) =>
                              handleFieldChange(
                                "split_foreground_x",
                                String(Math.round(value)),
                              )
                            }
                            min={-24}
                            max={24}
                            step={1}
                            formatValue={(value) => `${value}%`}
                            tooltip="Horizontal offset for split foreground image"
                          />
                        </Box>
                        <Box sx={CONTROL_CELL_SX}>
                          <SliderControl
                            label="Foreground Y"
                            value={Math.min(
                              24,
                              Math.max(
                                -24,
                                Number.parseInt(
                                  fieldValues["split_foreground_y"] ?? "0",
                                  10,
                                ) || 0,
                              ),
                            )}
                            onChange={(value) =>
                              handleFieldChange(
                                "split_foreground_y",
                                String(Math.round(value)),
                              )
                            }
                            min={-24}
                            max={24}
                            step={1}
                            formatValue={(value) => `${value}%`}
                            tooltip="Vertical offset for split foreground image"
                          />
                        </Box>
                      </Stack>
                      <SelectControl
                        label="Background SVG Asset"
                        value={safeSelectedSplitBackgroundSvgAssetId}
                        onChange={(value) =>
                          handleFieldChange(
                            "split_background_svg_asset_id",
                            value,
                          )
                        }
                        options={[
                          { value: "", label: "None" },
                          ...resolvedSplitBackgroundSvgAssetOptions,
                        ]}
                        tooltip="Shows image assets tagged with background from Asset Library"
                      />
                      {renderableSplitBackgroundSvgAssetUrl && (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            p: 1,
                            bgcolor: "background.default",
                            borderRadius: 1,
                          }}
                        >
                          <img
                            src={renderableSplitBackgroundSvgAssetUrl}
                            alt="Split background preview"
                            style={{
                              maxWidth: 160,
                              maxHeight: 100,
                              objectFit: "contain",
                            }}
                          />
                        </Box>
                      )}
                      <Stack spacing={2} {...CONTROL_ROW_SX}>
                        <Box sx={CONTROL_CELL_SX}>
                          <SliderControl
                            label="Background SVG Scale"
                            value={splitBackgroundScaleValue}
                            onChange={(value) =>
                              handleFieldChange(
                                "split_background_scale",
                                String(
                                  Math.round(
                                    Math.min(180, Math.max(50, value)),
                                  ),
                                ),
                              )
                            }
                            min={50}
                            max={180}
                            step={1}
                            formatValue={(value) => `${value}%`}
                            tooltip="Scale for split background asset"
                          />
                        </Box>
                        <Box sx={CONTROL_CELL_SX}>
                          <SliderControl
                            label="Background SVG X"
                            value={splitBackgroundXValue}
                            onChange={(value) =>
                              handleFieldChange(
                                "split_background_x",
                                String(
                                  Math.round(
                                    Math.min(24, Math.max(-24, value)),
                                  ),
                                ),
                              )
                            }
                            min={-24}
                            max={24}
                            step={1}
                            formatValue={(value) => `${value}%`}
                            tooltip="Horizontal offset for split background asset"
                          />
                        </Box>
                        <Box sx={CONTROL_CELL_SX}>
                          <SliderControl
                            label="Background SVG Y"
                            value={splitBackgroundYValue}
                            onChange={(value) =>
                              handleFieldChange(
                                "split_background_y",
                                String(
                                  Math.round(
                                    Math.min(24, Math.max(-24, value)),
                                  ),
                                ),
                              )
                            }
                            min={-24}
                            max={24}
                            step={1}
                            formatValue={(value) => `${value}%`}
                            tooltip="Vertical offset for split background asset"
                          />
                        </Box>
                      </Stack>
                      <SliderControl
                        label="Background SVG Opacity"
                        value={splitBackgroundOpacityValue}
                        onChange={(value) =>
                          handleFieldChange(
                            "split_background_opacity",
                            String(
                              Math.min(100, Math.max(0, Math.round(value))),
                            ),
                          )
                        }
                        min={0}
                        max={100}
                        step={1}
                        formatValue={(v) => `${v}%`}
                        tooltip="Controls visibility of the split background SVG layer"
                      />
                      <Stack spacing={1}>
                        <Typography sx={CONTROL_LABEL_SX}>
                          Foreground Edge Blend
                        </Typography>
                        <Stack spacing={2} {...CONTROL_ROW_SX}>
                          <Box sx={CONTROL_CELL_SX}>
                            <SwitchControl
                              label="Blend Top"
                              checked={
                                fieldValues["split_foreground_blend_top"] ===
                                "true"
                              }
                              onChange={(checked) =>
                                handleFieldChange(
                                  "split_foreground_blend_top",
                                  checked ? "true" : "false",
                                )
                              }
                              tooltip="Fade the top 10% of the foreground image into the background"
                            />
                          </Box>
                          <Box sx={CONTROL_CELL_SX}>
                            <SwitchControl
                              label="Blend Bottom"
                              checked={
                                fieldValues["split_foreground_blend_bottom"] ===
                                "true"
                              }
                              onChange={(checked) =>
                                handleFieldChange(
                                  "split_foreground_blend_bottom",
                                  checked ? "true" : "false",
                                )
                              }
                              tooltip="Fade the bottom 10% of the foreground image into the background"
                            />
                          </Box>
                        </Stack>
                        <Stack spacing={2} {...CONTROL_ROW_SX}>
                          <Box sx={CONTROL_CELL_SX}>
                            <SwitchControl
                              label="Blend Left"
                              checked={
                                fieldValues["split_foreground_blend_left"] ===
                                "true"
                              }
                              onChange={(checked) =>
                                handleFieldChange(
                                  "split_foreground_blend_left",
                                  checked ? "true" : "false",
                                )
                              }
                              tooltip="Fade the left 10% of the foreground image into the background"
                            />
                          </Box>
                          <Box sx={CONTROL_CELL_SX}>
                            <SwitchControl
                              label="Blend Right"
                              checked={
                                fieldValues["split_foreground_blend_right"] ===
                                "true"
                              }
                              onChange={(checked) =>
                                handleFieldChange(
                                  "split_foreground_blend_right",
                                  checked ? "true" : "false",
                                )
                              }
                              tooltip="Fade the right 10% of the foreground image into the background"
                            />
                          </Box>
                        </Stack>
                      </Stack>
                      {visibleSplitCornerIconCount > 0 && (
                        <Stack spacing={2} {...CONTROL_ROW_SX}>
                          {SPLIT_CORNER_ICON_FIELD_IDS.slice(
                            0,
                            visibleSplitCornerIconCount,
                          ).map((fieldId, index) => (
                            <Box key={fieldId} sx={CONTROL_CELL_SX}>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="flex-start"
                              >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <SelectControl
                                    label={`Corner Icon ${index + 1}`}
                                    value={
                                      safeSelectedSplitCornerIconAssetIds[
                                        index
                                      ] ?? ""
                                    }
                                    onChange={(value) =>
                                      handleFieldChange(fieldId, value)
                                    }
                                    options={[
                                      { value: "", label: "None" },
                                      ...resolvedSplitCornerIconAssetOptions,
                                    ]}
                                    tooltip="Select a shared icon asset tagged with icon to place in the bottom corner opposite the title"
                                  />
                                </Box>
                                <IconButton
                                  aria-label={`Remove Icon ${index + 1}`}
                                  onClick={() =>
                                    handleRemoveSplitCornerIcon(index)
                                  }
                                  size="small"
                                  sx={{ mt: 0.75 }}
                                >
                                  <DeleteOutlineIcon />
                                </IconButton>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      )}
                      <Stack spacing={2} {...CONTROL_ROW_SX}>
                        {visibleSplitCornerIconCount <
                          SPLIT_CORNER_ICON_FIELD_IDS.length && (
                          <Box sx={CONTROL_CELL_SX}>
                            <ActionButton
                              label="Add Icon"
                              variant="secondary"
                              icon={<AddCircleOutlineIcon />}
                              onClick={handleAddSplitCornerIcon}
                            />
                          </Box>
                        )}
                        {visibleSplitCornerIconCount > 0 && (
                          <Box sx={CONTROL_CELL_SX}>
                            <ActionButton
                              label="Hide Icons"
                              variant="secondary"
                              onClick={handleHideSplitCornerIcons}
                            />
                          </Box>
                        )}
                      </Stack>
                      <SliderControl
                        label="Corner Icon Size"
                        value={Math.min(
                          180,
                          Math.max(
                            50,
                            Number.parseInt(
                              fieldValues["split_corner_icon_size"] ?? "100",
                              10,
                            ) || 100,
                          ),
                        )}
                        onChange={(value) =>
                          handleFieldChange(
                            "split_corner_icon_size",
                            String(Math.round(value)),
                          )
                        }
                        min={50}
                        max={180}
                        step={5}
                        formatValue={(value) => `${value}%`}
                        tooltip="Scale the bottom-corner split icons"
                      />
                      <ActionButton
                        label="Open Asset Library"
                        variant="secondary"
                        onClick={() => window.location.assign("/assets")}
                      />
                    </Stack>
                  )}
                  {isOutroTemplate && (
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2">
                        Background SVG Asset
                      </Typography>
                      <SelectControl
                        label="Background SVG Asset"
                        value={safeSelectedOutroBackgroundSvgAssetId}
                        onChange={(value) =>
                          handleFieldChange(
                            "outro_background_svg_asset_id",
                            value,
                          )
                        }
                        options={[
                          { value: "", label: "None" },
                          ...resolvedOutroBackgroundSvgAssetOptions,
                        ]}
                        tooltip="Shows image assets tagged with background from Asset Library"
                      />
                      {renderableOutroBackgroundSvgAssetUrl && (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            p: 1,
                            bgcolor: "background.default",
                            borderRadius: 1,
                          }}
                        >
                          <img
                            src={renderableOutroBackgroundSvgAssetUrl}
                            alt="Outro background preview"
                            style={{
                              maxWidth: 160,
                              maxHeight: 100,
                              objectFit: "contain",
                            }}
                          />
                        </Box>
                      )}
                      <Stack spacing={2} {...CONTROL_ROW_SX}>
                        <Box sx={CONTROL_CELL_SX}>
                          <SliderControl
                            label="Background SVG Scale"
                            value={outroBackgroundScaleValue}
                            onChange={(value) =>
                              handleFieldChange(
                                "outro_background_scale",
                                String(
                                  Math.round(
                                    Math.min(180, Math.max(50, value)),
                                  ),
                                ),
                              )
                            }
                            min={50}
                            max={180}
                            step={1}
                            formatValue={(value) => `${value}%`}
                            tooltip="Scale for outro background asset"
                          />
                        </Box>
                        <Box sx={CONTROL_CELL_SX}>
                          <SliderControl
                            label="Background SVG X"
                            value={outroBackgroundXValue}
                            onChange={(value) =>
                              handleFieldChange(
                                "outro_background_x",
                                String(
                                  Math.round(
                                    Math.min(24, Math.max(-24, value)),
                                  ),
                                ),
                              )
                            }
                            min={-24}
                            max={24}
                            step={1}
                            formatValue={(value) => `${value}%`}
                            tooltip="Horizontal offset for outro background asset"
                          />
                        </Box>
                        <Box sx={CONTROL_CELL_SX}>
                          <SliderControl
                            label="Background SVG Y"
                            value={outroBackgroundYValue}
                            onChange={(value) =>
                              handleFieldChange(
                                "outro_background_y",
                                String(
                                  Math.round(
                                    Math.min(24, Math.max(-24, value)),
                                  ),
                                ),
                              )
                            }
                            min={-24}
                            max={24}
                            step={1}
                            formatValue={(value) => `${value}%`}
                            tooltip="Vertical offset for outro background asset"
                          />
                        </Box>
                      </Stack>
                      <SliderControl
                        label="Background SVG Opacity"
                        value={outroBackgroundOpacityValue}
                        onChange={(value) =>
                          handleFieldChange(
                            "outro_background_opacity",
                            String(
                              Math.min(100, Math.max(0, Math.round(value))),
                            ),
                          )
                        }
                        min={0}
                        max={100}
                        step={1}
                        formatValue={(value) => `${value}%`}
                        tooltip="Controls visibility of the outro background SVG layer"
                      />
                    </Stack>
                  )}
                  {templateCapabilities.showsSharedAudioAsset &&
                    audioAssetFieldId && (
                      <Stack spacing={1.5}>
                        <Typography variant="subtitle2">Audio Track</Typography>
                        <SelectControl
                          label="Shared Audio Asset"
                          value={selectedAudioAssetId}
                          onChange={(value) =>
                            handleFieldChange(audioAssetFieldId, value)
                          }
                          options={[
                            { value: "", label: "None" },
                            ...audioAssetOptions,
                          ]}
                          tooltip="Select a shared uploaded MP3 or other audio asset for this intro/outro template"
                        />
                        <Typography variant="caption" color="text.secondary">
                          Upload shared audio once in the Asset Library, then
                          reuse it across intro and outro templates.
                        </Typography>
                        {selectedAudioAsset ? (
                          <Stack spacing={1}>
                            <Stack
                              direction="row"
                              spacing={1}
                              useFlexGap
                              flexWrap="wrap"
                            >
                              <StatusChip
                                label={selectedAudioAsset.kind}
                                status="info"
                              />
                              <StatusChip
                                label={selectedAudioAsset.fileName}
                                status="default"
                              />
                            </Stack>
                            <Box
                              component="audio"
                              src={renderableSelectedAudioAssetUrl ?? undefined}
                              controls
                              sx={{ width: "100%" }}
                            />
                            <ActionButton
                              label="Clear Audio"
                              variant="secondary"
                              onClick={() =>
                                handleFieldChange(audioAssetFieldId, "")
                              }
                            />
                          </Stack>
                        ) : (
                          <ActionButton
                            label="Open Asset Library"
                            variant="secondary"
                            onClick={() => window.location.assign("/assets")}
                          />
                        )}
                      </Stack>
                    )}
                </Stack>
              </SectionCard>
            </Stack>

            <Box sx={{ mt: 2 }}>
              <Stack spacing={1}>
                <SliderControl
                  label="Motion Length"
                  value={motionDurationSeconds}
                  onChange={(value) =>
                    handleFieldChange("motion_duration_seconds", String(value))
                  }
                  min={1}
                  max={15}
                  step={1}
                  formatValue={(value) => `${value}s`}
                  tooltip="Export a fixed-frame motion video for the selected number of seconds"
                />
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  useFlexGap
                >
                  <ActionButton
                    label="Export Image"
                    variant="primary"
                    onClick={handleExportMain}
                    loading={isImageExporting}
                    icon={<DownloadIcon />}
                    fullWidth
                  />
                  <ActionButton
                    label="Export Motion Video"
                    variant="secondary"
                    onClick={handleExportMotion}
                    loading={isMotionExporting}
                    icon={<DownloadIcon />}
                    fullWidth
                  />
                </Stack>
              </Stack>
            </Box>
          </SettingsPanel>
        }
        preview={
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 3,
              overflow: "auto",
            }}
          >
            <Box
              sx={{
                transform: `scale(${previewScale})`,
                transformOrigin: "center center",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: currentPlatform.width,
                  height: currentPlatform.height,
                }}
              >
                <div ref={canvasRef}>
                  {TemplateComponent ? (
                    <TemplateComponent {...templateRenderProps} />
                  ) : (
                    <Box
                      sx={{
                        width: currentPlatform.width,
                        height: currentPlatform.height,
                        bgcolor: "background.paper",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography color="text.secondary">
                        Select a template
                      </Typography>
                    </Box>
                  )}
                </div>
                {isIntroSplitTemplate &&
                  TemplateComponent &&
                  isSplitBreakpointEditorVisible && (
                    <svg
                      ref={splitPreviewRef}
                      width={currentPlatform.width}
                      height={currentPlatform.height}
                      onClick={handleSplitPreviewClick}
                      style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 20,
                        cursor: "crosshair",
                      }}
                    >
                      <polyline
                        points={splitPartitionPoints
                          .map((point) => {
                            const x =
                              (point.x / SPLIT_PARTITION_MAX) *
                              currentPlatform.width;
                            const y =
                              (point.y / SPLIT_PARTITION_MAX) *
                              currentPlatform.height;
                            return `${x.toFixed(2)},${y.toFixed(2)}`;
                          })
                          .join(" ")}
                        fill="none"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth={Math.max(
                          2,
                          currentPlatform.width * 0.0012,
                        )}
                        strokeDasharray={`${Math.max(8, currentPlatform.width * 0.004)} ${Math.max(6, currentPlatform.width * 0.0028)}`}
                        opacity={0.8}
                        pointerEvents="none"
                      />
                      {splitPartitionPoints.map((point, index) => {
                        const x =
                          (point.x / SPLIT_PARTITION_MAX) *
                          currentPlatform.width;
                        const y =
                          (point.y / SPLIT_PARTITION_MAX) *
                          currentPlatform.height;

                        return (
                          <g
                            key={`split-preview-point-${index}-${point.x}-${point.y}`}
                          >
                            <circle
                              cx={x}
                              cy={y}
                              r={Math.max(8, currentPlatform.width * 0.0032)}
                              fill="rgba(34, 211, 238, 0.55)"
                              stroke="rgba(255,255,255,0.95)"
                              strokeWidth={Math.max(
                                1.5,
                                currentPlatform.width * 0.0009,
                              )}
                              onMouseDown={(event) =>
                                handleSplitBreakpointMouseDown(index, event)
                              }
                              style={{
                                cursor:
                                  activeSplitDragIndex === index
                                    ? "grabbing"
                                    : "ew-resize",
                              }}
                            />
                          </g>
                        );
                      })}
                    </svg>
                  )}
              </Box>
            </Box>
          </Box>
        }
      />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      {bannerDialogMode && (
        <BannerLibraryDialog
          open
          mode={bannerDialogMode}
          banners={banners}
          selectedBannerId={dialogSelectedBannerId}
          bannerName={bannerDialogName}
          onBannerNameChange={setBannerDialogName}
          onSelectBanner={handleBannerDialogSelection}
          onClearSelection={clearBannerDialogSelection}
          onClose={closeBannerDialog}
          onConfirm={handleConfirmBannerDialog}
          onDeleteSelected={handleDeleteFromDialog}
        />
      )}
    </PageLayout>
  );
}
