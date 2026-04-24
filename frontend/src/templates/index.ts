/**
 * Template Registry - Maps template IDs to React components
 */

import type { TemplateDef, TemplateProps, FieldDef } from "./types";
import { TutorialThumbnailTemplate } from "./TutorialThumbnailTemplate";
import { CodeThumbnailTemplate } from "./CodeThumbnailTemplate";
import { CenteredThumbnailTemplate } from "./CenteredThumbnailTemplate";
import { CenteredCourseThumbnailTemplate } from "./CenteredCourseThumbnailTemplate";
import { BackgroundThumbnailTemplate } from "./BackgroundThumbnailTemplate";
import { IntroBiteThumbnailTemplate } from "./IntroBiteThumbnailTemplate";
import { IntroSplitThumbnailTemplate } from "./IntroSplitThumbnailTemplate";
import { OutroThumbnailTemplate } from "./OutroThumbnailTemplate";
import {
  GLASS_INTENSITY_STEPS,
  DEFAULT_GLASS_STYLE,
  buildTemplateGlassStyle,
} from "./rendering";

export type TemplateComponent = React.ComponentType<TemplateProps>;

export const TEXT_SIZE_OPTIONS = [
  { value: "xs", label: "Extra Small" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

export const SIZE_PRESET_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const GLASS_STYLE_OPTIONS = GLASS_INTENSITY_STEPS.map((intensity) => ({
  value: buildTemplateGlassStyle(intensity),
  label: `Glass (${intensity}%)`,
}));

export const SURFACE_STYLE_OPTIONS = [
  { value: "standard", label: "Standard" },
  ...GLASS_STYLE_OPTIONS,
];

export const SURFACE_SHADOW_OPTIONS = [
  { value: "near", label: "Near" },
  { value: "middle", label: "Middle" },
  { value: "distance", label: "Distance" },
];

export const BORDER_STYLE_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
  ...GLASS_STYLE_OPTIONS,
];

export const CAPSULE_STYLE_OPTIONS = [
  { value: "standard", label: "Standard" },
  ...GLASS_STYLE_OPTIONS,
];

const SECONDARY_TEXT_SIZE_FIELD: FieldDef = {
  id: "secondary_size",
  label: "Secondary Size",
  type: "select",
  defaultValue: "md",
  options: TEXT_SIZE_OPTIONS,
};

const SURFACE_STYLE_FIELD: FieldDef = {
  id: "surface_style",
  label: "Surface Style",
  type: "select",
  defaultValue: "standard",
  options: SURFACE_STYLE_OPTIONS,
};

const SURFACE_SHADOW_FIELD: FieldDef = {
  id: "surface_shadow",
  label: "Surface Shadow",
  type: "select",
  defaultValue: "middle",
  options: SURFACE_SHADOW_OPTIONS,
};

const BORDER_STYLE_FIELD: FieldDef = {
  id: "border_style",
  label: "Border Style",
  type: "select",
  defaultValue: "solid",
  options: BORDER_STYLE_OPTIONS,
};

const BORDER_COLOR_SECONDARY_FIELD: FieldDef = {
  id: "border_color_secondary",
  label: "Border Color 2",
  type: "color",
  defaultValue: "",
};

const FOOTER_SIZE_FIELD: FieldDef = {
  id: "footer_size",
  label: "Footer Size",
  type: "select",
  defaultValue: "small",
  options: SIZE_PRESET_OPTIONS,
};

const CAPSULE_TOGGLE_OPTIONS = [
  { value: "true", label: "On" },
  { value: "false", label: "Off" },
];

const CAPSULE_LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

const CAPSULE_SIZE_FIELD: FieldDef = {
  id: "capsule_size",
  label: "Capsule Size",
  type: "select",
  defaultValue: "small",
  options: SIZE_PRESET_OPTIONS,
};

const OUTRO_BACKGROUND_SVG_FIELDS: FieldDef[] = [
  {
    id: "outro_background_svg_asset_id",
    label: "Background SVG Asset",
    type: "select",
    defaultValue: "",
    options: [],
  },
  {
    id: "outro_background_opacity",
    label: "Background SVG Opacity",
    type: "slider",
    defaultValue: "55",
    min: 0,
    max: 100,
    step: 1,
  },
  {
    id: "outro_background_scale",
    label: "Background SVG Scale",
    type: "slider",
    defaultValue: "100",
    min: 50,
    max: 180,
    step: 1,
  },
  {
    id: "outro_background_x",
    label: "Background SVG Position X",
    type: "slider",
    defaultValue: "0",
    min: -24,
    max: 24,
    step: 1,
  },
  {
    id: "outro_background_y",
    label: "Background SVG Position Y",
    type: "slider",
    defaultValue: "0",
    min: -24,
    max: 24,
    step: 1,
  },
];

const SPLIT_TITLE_SIDE_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

const SPLIT_TYPE_CAPSULE_OPTIONS = [
  { value: "bite", label: "Bite" },
  { value: "course", label: "Course" },
  { value: "mono", label: "Mono" },
  { value: "debug", label: "Debug Mode" },
];

const SPLIT_BREAKPOINT_EFFECT_OPTIONS = [
  { value: "none", label: "None" },
  { value: "glass", label: "Glass" },
  { value: "opaque", label: "Opaque" },
  { value: "cracked", label: "Cracked" },
];

const CAPSULE_STYLE_FIELD: FieldDef = {
  id: "capsule_style",
  label: "Capsule Style",
  type: "select",
  defaultValue: DEFAULT_GLASS_STYLE,
  options: CAPSULE_STYLE_OPTIONS,
};

const CAPSULE_COLOR_FIELD: FieldDef = {
  id: "capsule_color",
  label: "Capsule Color",
  type: "color",
  defaultValue: "",
};

const CENTERED_CAPSULE_FIELDS: FieldDef[] = [
  {
    id: "show_duration_capsule",
    label: "Show Duration Capsule",
    type: "select",
    defaultValue: "false",
    options: CAPSULE_TOGGLE_OPTIONS,
  },
  {
    id: "duration_capsule_text",
    label: "Duration Text",
    type: "text",
    defaultValue: "10 min",
  },
  {
    id: "show_level_capsule",
    label: "Show Skill Capsule",
    type: "select",
    defaultValue: "false",
    options: CAPSULE_TOGGLE_OPTIONS,
  },
  {
    id: "level_capsule_value",
    label: "Skill Level",
    type: "select",
    defaultValue: "beginner",
    options: CAPSULE_LEVEL_OPTIONS,
  },
  {
    id: "show_instructor_capsule",
    label: "Show Instructor Capsule",
    type: "select",
    defaultValue: "false",
    options: CAPSULE_TOGGLE_OPTIONS,
  },
  {
    id: "instructor_capsule_text",
    label: "Instructor Text",
    type: "text",
    defaultValue: "Instructor Led",
  },
  {
    id: "show_hands_on_lab_capsule",
    label: "Show Hands-On Lab Capsule",
    type: "select",
    defaultValue: "false",
    options: CAPSULE_TOGGLE_OPTIONS,
  },
  {
    id: "hands_on_lab_capsule_text",
    label: "Hands-On Lab Text",
    type: "text",
    defaultValue: "Hands-On Lab",
  },
  CAPSULE_STYLE_FIELD,
  CAPSULE_COLOR_FIELD,
  CAPSULE_SIZE_FIELD,
];

const INTRO_BITE_CAPSULE_FIELDS: FieldDef[] = [
  {
    id: "show_bite_capsule",
    label: "Show Bite Capsule",
    type: "select",
    defaultValue: "true",
    options: CAPSULE_TOGGLE_OPTIONS,
  },
  {
    id: "bite_capsule_text",
    label: "Bite Capsule Text",
    type: "text",
    defaultValue: "BITE",
  },
  {
    id: "show_duration_capsule",
    label: "Show Duration Capsule",
    type: "select",
    defaultValue: "true",
    options: CAPSULE_TOGGLE_OPTIONS,
  },
  {
    id: "duration_capsule_text",
    label: "Duration Text",
    type: "text",
    defaultValue: "45 sec",
  },
  {
    id: "show_speed_capsule",
    label: "Show Speed Capsule",
    type: "select",
    defaultValue: "true",
    options: CAPSULE_TOGGLE_OPTIONS,
  },
  {
    id: "speed_capsule_text",
    label: "Speed Text",
    type: "text",
    defaultValue: "Fast",
  },
  CAPSULE_STYLE_FIELD,
  CAPSULE_COLOR_FIELD,
  CAPSULE_SIZE_FIELD,
];

export function textSizeToMultiplier(size: string): number {
  switch (size) {
    case "xs":
      return 0.7;
    case "sm":
      return 0.85;
    case "md":
      return 1.0;
    case "lg":
      return 1.2;
    case "xl":
      return 1.5;
    default: {
      const num = parseFloat(size);
      return isNaN(num) ? 1.0 : num;
    }
  }
}

const gridPatternFields: FieldDef[] = [
  {
    id: "show_grid",
    label: "Show Grid Pattern",
    type: "select",
    defaultValue: "true",
    options: [
      { value: "true", label: "On" },
      { value: "false", label: "Off" },
    ],
  },
  {
    id: "grid_pattern",
    label: "Grid Pattern",
    type: "select",
    defaultValue: "dots",
    options: [
      { value: "dots", label: "Dots" },
      { value: "grid", label: "Grid Lines" },
      { value: "diagonal", label: "Diagonal Lines" },
      { value: "cross", label: "Cross Pattern" },
      { value: "hexagon", label: "Hexagon" },
      { value: "circuit", label: "Circuit Board" },
    ],
  },
];

export const TEMPLATE_DEFS: TemplateDef[] = [
  {
    id: "tutorial_thumbnail",
    name: "Tutorial Thumbnail",
    description:
      "YouTube tutorial thumbnail with title, subtitle, and background pattern. Perfect for coding tutorials.",
    tool: "thumbnail",
    hasPip: true,
    supportsTutorialImage: true,
    fields: [
      {
        id: "title",
        label: "Title",
        type: "text",
        defaultValue: "How to Build a REST API",
      },
      {
        id: "subtitle",
        label: "Subtitle",
        type: "text",
        defaultValue: "Step-by-step tutorial",
      },
      {
        id: "badge",
        label: "Badge Text",
        type: "text",
        defaultValue: "TUTORIAL",
      },
      {
        id: "episode",
        label: "Episode / Part",
        type: "text",
        defaultValue: "",
      },
      {
        id: "title_size",
        label: "Title Size",
        type: "select",
        defaultValue: "lg",
        options: TEXT_SIZE_OPTIONS,
      },
      SECONDARY_TEXT_SIZE_FIELD,
      SURFACE_STYLE_FIELD,
      SURFACE_SHADOW_FIELD,
      BORDER_STYLE_FIELD,
      BORDER_COLOR_SECONDARY_FIELD,
      ...gridPatternFields,
      FOOTER_SIZE_FIELD,
    ],
  },
  {
    id: "code_thumbnail",
    name: "Code Thumbnail",
    description:
      "Code-focused thumbnail with syntax highlighting theme, tech stack badges, and code snippet preview.",
    tool: "thumbnail",
    hasPip: true,
    supportsTutorialImage: true,
    fields: [
      {
        id: "title",
        label: "Title",
        type: "text",
        defaultValue: "React + TypeScript",
      },
      {
        id: "code_snippet",
        label: "Code Snippet",
        type: "text",
        defaultValue: "const app = express();",
        multiline: true,
      },
      {
        id: "language",
        label: "Language Badge",
        type: "text",
        defaultValue: "TypeScript",
      },
      { id: "badge", label: "Badge Text", type: "text", defaultValue: "CODE" },
      {
        id: "title_size",
        label: "Title Size",
        type: "select",
        defaultValue: "lg",
        options: TEXT_SIZE_OPTIONS,
      },
      SECONDARY_TEXT_SIZE_FIELD,
      SURFACE_STYLE_FIELD,
      SURFACE_SHADOW_FIELD,
      BORDER_STYLE_FIELD,
      BORDER_COLOR_SECONDARY_FIELD,
      ...gridPatternFields,
      FOOTER_SIZE_FIELD,
    ],
  },
  {
    id: "background_thumbnail",
    name: "Background",
    description:
      "Background-only export with dynamic theme gradients, optional grid overlay, optional brand logo, and border controls.",
    tool: "thumbnail",
    hasPip: true,
    supportsTutorialImage: false,
    fields: [
      BORDER_STYLE_FIELD,
      BORDER_COLOR_SECONDARY_FIELD,
      ...gridPatternFields,
      FOOTER_SIZE_FIELD,
    ],
  },
  {
    id: "centered_thumbnail",
    name: "Centered",
    description:
      "Clean centered layout with title in the middle and tutorial image as a configurable background.",
    tool: "thumbnail",
    hasPip: false,
    fields: [
      {
        id: "title",
        label: "Title",
        type: "text",
        defaultValue: "Is RAG Dead?",
      },
      {
        id: "title_size",
        label: "Title Size",
        type: "select",
        defaultValue: "lg",
        options: TEXT_SIZE_OPTIONS,
      },
      ...CENTERED_CAPSULE_FIELDS,
      SURFACE_STYLE_FIELD,
      SURFACE_SHADOW_FIELD,
      BORDER_STYLE_FIELD,
      BORDER_COLOR_SECONDARY_FIELD,
      ...gridPatternFields,
      FOOTER_SIZE_FIELD,
    ],
  },
  {
    id: "centered_course_thumbnail",
    name: "Center Course",
    description:
      "Centered layout with title and course badge/episode line below. Tutorial image as configurable background.",
    tool: "thumbnail",
    hasPip: false,
    fields: [
      {
        id: "title",
        label: "Title",
        type: "text",
        defaultValue: "Context Engineering for GitHub Copilot",
      },
      {
        id: "badge",
        label: "Badge Text",
        type: "text",
        defaultValue: "Learn AI with LocalM™ Tuts",
      },
      {
        id: "episode",
        label: "Episode / Part",
        type: "text",
        defaultValue: "Lesson 01 of 08",
      },
      {
        id: "title_size",
        label: "Title Size",
        type: "select",
        defaultValue: "lg",
        options: TEXT_SIZE_OPTIONS,
      },
      ...CENTERED_CAPSULE_FIELDS,
      SECONDARY_TEXT_SIZE_FIELD,
      SURFACE_STYLE_FIELD,
      SURFACE_SHADOW_FIELD,
      BORDER_STYLE_FIELD,
      BORDER_COLOR_SECONDARY_FIELD,
      ...gridPatternFields,
      FOOTER_SIZE_FIELD,
    ],
  },
  {
    id: "intro_bite_thumbnail",
    name: "Intro (Bite)",
    description:
      "Editorial teaser layout for a short bite clip with a source attribution rail and fast-read metadata capsules.",
    tool: "thumbnail",
    hasPip: false,
    fields: [
      {
        id: "title",
        label: "Bite Title",
        type: "text",
        defaultValue: "5 Copilot Prompts That Save Time",
      },
      {
        id: "show_source_label",
        label: "Show Bite From",
        type: "select",
        defaultValue: "true",
        options: CAPSULE_TOGGLE_OPTIONS,
      },
      {
        id: "source_label",
        label: "Source Label",
        type: "text",
        defaultValue: "BITE FROM",
      },
      {
        id: "show_source_title",
        label: "Show Original Video Title",
        type: "select",
        defaultValue: "true",
        options: CAPSULE_TOGGLE_OPTIONS,
      },
      {
        id: "source_title",
        label: "Original Video Title",
        type: "text",
        defaultValue: "Context Engineering for GitHub Copilot",
      },
      {
        id: "title_size",
        label: "Title Size",
        type: "select",
        defaultValue: "lg",
        options: TEXT_SIZE_OPTIONS,
      },
      SECONDARY_TEXT_SIZE_FIELD,
      ...INTRO_BITE_CAPSULE_FIELDS,
      SURFACE_STYLE_FIELD,
      SURFACE_SHADOW_FIELD,
      BORDER_STYLE_FIELD,
      BORDER_COLOR_SECONDARY_FIELD,
      ...gridPatternFields,
      FOOTER_SIZE_FIELD,
    ],
  },
  {
    id: "intro_split_thumbnail",
    name: "Intro (Split)",
    description:
      "Split intro layout with zig-zag partition control, side-switched title placement, and asset-driven foreground/background composition.",
    tool: "thumbnail",
    hasPip: false,
    fields: [
      {
        id: "title",
        label: "Intro Title",
        type: "text",
        defaultValue: "AI Voice Cloning in 45 Seconds",
      },
      {
        id: "split_title_side",
        label: "Title Side",
        type: "select",
        defaultValue: "left",
        options: SPLIT_TITLE_SIDE_OPTIONS,
      },
      {
        id: "split_partition_points",
        label: "Partition Points",
        type: "text",
        defaultValue: "(12, 3), (12, 24)",
      },
      {
        id: "split_breakpoint_effect",
        label: "Breakpoint Effect",
        type: "select",
        defaultValue: "glass",
        options: SPLIT_BREAKPOINT_EFFECT_OPTIONS,
      },
      {
        id: "split_type_capsule",
        label: "Type Capsule",
        type: "select",
        defaultValue: "bite",
        options: SPLIT_TYPE_CAPSULE_OPTIONS,
      },
      {
        id: "split_title_width",
        label: "Title Width",
        type: "slider",
        defaultValue: "46",
        min: 30,
        max: 72,
        step: 1,
      },
      {
        id: "split_course_title",
        label: "Course Title",
        type: "text",
        defaultValue: "GitHub Copilot Bootcamp",
      },
      {
        id: "split_course_lesson_current",
        label: "Lesson Number",
        type: "text",
        defaultValue: "01",
      },
      {
        id: "split_course_lesson_total",
        label: "Total Lessons",
        type: "text",
        defaultValue: "10",
      },
      {
        id: "split_course_block_size",
        label: "Course Block Size",
        type: "slider",
        defaultValue: "100",
        min: 70,
        max: 180,
        step: 1,
      },
      {
        id: "split_background_svg_asset_id",
        label: "Background SVG Asset",
        type: "select",
        defaultValue: "",
        options: [],
      },
      {
        id: "split_background_opacity",
        label: "Background SVG Opacity",
        type: "slider",
        defaultValue: "55",
        min: 0,
        max: 100,
        step: 1,
      },
      {
        id: "split_background_scale",
        label: "Background SVG Scale",
        type: "slider",
        defaultValue: "100",
        min: 50,
        max: 180,
        step: 1,
      },
      {
        id: "split_background_x",
        label: "Background SVG Position X",
        type: "slider",
        defaultValue: "0",
        min: -24,
        max: 24,
        step: 1,
      },
      {
        id: "split_background_y",
        label: "Background SVG Position Y",
        type: "slider",
        defaultValue: "0",
        min: -24,
        max: 24,
        step: 1,
      },
      {
        id: "split_foreground_asset_id",
        label: "Foreground Image Asset",
        type: "select",
        defaultValue: "",
        options: [],
      },
      {
        id: "split_foreground_scale",
        label: "Foreground Scale",
        type: "slider",
        defaultValue: "108",
        min: 50,
        max: 180,
        step: 1,
      },
      {
        id: "split_foreground_x",
        label: "Foreground Position X",
        type: "slider",
        defaultValue: "0",
        min: -24,
        max: 24,
        step: 1,
      },
      {
        id: "split_foreground_y",
        label: "Foreground Position Y",
        type: "slider",
        defaultValue: "0",
        min: -24,
        max: 24,
        step: 1,
      },
      {
        id: "split_corner_icon_asset_id_1",
        label: "Corner Icon 1",
        type: "select",
        defaultValue: "",
        options: [],
      },
      {
        id: "split_corner_icon_asset_id_2",
        label: "Corner Icon 2",
        type: "select",
        defaultValue: "",
        options: [],
      },
      {
        id: "split_corner_icon_asset_id_3",
        label: "Corner Icon 3",
        type: "select",
        defaultValue: "",
        options: [],
      },
      {
        id: "split_corner_icon_size",
        label: "Corner Icon Size",
        type: "slider",
        defaultValue: "100",
        min: 50,
        max: 180,
        step: 5,
      },
      {
        id: "title_size",
        label: "Title Size",
        type: "select",
        defaultValue: "lg",
        options: TEXT_SIZE_OPTIONS,
      },
      ...CENTERED_CAPSULE_FIELDS,
      SURFACE_STYLE_FIELD,
      SURFACE_SHADOW_FIELD,
      BORDER_STYLE_FIELD,
      BORDER_COLOR_SECONDARY_FIELD,
      ...gridPatternFields,
      FOOTER_SIZE_FIELD,
    ],
  },
  {
    id: "outro_thumbnail",
    name: "Outro",
    description:
      "Static end-card banner with a top gratitude CTA block and a reusable shared audio-track workflow.",
    tool: "thumbnail",
    hasPip: false,
    supportsTutorialImage: false,
    fields: [
      {
        id: "title",
        label: "Headline",
        type: "text",
        defaultValue: "Thank You for Watching",
      },
      {
        id: "subtitle",
        label: "Support Line",
        type: "text",
        defaultValue: "Want more? Subscribe and press the bell",
        multiline: true,
      },
      {
        id: "title_size",
        label: "Title Size",
        type: "select",
        defaultValue: "lg",
        options: TEXT_SIZE_OPTIONS,
      },
      SECONDARY_TEXT_SIZE_FIELD,
      ...OUTRO_BACKGROUND_SVG_FIELDS,
      SURFACE_STYLE_FIELD,
      SURFACE_SHADOW_FIELD,
      BORDER_STYLE_FIELD,
      BORDER_COLOR_SECONDARY_FIELD,
      ...gridPatternFields,
      FOOTER_SIZE_FIELD,
    ],
  },
];

export const TEMPLATE_COMPONENTS: Record<string, TemplateComponent> = {
  tutorial_thumbnail: TutorialThumbnailTemplate,
  code_thumbnail: CodeThumbnailTemplate,
  background_thumbnail: BackgroundThumbnailTemplate,
  centered_thumbnail: CenteredThumbnailTemplate,
  centered_course_thumbnail: CenteredCourseThumbnailTemplate,
  intro_bite_thumbnail: IntroBiteThumbnailTemplate,
  intro_split_thumbnail: IntroSplitThumbnailTemplate,
  outro_thumbnail: OutroThumbnailTemplate,
};

export function getTemplatesForTool(
  tool: "thumbnail" | "frame",
): TemplateDef[] {
  return TEMPLATE_DEFS.filter((t) => t.tool === tool);
}

export function getTemplateDef(id: string): TemplateDef | undefined {
  return TEMPLATE_DEFS.find((t) => t.id === id);
}

export function getDefaultValues(templateId: string): Record<string, string> {
  const def = getTemplateDef(templateId);
  if (!def) return {};
  const values: Record<string, string> = {};
  for (const field of def.fields) {
    values[field.id] = field.defaultValue ?? "";
  }
  return values;
}
