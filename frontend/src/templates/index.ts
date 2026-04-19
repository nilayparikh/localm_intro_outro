/**
 * Template Registry - Maps template IDs to React components
 */

import type { TemplateDef, TemplateProps, FieldDef } from "./types";
import { TutorialThumbnailTemplate } from "./TutorialThumbnailTemplate";
import { CodeThumbnailTemplate } from "./CodeThumbnailTemplate";
import { CenteredThumbnailTemplate } from "./CenteredThumbnailTemplate";
import { CenteredCourseThumbnailTemplate } from "./CenteredCourseThumbnailTemplate";

export type TemplateComponent = React.ComponentType<TemplateProps>;

export const TEXT_SIZE_OPTIONS = [
  { value: "xs", label: "Extra Small" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
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
      ...gridPatternFields,
    ],
  },
  {
    id: "code_thumbnail",
    name: "Code Thumbnail",
    description:
      "Code-focused thumbnail with syntax highlighting theme, tech stack badges, and code snippet preview.",
    tool: "thumbnail",
    hasPip: true,
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
      ...gridPatternFields,
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
      ...gridPatternFields,
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
      ...gridPatternFields,
    ],
  },
];

export const TEMPLATE_COMPONENTS: Record<string, TemplateComponent> = {
  tutorial_thumbnail: TutorialThumbnailTemplate,
  code_thumbnail: CodeThumbnailTemplate,
  centered_thumbnail: CenteredThumbnailTemplate,
  centered_course_thumbnail: CenteredCourseThumbnailTemplate,
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
