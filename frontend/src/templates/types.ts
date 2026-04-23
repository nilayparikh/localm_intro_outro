import type { OutroArrowOverlay } from "./outroArrowAssets";

/**
 * LocalM™ Banners - Template Types & Theme Definitions
 */

export interface TemplateProps {
  width: number;
  height: number;
  values: Record<string, string>;
  theme: ThemeColors;
  fontFamily?: string;
  primaryFontFamily?: string;
  secondaryFontFamily?: string;
  fontSize: number;
  socialAccounts: Record<string, string>;
  socialPosition: "left" | "center" | "right";
  socialRenderMode?: "full" | "hidden" | "only";
  borderWidth: number;
  borderColor: string;
  overlayImageUrl: string | null;
  overlayImageSize: number;
  brandLogoUrl?: string | null;
  brandLogoSize?: number;
  brandLogoPosition?: "top-right" | "bottom-left";
  tutorialImageUrl?: string | null;
  tutorialImageSize?: number;
  tutorialImageBottomPadding?: number;
  tutorialImageOpacity?: number;
  outroArrowOverlays?: OutroArrowOverlay[];
  instructorStyle?: "minimal" | "card" | "pill" | "framed";
  socialIconSize?: number;
  tutorialCtaText?: string;
  tutorialCtaUrl?: string;
  transparentBackground?: boolean;
  copyrightText?: string;
}

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  tool: "thumbnail" | "frame";
  fields: FieldDef[];
  hasPip?: boolean;
  supportsTutorialImage?: boolean;
  transparentBackground?: boolean;
}

export interface FieldDef {
  id: string;
  label: string;
  type: "text" | "select" | "color" | "slider";
  defaultValue?: string;
  multiline?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface ThemeColors {
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  borderColor?: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  backgroundImage?: string;
}

export type ThemeGradientType = "linear" | "radial";

export interface ThemeGradientStop {
  id: string;
  color: string;
  position: number;
}

export interface ThemeGradientLayer {
  id: string;
  type: ThemeGradientType;
  angle: number;
  centerX: number;
  centerY: number;
  radius: number;
  opacity: number;
  stops: ThemeGradientStop[];
}

export interface ThemeDefinition extends ThemeColors {
  id: string;
  name: string;
  description: string;
  borderColor: string;
  backgroundLayers: ThemeGradientLayer[];
  updatedAt: number;
}

export type PipPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export {
  BUILT_IN_RENDER_THEMES as THEMES,
  DEFAULT_THEME_ID,
} from "../themes/themeDefinitions";
