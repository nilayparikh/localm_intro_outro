/**
 * ThumbnailPage - Thumbnail Generator Editor
 *
 * Full editor for creating thumbnails.
 * Uses EditorLayout with SettingsPanel for controls and a live preview canvas.
 * Profiles are stored in RxDB via useBanners hook (replaces localStorage).
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
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
  getTemplatesForTool,
  TEMPLATE_COMPONENTS,
  getDefaultValues,
} from "../templates/index";
import { DEFAULT_THEME_ID } from "../themes/themeDefinitions";
import { useExport } from "../hooks/useExport";
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
  DEFAULT_COPYRIGHT_TEXT,
  buildBannerDialogState,
  clampBrandLogoSize,
  getThumbnailTemplateCapabilities,
  getThemeBorderColor,
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
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasMainExportRef = useRef<HTMLDivElement>(null);
  const { exportPng, isExporting } = useExport();
  const { banners, saveBanner, deleteBanner, getBanner } = useBanners();
  const { appState, updateAppState } = useAppState();
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
  const [profileName, setProfileName] = useState("default");
  const [selectedBannerId, setSelectedBannerId] = useState("");
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
  const templateCapabilities = getThumbnailTemplateCapabilities(templateId);
  const TemplateComponent = TEMPLATE_COMPONENTS[templateId];
  const activeBannerName = profileName.trim() || "Untitled";
  const selectedBanner =
    banners.find((banner) => banner.id === selectedBannerId) ?? null;

  // Handle template change
  const handleTemplateChange = useCallback((newId: string) => {
    setTemplateId(newId);
    setFieldValues(getDefaultValues(newId));
  }, []);

  // Handle field change
  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

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
      templateId,
      themeId,
      platformId,
      fieldValues,
      borderWidth,
      borderColor,
      fontPairId: selectedFontPairId,
      secondaryFontFamily,
      primaryFontFamily,
      fontSize,
      brandLogoUrl,
      brandLogoSize,
      showCopyrightMessage,
      copyrightText,
      tutorialImageUrl,
      tutorialImageSize,
      tutorialImageBottomPadding,
      tutorialImageOpacity,
    }),
    [
      profileName,
      templateId,
      themeId,
      platformId,
      fieldValues,
      borderWidth,
      borderColor,
      selectedFontPairId,
      secondaryFontFamily,
      primaryFontFamily,
      fontSize,
      brandLogoUrl,
      brandLogoSize,
      showCopyrightMessage,
      copyrightText,
      tutorialImageUrl,
      tutorialImageSize,
      tutorialImageBottomPadding,
      tutorialImageOpacity,
    ],
  );

  const applyBannerPayload = useCallback(
    (banner: BannerDoc) => {
      const resolvedBorderColor =
        banner.borderColor || getThemeBorderColor(banner.themeId, themes);

      setDraftWithSuppression(() => {
        setTemplateId(banner.templateId);
        setThemeId(banner.themeId);
        setPlatformId(banner.platformId);
        setFieldValues(banner.fieldValues);
        setBorderWidth(banner.borderWidth);
        setBorderColor(resolvedBorderColor);
        setHasCustomBorderColor(
          resolvedBorderColor.toLowerCase() !==
            getThemeBorderColor(banner.themeId, themes).toLowerCase(),
        );
        setSelectedFontPairId(banner.fontPairId);
        setSecondaryFontFamily(banner.secondaryFontFamily);
        setPrimaryFontFamily(banner.primaryFontFamily);
        setFontSize(banner.fontSize);
        setBrandLogoUrl(banner.brandLogoUrl);
        setBrandLogoSize(clampBrandLogoSize(banner.brandLogoSize));
        setShowCopyrightMessage(banner.showCopyrightMessage ?? true);
        setCopyrightText(banner.copyrightText || DEFAULT_COPYRIGHT_TEXT);
        setTutorialImageUrl(banner.tutorialImageUrl);
        setTutorialImageSize(
          clampTutorialImagePercent(banner.tutorialImageSize),
        );
        setTutorialImageBottomPadding(
          clampTutorialBottomPadding(banner.tutorialImageBottomPadding),
        );
        setTutorialImageOpacity(
          Math.min(100, Math.max(0, banner.tutorialImageOpacity)),
        );
        setProfileName(banner.name);
        setSelectedBannerId(banner.id);
      });
    },
    [setDraftWithSuppression, themes],
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
    if (hasLoadedDraftRef.current) {
      return;
    }

    if (appState.currentDraft) {
      const draft = appState.currentDraft;
      applyBannerPayload({
        id: draft.bannerId ?? "draft",
        name: draft.name,
        templateId: draft.templateId,
        themeId: draft.themeId,
        platformId: draft.platformId,
        fieldValues: draft.fieldValues,
        borderWidth: draft.borderWidth,
        borderColor:
          draft.borderColor || getThemeBorderColor(draft.themeId, themes),
        fontPairId: draft.fontPairId,
        primaryFontFamily: draft.primaryFontFamily,
        secondaryFontFamily: draft.secondaryFontFamily,
        fontSize: draft.fontSize,
        brandLogoUrl: draft.brandLogoUrl,
        brandLogoSize: clampBrandLogoSize(draft.brandLogoSize),
        showCopyrightMessage: draft.showCopyrightMessage ?? true,
        copyrightText: draft.copyrightText || DEFAULT_COPYRIGHT_TEXT,
        tutorialImageUrl: draft.tutorialImageUrl,
        tutorialImageSize: draft.tutorialImageSize,
        tutorialImageBottomPadding: draft.tutorialImageBottomPadding,
        tutorialImageOpacity: draft.tutorialImageOpacity,
        updatedAt: Date.now(),
      });
      if (!draft.brandLogoUrl && settings.logo_url) {
        setDraftWithSuppression(() => {
          setBrandLogoUrl(settings.logo_url);
        });
      }
      hasLoadedDraftRef.current = true;
      return;
    }

    if (settings.logo_url) {
      setDraftWithSuppression(() => {
        setBrandLogoUrl(settings.logo_url);
      });
    }
    hasLoadedDraftRef.current = true;
  }, [
    appState.currentDraft,
    applyBannerPayload,
    setDraftWithSuppression,
    settings.logo_url,
    themes,
  ]);

  useEffect(() => {
    if (!hasLoadedDraftRef.current) {
      return;
    }

    if (brandLogoUrl || !settings.logo_url) {
      return;
    }

    setDraftWithSuppression(() => {
      setBrandLogoUrl(settings.logo_url);
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
      templateId,
      themeId,
      platformId,
      fieldValues,
      borderWidth,
      borderColor,
      fontPairId: selectedFontPairId,
      secondaryFontFamily,
      primaryFontFamily,
      fontSize,
      brandLogoUrl,
      brandLogoSize,
      showCopyrightMessage,
      copyrightText,
      tutorialImageUrl,
      tutorialImageSize,
      tutorialImageBottomPadding,
      tutorialImageOpacity,
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
      profileName,
      secondaryFontFamily,
      selectedBannerId,
      selectedFontPairId,
      showCopyrightMessage,
      templateId,
      themeId,
      tutorialImageBottomPadding,
      tutorialImageOpacity,
      tutorialImageSize,
      tutorialImageUrl,
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
        await syncOnSave();
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
      syncOnSave,
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
        applyBannerPayload(banner);
        if (!banner.brandLogoUrl && settings.logo_url) {
          setDraftWithSuppression(() => {
            setBrandLogoUrl(settings.logo_url);
          });
        }
        await updateAppState({
          currentDraft: {
            bannerId: banner.id,
            name: banner.name,
            templateId: banner.templateId,
            themeId: banner.themeId,
            platformId: banner.platformId,
            fieldValues: banner.fieldValues,
            borderWidth: banner.borderWidth,
            borderColor: banner.borderColor,
            fontPairId: banner.fontPairId,
            primaryFontFamily: banner.primaryFontFamily,
            secondaryFontFamily: banner.secondaryFontFamily,
            fontSize: banner.fontSize,
            brandLogoUrl: banner.brandLogoUrl,
            brandLogoSize: clampBrandLogoSize(banner.brandLogoSize),
            showCopyrightMessage: banner.showCopyrightMessage ?? true,
            copyrightText: banner.copyrightText || DEFAULT_COPYRIGHT_TEXT,
            tutorialImageUrl: banner.tutorialImageUrl,
            tutorialImageSize: banner.tutorialImageSize,
            tutorialImageBottomPadding: banner.tutorialImageBottomPadding,
            tutorialImageOpacity: banner.tutorialImageOpacity,
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

      await deleteBanner(bannerId);

      if (selectedBannerId === bannerId) {
        setSelectedBannerId("");
      }

      if (dialogSelectedBannerId === bannerId) {
        setDialogSelectedBannerId("");
      }

      toast.success("Deleted");
    },
    [deleteBanner, dialogSelectedBannerId, selectedBannerId],
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

  // Export handlers
  const handleExportMain = useCallback(async () => {
    if (!canvasMainExportRef.current) return;
    const name =
      fieldValues["title"]?.trim() || currentTemplate?.name || "thumbnail";
    const safeFilename = name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    await exportPng(canvasMainExportRef.current, `${safeFilename}_main.png`);
  }, [currentTemplate?.name, exportPng, fieldValues]);

  // Scale for preview
  const containerWidth = 720;
  const previewScale = containerWidth / currentPlatform.width;

  return (
    <PageLayout
      header={
        <AppBar
          title="Thumbnail Generator"
          showHomeButton
          onHomeClick={() => navigate("/")}
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
                          ? `Loaded: ${selectedBanner.name}`
                          : `Working draft: ${activeBannerName}`
                      }
                      status={selectedBanner ? "info" : "default"}
                    />
                  </Stack>
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
                    {currentTemplate.fields.map((field) => {
                      if (field.type === "select") {
                        return (
                          <SelectControl
                            key={field.id}
                            label={field.label}
                            value={
                              fieldValues[field.id] ?? field.defaultValue ?? ""
                            }
                            onChange={(v) => handleFieldChange(field.id, v)}
                            options={
                              field.options?.map((o) => ({
                                value: o.value,
                                label: o.label,
                              })) ?? []
                            }
                          />
                        );
                      }
                      if (field.type === "slider") {
                        return (
                          <SliderControl
                            key={field.id}
                            label={field.label}
                            value={parseFloat(
                              fieldValues[field.id] ??
                                field.defaultValue ??
                                "0",
                            )}
                            onChange={(v) =>
                              handleFieldChange(field.id, String(v))
                            }
                            min={field.min ?? 0}
                            max={field.max ?? 100}
                            step={field.step ?? 1}
                          />
                        );
                      }
                      return (
                        <Box key={field.id} sx={{ py: 1 }}>
                          <Typography sx={CONTROL_LABEL_SX}>
                            {field.label}
                          </Typography>
                          <TextField
                            value={fieldValues[field.id] ?? ""}
                            onChange={(e) =>
                              handleFieldChange(field.id, e.target.value)
                            }
                            fullWidth
                            size="small"
                            multiline={field.multiline}
                            rows={field.multiline ? 3 : undefined}
                            sx={TEXT_INPUT_SX}
                          />
                        </Box>
                      );
                    })}
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
                  <SelectControl
                    label="Font Pair Preset"
                    value={selectedFontPairId}
                    onChange={handleFontPairChange}
                    options={FONT_PAIR_PRESETS.map((pair) => ({
                      value: pair.id,
                      label: pair.label,
                    }))}
                    tooltip="Curated combinations from common web typography pairings"
                  />
                  <SelectControl
                    label="Title Font (Secondary)"
                    value={secondaryFontFamily}
                    onChange={(value) => {
                      setSecondaryFontFamily(value);
                      setSelectedFontPairId("");
                    }}
                    options={GOOGLE_FONTS}
                    tooltip="Applied to main title/headline"
                  />
                  <SelectControl
                    label="Description, Badge & Episode Font (Primary)"
                    value={primaryFontFamily}
                    onChange={(value) => {
                      setPrimaryFontFamily(value);
                      setSelectedFontPairId("");
                    }}
                    options={GOOGLE_FONTS}
                    tooltip="Applied to description, badge, episode and supporting text"
                  />
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
                  {borderWidth > 0 && (
                    <Box sx={{ py: 1 }}>
                      <Typography sx={CONTROL_LABEL_SX}>
                        Border Color
                      </Typography>
                      <TextField
                        value={borderColor}
                        onChange={(e) =>
                          handleBorderColorChange(e.target.value)
                        }
                        size="small"
                        fullWidth
                        sx={TEXT_INPUT_SX}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <Box
                                component="input"
                                type="color"
                                value={borderColor}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) => handleBorderColorChange(e.target.value)}
                                sx={{
                                  width: 24,
                                  height: 24,
                                  border: "none",
                                  background: "none",
                                  cursor: "pointer",
                                  p: 0,
                                  mr: 1,
                                }}
                              />
                            ),
                          },
                        }}
                        helperText={`Default for ${currentThemeDefinition.name}: ${getThemeBorderColor(themeId, themes)}`}
                      />
                    </Box>
                  )}
                </Stack>
              </SectionCard>

              <SectionCard
                title="Footer"
                icon={<TextFieldsIcon />}
                collapsible
                defaultExpanded
              >
                <Stack spacing={2}>
                  <SelectControl
                    label="Show Copyright"
                    value={showCopyrightMessage ? "true" : "false"}
                    onChange={(value) => setShowCopyrightMessage(value === "true")}
                    options={[
                      { value: "true", label: "On" },
                      { value: "false", label: "Off" },
                    ]}
                    tooltip="Show or hide the footer copyright message"
                  />
                  <Box sx={{ py: 1 }}>
                    <Typography sx={CONTROL_LABEL_SX}>Copyright Text</Typography>
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
                        Tutorial Image
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
                            {tutorialImageUrl
                              ? "Change Tutorial Image"
                              : "Upload Tutorial Image"}
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
                              alt="Tutorial preview"
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
                </Stack>
              </SectionCard>
            </Stack>

            <Box sx={{ mt: 2 }}>
              <Stack spacing={1}>
                <ActionButton
                  label="Export Main PNG"
                  variant="primary"
                  onClick={handleExportMain}
                  loading={isExporting}
                  icon={<DownloadIcon />}
                  fullWidth
                />
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
                  <TemplateComponent
                    width={currentPlatform.width}
                    height={currentPlatform.height}
                    values={fieldValues}
                    theme={currentTheme}
                    primaryFontFamily={primaryFontFamily}
                    secondaryFontFamily={secondaryFontFamily}
                    fontSize={fontSize}
                    socialAccounts={{}}
                    socialPosition="center"
                    socialRenderMode={showCopyrightMessage ? "full" : "hidden"}
                    borderWidth={borderWidth}
                    borderColor={borderColor}
                    overlayImageUrl={null}
                    overlayImageSize={180}
                    brandLogoUrl={renderableBrandLogoUrl}
                    brandLogoSize={brandLogoSize}
                    brandLogoPosition="top-right"
                    instructorStyle="minimal"
                    tutorialImageUrl={tutorialImageUrl}
                    tutorialImageSize={tutorialImageSize}
                    tutorialImageBottomPadding={tutorialImageBottomPadding}
                    tutorialImageOpacity={tutorialImageOpacity}
                    copyrightText={copyrightText}
                  />
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

              {TemplateComponent && (
                <Box sx={{ position: "absolute", left: -10000, top: -10000 }}>
                  <div ref={canvasMainExportRef}>
                    <TemplateComponent
                      width={currentPlatform.width}
                      height={currentPlatform.height}
                      values={fieldValues}
                      theme={currentTheme}
                      primaryFontFamily={primaryFontFamily}
                      secondaryFontFamily={secondaryFontFamily}
                      fontSize={fontSize}
                      socialAccounts={{}}
                      socialPosition="center"
                      socialRenderMode={showCopyrightMessage ? "full" : "hidden"}
                      borderWidth={borderWidth}
                      borderColor={borderColor}
                      overlayImageUrl={null}
                      overlayImageSize={180}
                      brandLogoUrl={renderableBrandLogoUrl}
                      brandLogoSize={brandLogoSize}
                      brandLogoPosition="top-right"
                      instructorStyle="minimal"
                      tutorialImageUrl={tutorialImageUrl}
                      tutorialImageSize={tutorialImageSize}
                      tutorialImageBottomPadding={tutorialImageBottomPadding}
                      tutorialImageOpacity={tutorialImageOpacity}
                      copyrightText={copyrightText}
                    />
                  </div>
                </Box>
              )}
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
