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
import toast from "react-hot-toast";

import {
  PageLayout,
  AppBar,
  EditorLayout,
  SettingsPanel,
  SectionCard,
  SelectControl,
  SliderControl,
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
import {
  OUTRO_ARROW_ASSET_RESOURCES,
  OUTRO_ARROW_THICKNESS_OPTIONS,
  OUTRO_ARROW_TYPE_OPTIONS,
  createDefaultOutroArrowOverlay,
  type OutroArrowAssetType,
  type OutroArrowOverlay,
} from "../templates/outroArrowAssets";
import { DEFAULT_THEME_ID } from "../themes/themeDefinitions";
import { useExport } from "../hooks/useExport";
import { useAssets } from "../hooks/useAssets";
import { useBanners, type BannerDoc } from "../hooks/useBanners";
import { useAppState, type DraftBannerState } from "../hooks/useAppState";
import { useRenderableAssetUrl } from "../hooks/useRenderableAssetUrl";
import { useSettings } from "../hooks/useSettings";
import { useThemes } from "../hooks/useThemes";
import { BannerLibraryDialog } from "../components/BannerLibraryDialog";
import { SettingsDialog } from "../components/SettingsDialog";
import { SyncMenu } from "../components/SyncMenu";
import {
  createTemplateEntryFromLegacySource,
  findTemplateEntry,
  normalizeTemplateEntries,
  resolveTemplateSelection,
  type BannerTemplateEntry,
} from "../persistence/bannerTemplateEntries";
import {
  DEFAULT_COPYRIGHT_TEXT,
  buildThumbnailTemplateRenderProps,
  buildBannerDialogState,
  buildThumbnailContentFieldRows,
  clampBrandLogoSize,
  getTemplateAudioAssetFieldId,
  getThumbnailTemplateCapabilities,
  getThemeBorderColor,
  resolveExportActionLoadingState,
  resolveMotionDurationSeconds,
  resolveLoadedBrandLogoUrl,
  resolveBrandLogoUrlFromSettings,
  resolvePersistedBrandLogoUrl,
} from "./thumbnailSettings";

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

const OUTRO_ARROW_ORIENTATION_OPTIONS = [
  { value: "false", label: "Regular" },
  { value: "true", label: "Inverse" },
];

const FIELD_LABEL_OVERRIDES: Record<string, string> = {
  show_duration_capsule: "Duration Capsule",
  show_level_capsule: "Skill Capsule",
  show_instructor_capsule: "Instructor Capsule",
  show_hands_on_lab_capsule: "Hands-On Lab Capsule",
  show_bite_capsule: "Bite Capsule",
  show_speed_capsule: "Speed Capsule",
  source_label: "Bite From",
  source_title: "Original Video Title",
  show_outro_image: "Suggested Preview Image",
  title_size: "Title Style",
  secondary_size: "Secondary Style",
};

function renderTemplateFieldControl({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
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
        sx={TEXT_INPUT_SX}
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
  const { isImageExporting, isMotionExporting } = useMemo(
    () => resolveExportActionLoadingState(activeExportActions),
    [activeExportActions],
  );
  const { banners, saveBanner, deleteBanner, getBanner } = useBanners();
  const {
    appState,
    updateAppState,
    isHydrated: isAppStateHydrated,
  } = useAppState();
  const { settings } = useSettings();
  const { themes, themeOptions, getTheme, getRenderableTheme } = useThemes();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bannerDialogMode, setBannerDialogMode] = useState<
    "load" | "save" | null
  >(null);
  const [bannerDialogName, setBannerDialogName] = useState("");
  const [dialogSelectedBannerId, setDialogSelectedBannerId] = useState("");
  const hasLoadedDraftRef = useRef(false);
  const suppressDraftWriteRef = useRef(false);
  const previousSettingsLogoUrlRef = useRef<string | null>(null);

  // State
  const [templateId, setTemplateId] = useState(
    THUMBNAIL_TEMPLATES[0]?.id ?? "tutorial_thumbnail",
  );
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [platformId, setPlatformId] = useState("landscape_4k");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    getDefaultValues(THUMBNAIL_TEMPLATES[0]?.id ?? "tutorial_thumbnail"),
  );
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
  const { assets, audioAssetOptions } = useAssets();
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
  const currentThemeDefinition = getTheme(themeId);
  const currentPlatform =
    PLATFORM_PRESETS.find((p) => p.id === platformId) ?? PLATFORM_PRESETS[0]!;
  const currentTemplate = THUMBNAIL_TEMPLATES.find((t) => t.id === templateId);
  const isOutroTemplate = templateId === "outro_thumbnail";
  const currentTemplateFields = currentTemplate?.fields ?? [];
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
    fieldValues["border_color_secondary"]?.trim() || currentTheme.textSecondary;
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
  const templateCapabilities = getThumbnailTemplateCapabilities(templateId);
  const tutorialImageSectionTitle = isOutroTemplate
    ? "Suggested Preview Image"
    : "Tutorial Image";
  const tutorialImageUploadLabel = tutorialImageUrl
    ? `Change ${tutorialImageSectionTitle}`
    : `Upload ${tutorialImageSectionTitle}`;
  const audioAssetFieldId = getTemplateAudioAssetFieldId(templateId);
  const selectedAudioAssetId = audioAssetFieldId
    ? (fieldValues[audioAssetFieldId] ?? "")
    : "";
  const selectedAudioAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAudioAssetId) ?? null,
    [assets, selectedAudioAssetId],
  );
  const renderableSelectedAudioAssetUrl = useRenderableAssetUrl(
    selectedAudioAsset?.blobPath ?? null,
  );
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
      setFontSize(entry.fontSize);
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

  const handleAddOutroArrowOverlay = useCallback(() => {
    setOutroArrowOverlays((prev) => {
      const nextOverlay = createDefaultOutroArrowOverlay();
      const offset = prev.length * 4;

      return [
        ...prev,
        {
          ...nextOverlay,
          x: Math.min(92, nextOverlay.x + offset),
          y: Math.min(88, nextOverlay.y + offset),
        },
      ];
    });
  }, []);

  const handleRemoveOutroArrowOverlay = useCallback((overlayId: string) => {
    setOutroArrowOverlays((prev) =>
      prev.filter((overlay) => overlay.id !== overlayId),
    );
  }, []);

  const handleOutroArrowOverlayChange = useCallback(
    (overlayId: string, updates: Partial<OutroArrowOverlay>) => {
      setOutroArrowOverlays((prev) =>
        prev.map((overlay) =>
          overlay.id === overlayId ? { ...overlay, ...updates } : overlay,
        ),
      );
    },
    [],
  );

  const handleOutroArrowTypeChange = useCallback(
    (overlayId: string, nextType: OutroArrowAssetType) => {
      setOutroArrowOverlays((prev) =>
        prev.map((overlay) => {
          if (overlay.id !== overlayId) {
            return overlay;
          }

          const previousDefaultText =
            OUTRO_ARROW_ASSET_RESOURCES[overlay.type].defaultText;
          const nextDefaultText =
            OUTRO_ARROW_ASSET_RESOURCES[nextType].defaultText;

          return {
            ...overlay,
            type: nextType,
            text:
              !overlay.text.trim() || overlay.text === previousDefaultText
                ? nextDefaultText
                : overlay.text,
          };
        }),
      );
    },
    [],
  );

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

  useEffect(() => {
    if (!hasLoadedDraftRef.current || suppressDraftWriteRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      void updateAppState({
        currentDraft: currentDraft(),
        draftDirty: true,
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [currentDraft, updateAppState]);

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

  const templateRenderProps = buildThumbnailTemplateRenderProps({
    width: currentPlatform.width,
    height: currentPlatform.height,
    values: fieldValues,
    theme: currentTheme,
    primaryFontFamily,
    secondaryFontFamily,
    fontSize,
    borderWidth,
    borderColor,
    brandLogoUrl: renderableBrandLogoUrl,
    brandLogoSize,
    tutorialImageUrl,
    tutorialImageSize,
    tutorialImageBottomPadding,
    tutorialImageOpacity,
    outroArrowOverlays,
    socialAccounts: settings.social_accounts,
    showCopyrightMessage,
    copyrightText,
  });

  // Export handlers
  const motionDurationSeconds = resolveMotionDurationSeconds(fieldValues);

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

  // Scale for preview
  const containerWidth = 720;
  const previewScale = containerWidth / currentPlatform.width;

  if (!isAppStateHydrated || !hasLoadedDraftRef.current) {
    return (
      <PageLayout
        header={
          <AppBar
            title="Thumbnail Generator"
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
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
          }}
        >
          <CircularProgress />
        </Box>
        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={
        <AppBar
          title="Thumbnail Generator"
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
                    {contentFieldRows.map((row) => (
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
                  <SliderControl
                    label="Font Size"
                    value={fontSize}
                    onChange={setFontSize}
                    min={24}
                    max={96}
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

              {isOutroTemplate && (
                <SectionCard
                  title="Outro Arrows"
                  icon={<ImageIcon />}
                  collapsible
                  defaultExpanded
                >
                  <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      Add any number of shared arrow overlays, then place and
                      rotate each one independently for the outro layout.
                    </Typography>
                    <ActionButton
                      label="Add Arrow"
                      variant="secondary"
                      onClick={handleAddOutroArrowOverlay}
                    />
                    {outroArrowOverlays.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No arrow overlays added yet.
                      </Typography>
                    ) : (
                      outroArrowOverlays.map((overlay, index) => (
                        <Box
                          key={overlay.id}
                          sx={{
                            p: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 2,
                            bgcolor: "background.default",
                          }}
                        >
                          <Stack spacing={2}>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                              justifyContent="space-between"
                              alignItems={{ xs: "flex-start", sm: "center" }}
                            >
                              <Typography variant="subtitle2">
                                Arrow {index + 1}
                              </Typography>
                              <ActionButton
                                label="Remove Arrow"
                                variant="secondary"
                                onClick={() =>
                                  handleRemoveOutroArrowOverlay(overlay.id)
                                }
                              />
                            </Stack>
                            <Box sx={{ py: 1 }}>
                              <Typography sx={CONTROL_LABEL_SX}>
                                Text
                              </Typography>
                              <TextField
                                value={overlay.text}
                                onChange={(event) =>
                                  handleOutroArrowOverlayChange(overlay.id, {
                                    text: event.target.value,
                                  })
                                }
                                size="small"
                                fullWidth
                                sx={TEXT_INPUT_SX}
                              />
                            </Box>
                            <Stack spacing={2} {...CONTROL_ROW_SX}>
                              <Box sx={CONTROL_CELL_SX}>
                                <SelectControl
                                  label="Arrow Type"
                                  value={overlay.type}
                                  onChange={(value) =>
                                    handleOutroArrowTypeChange(
                                      overlay.id,
                                      value as OutroArrowAssetType,
                                    )
                                  }
                                  options={OUTRO_ARROW_TYPE_OPTIONS}
                                />
                              </Box>
                              <Box sx={CONTROL_CELL_SX}>
                                <SelectControl
                                  label="Orientation"
                                  value={overlay.isInverse ? "true" : "false"}
                                  onChange={(value) =>
                                    handleOutroArrowOverlayChange(overlay.id, {
                                      isInverse: value === "true",
                                    })
                                  }
                                  options={OUTRO_ARROW_ORIENTATION_OPTIONS}
                                />
                              </Box>
                            </Stack>
                            <Stack spacing={2} {...CONTROL_ROW_SX}>
                              <Box sx={CONTROL_CELL_SX}>
                                <SliderControl
                                  label="X Position"
                                  value={overlay.x}
                                  onChange={(value) =>
                                    handleOutroArrowOverlayChange(overlay.id, {
                                      x: value,
                                    })
                                  }
                                  min={0}
                                  max={100}
                                  step={1}
                                  formatValue={(value) => `${value}%`}
                                />
                              </Box>
                              <Box sx={CONTROL_CELL_SX}>
                                <SliderControl
                                  label="Y Position"
                                  value={overlay.y}
                                  onChange={(value) =>
                                    handleOutroArrowOverlayChange(overlay.id, {
                                      y: value,
                                    })
                                  }
                                  min={0}
                                  max={100}
                                  step={1}
                                  formatValue={(value) => `${value}%`}
                                />
                              </Box>
                              <Box sx={CONTROL_CELL_SX}>
                                <SliderControl
                                  label="Rotation"
                                  value={overlay.degree}
                                  onChange={(value) =>
                                    handleOutroArrowOverlayChange(overlay.id, {
                                      degree: value,
                                    })
                                  }
                                  min={0}
                                  max={360}
                                  step={1}
                                  formatValue={(value) => `${value}°`}
                                />
                              </Box>
                            </Stack>
                            <Stack spacing={2} {...CONTROL_ROW_SX}>
                              <Box sx={CONTROL_CELL_SX}>
                                <SliderControl
                                  label="Arrow Size"
                                  value={overlay.arrowSize}
                                  onChange={(value) =>
                                    handleOutroArrowOverlayChange(overlay.id, {
                                      arrowSize: value,
                                    })
                                  }
                                  min={50}
                                  max={200}
                                  step={1}
                                  formatValue={(value) => `${value}%`}
                                />
                              </Box>
                              <Box sx={CONTROL_CELL_SX}>
                                <SliderControl
                                  label="Text Size"
                                  value={overlay.textSize}
                                  onChange={(value) =>
                                    handleOutroArrowOverlayChange(overlay.id, {
                                      textSize: value,
                                    })
                                  }
                                  min={50}
                                  max={200}
                                  step={1}
                                  formatValue={(value) => `${value}%`}
                                />
                              </Box>
                              <Box sx={{ ...CONTROL_CELL_SX, minWidth: 0 }}>
                                <Typography sx={CONTROL_LABEL_SX}>
                                  Text Style
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                  <ActionButton
                                    label="Bold"
                                    variant={
                                      overlay.isBold ? "primary" : "secondary"
                                    }
                                    onClick={() =>
                                      handleOutroArrowOverlayChange(
                                        overlay.id,
                                        {
                                          isBold: !overlay.isBold,
                                        },
                                      )
                                    }
                                    sx={{ flex: 1, minWidth: 0 }}
                                  />
                                  <ActionButton
                                    label="Italic"
                                    variant={
                                      overlay.isItalic ? "primary" : "secondary"
                                    }
                                    onClick={() =>
                                      handleOutroArrowOverlayChange(
                                        overlay.id,
                                        {
                                          isItalic: !overlay.isItalic,
                                        },
                                      )
                                    }
                                    sx={{ flex: 1, minWidth: 0 }}
                                  />
                                </Stack>
                              </Box>
                              <Box sx={CONTROL_CELL_SX}>
                                <SelectControl
                                  label="Thickness"
                                  value={overlay.thickness}
                                  onChange={(value) =>
                                    handleOutroArrowOverlayChange(overlay.id, {
                                      thickness:
                                        value as OutroArrowOverlay["thickness"],
                                    })
                                  }
                                  options={OUTRO_ARROW_THICKNESS_OPTIONS.map(
                                    (option) => ({
                                      value: option.value,
                                      label: option.label,
                                    }),
                                  )}
                                />
                              </Box>
                            </Stack>
                          </Stack>
                        </Box>
                      ))
                    )}
                  </Stack>
                </SectionCard>
              )}
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
