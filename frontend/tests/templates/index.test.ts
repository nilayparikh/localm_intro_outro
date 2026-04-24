import test from "node:test";
import assert from "node:assert/strict";
import { getDefaultValues, getTemplateDef } from "../../src/templates";

test("background template is registered for thumbnail exports", () => {
  const template = getTemplateDef("background_thumbnail");

  assert.ok(template);
  assert.equal(template?.tool, "thumbnail");
  assert.equal(template?.name, "Background");
  assert.equal(template?.hasPip, true);
});

test("intro bite and outro templates are registered for thumbnail exports", () => {
  const introTemplate = getTemplateDef("intro_bite_thumbnail");
  const outroTemplate = getTemplateDef("outro_thumbnail");

  assert.ok(introTemplate);
  assert.equal(introTemplate?.tool, "thumbnail");
  assert.equal(introTemplate?.name, "Intro (Bite)");

  assert.ok(outroTemplate);
  assert.equal(outroTemplate?.tool, "thumbnail");
  assert.equal(outroTemplate?.name, "Outro");
});

test("intro split template is registered for thumbnail exports", () => {
  const splitTemplate = getTemplateDef("intro_split_thumbnail");

  assert.ok(splitTemplate);
  assert.equal(splitTemplate?.tool, "thumbnail");
  assert.equal(splitTemplate?.name, "Intro (Split)");
});

test("background template defaults keep only background-specific controls", () => {
  const defaults = getDefaultValues("background_thumbnail");

  assert.deepEqual(defaults, {
    border_style: "solid",
    border_color_secondary: "",
    show_grid: "true",
    grid_pattern: "dots",
    footer_size: "small",
  });
});

test("tutorial and centered course templates expose secondary size and advanced style defaults", () => {
  assert.deepEqual(
    {
      secondary_size: getDefaultValues("tutorial_thumbnail").secondary_size,
      surface_style: getDefaultValues("tutorial_thumbnail").surface_style,
      surface_shadow: getDefaultValues("tutorial_thumbnail").surface_shadow,
      border_style: getDefaultValues("tutorial_thumbnail").border_style,
      border_color_secondary:
        getDefaultValues("tutorial_thumbnail").border_color_secondary,
    },
    {
      secondary_size: "md",
      surface_style: "standard",
      surface_shadow: "middle",
      border_style: "solid",
      border_color_secondary: "",
    },
  );

  assert.deepEqual(
    {
      secondary_size: getDefaultValues("centered_course_thumbnail")
        .secondary_size,
      surface_style: getDefaultValues("centered_course_thumbnail")
        .surface_style,
      surface_shadow: getDefaultValues("centered_course_thumbnail")
        .surface_shadow,
      border_style: getDefaultValues("centered_course_thumbnail").border_style,
      border_color_secondary: getDefaultValues("centered_course_thumbnail")
        .border_color_secondary,
    },
    {
      secondary_size: "md",
      surface_style: "standard",
      surface_shadow: "middle",
      border_style: "solid",
      border_color_secondary: "",
    },
  );

  assert.deepEqual(
    {
      show_duration_capsule:
        getDefaultValues("centered_thumbnail").show_duration_capsule,
      duration_capsule_text:
        getDefaultValues("centered_thumbnail").duration_capsule_text,
      show_level_capsule:
        getDefaultValues("centered_thumbnail").show_level_capsule,
      level_capsule_value:
        getDefaultValues("centered_thumbnail").level_capsule_value,
      show_instructor_capsule:
        getDefaultValues("centered_thumbnail").show_instructor_capsule,
      instructor_capsule_text:
        getDefaultValues("centered_thumbnail").instructor_capsule_text,
      show_hands_on_lab_capsule:
        getDefaultValues("centered_thumbnail").show_hands_on_lab_capsule,
      hands_on_lab_capsule_text:
        getDefaultValues("centered_thumbnail").hands_on_lab_capsule_text,
      capsule_size: getDefaultValues("centered_thumbnail").capsule_size,
      capsule_style: getDefaultValues("centered_thumbnail").capsule_style,
      capsule_color: getDefaultValues("centered_thumbnail").capsule_color,
      footer_size: getDefaultValues("centered_thumbnail").footer_size,
    },
    {
      show_duration_capsule: "false",
      duration_capsule_text: "10 min",
      show_level_capsule: "false",
      level_capsule_value: "beginner",
      show_instructor_capsule: "false",
      instructor_capsule_text: "Instructor Led",
      show_hands_on_lab_capsule: "false",
      hands_on_lab_capsule_text: "Hands-On Lab",
      capsule_size: "small",
      capsule_style: "glass",
      capsule_color: "",
      footer_size: "small",
    },
  );

  assert.deepEqual(
    {
      show_duration_capsule: getDefaultValues("centered_course_thumbnail")
        .show_duration_capsule,
      duration_capsule_text: getDefaultValues("centered_course_thumbnail")
        .duration_capsule_text,
      show_level_capsule: getDefaultValues("centered_course_thumbnail")
        .show_level_capsule,
      level_capsule_value: getDefaultValues("centered_course_thumbnail")
        .level_capsule_value,
      show_instructor_capsule: getDefaultValues("centered_course_thumbnail")
        .show_instructor_capsule,
      instructor_capsule_text: getDefaultValues("centered_course_thumbnail")
        .instructor_capsule_text,
      show_hands_on_lab_capsule: getDefaultValues("centered_course_thumbnail")
        .show_hands_on_lab_capsule,
      hands_on_lab_capsule_text: getDefaultValues("centered_course_thumbnail")
        .hands_on_lab_capsule_text,
      capsule_size: getDefaultValues("centered_course_thumbnail").capsule_size,
      capsule_style: getDefaultValues("centered_course_thumbnail")
        .capsule_style,
      capsule_color: getDefaultValues("centered_course_thumbnail")
        .capsule_color,
      footer_size: getDefaultValues("centered_course_thumbnail").footer_size,
    },
    {
      show_duration_capsule: "false",
      duration_capsule_text: "10 min",
      show_level_capsule: "false",
      level_capsule_value: "beginner",
      show_instructor_capsule: "false",
      instructor_capsule_text: "Instructor Led",
      show_hands_on_lab_capsule: "false",
      hands_on_lab_capsule_text: "Hands-On Lab",
      capsule_size: "small",
      capsule_style: "glass",
      capsule_color: "",
      footer_size: "small",
    },
  );
});

test("intro bite and outro templates expose specialized banner defaults", () => {
  assert.deepEqual(
    {
      title: getDefaultValues("intro_bite_thumbnail").title,
      show_source_label: getDefaultValues("intro_bite_thumbnail")
        .show_source_label,
      source_label: getDefaultValues("intro_bite_thumbnail").source_label,
      show_source_title: getDefaultValues("intro_bite_thumbnail")
        .show_source_title,
      source_title: getDefaultValues("intro_bite_thumbnail").source_title,
      show_bite_capsule: getDefaultValues("intro_bite_thumbnail")
        .show_bite_capsule,
      bite_capsule_text: getDefaultValues("intro_bite_thumbnail")
        .bite_capsule_text,
      show_duration_capsule: getDefaultValues("intro_bite_thumbnail")
        .show_duration_capsule,
      duration_capsule_text: getDefaultValues("intro_bite_thumbnail")
        .duration_capsule_text,
      show_speed_capsule: getDefaultValues("intro_bite_thumbnail")
        .show_speed_capsule,
      speed_capsule_text: getDefaultValues("intro_bite_thumbnail")
        .speed_capsule_text,
      title_size: getDefaultValues("intro_bite_thumbnail").title_size,
      secondary_size: getDefaultValues("intro_bite_thumbnail").secondary_size,
      capsule_size: getDefaultValues("intro_bite_thumbnail").capsule_size,
      capsule_style: getDefaultValues("intro_bite_thumbnail").capsule_style,
      capsule_color: getDefaultValues("intro_bite_thumbnail").capsule_color,
      surface_style: getDefaultValues("intro_bite_thumbnail").surface_style,
      surface_shadow: getDefaultValues("intro_bite_thumbnail").surface_shadow,
      border_style: getDefaultValues("intro_bite_thumbnail").border_style,
      border_color_secondary: getDefaultValues("intro_bite_thumbnail")
        .border_color_secondary,
      show_grid: getDefaultValues("intro_bite_thumbnail").show_grid,
      grid_pattern: getDefaultValues("intro_bite_thumbnail").grid_pattern,
      footer_size: getDefaultValues("intro_bite_thumbnail").footer_size,
    },
    {
      title: "5 Copilot Prompts That Save Time",
      show_source_label: "true",
      source_label: "BITE FROM",
      show_source_title: "true",
      source_title: "Context Engineering for GitHub Copilot",
      show_bite_capsule: "true",
      bite_capsule_text: "BITE",
      show_duration_capsule: "true",
      duration_capsule_text: "45 sec",
      show_speed_capsule: "true",
      speed_capsule_text: "Fast",
      title_size: "lg",
      secondary_size: "md",
      capsule_size: "small",
      capsule_style: "glass",
      capsule_color: "",
      surface_style: "standard",
      surface_shadow: "middle",
      border_style: "solid",
      border_color_secondary: "",
      show_grid: "true",
      grid_pattern: "dots",
      footer_size: "small",
    },
  );

  assert.deepEqual(getDefaultValues("outro_thumbnail"), {
    title: "Thank You for Watching",
    subtitle: "Want more? Subscribe and press the bell",
    title_size: "lg",
    secondary_size: "md",
    outro_background_svg_asset_id: "",
    outro_background_opacity: "55",
    outro_background_scale: "100",
    outro_background_x: "0",
    outro_background_y: "0",
    surface_style: "standard",
    surface_shadow: "middle",
    border_style: "solid",
    border_color_secondary: "",
    show_grid: "true",
    grid_pattern: "dots",
    footer_size: "small",
  });

  assert.deepEqual(Object.keys(getDefaultValues("outro_thumbnail")).sort(), [
    "border_color_secondary",
    "border_style",
    "footer_size",
    "grid_pattern",
    "outro_background_opacity",
    "outro_background_scale",
    "outro_background_svg_asset_id",
    "outro_background_x",
    "outro_background_y",
    "secondary_size",
    "show_grid",
    "subtitle",
    "surface_shadow",
    "surface_style",
    "title",
    "title_size",
  ]);
});

test("intro split template exposes partition, side and split-asset defaults", () => {
  assert.deepEqual(
    {
      title: getDefaultValues("intro_split_thumbnail").title,
      title_size: getDefaultValues("intro_split_thumbnail").title_size,
      split_title_side: getDefaultValues("intro_split_thumbnail")
        .split_title_side,
      split_partition_points: getDefaultValues("intro_split_thumbnail")
        .split_partition_points,
      split_background_svg_asset_id: getDefaultValues("intro_split_thumbnail")
        .split_background_svg_asset_id,
      split_background_opacity: getDefaultValues("intro_split_thumbnail")
        .split_background_opacity,
      split_background_scale: getDefaultValues("intro_split_thumbnail")
        .split_background_scale,
      split_background_x: getDefaultValues("intro_split_thumbnail")
        .split_background_x,
      split_background_y: getDefaultValues("intro_split_thumbnail")
        .split_background_y,
      split_foreground_asset_id: getDefaultValues("intro_split_thumbnail")
        .split_foreground_asset_id,
      split_foreground_scale: getDefaultValues("intro_split_thumbnail")
        .split_foreground_scale,
      split_foreground_x: getDefaultValues("intro_split_thumbnail")
        .split_foreground_x,
      split_foreground_y: getDefaultValues("intro_split_thumbnail")
        .split_foreground_y,
      split_type_capsule: getDefaultValues("intro_split_thumbnail")
        .split_type_capsule,
      split_corner_icon_asset_id_1: getDefaultValues("intro_split_thumbnail")
        .split_corner_icon_asset_id_1,
      split_corner_icon_asset_id_2: getDefaultValues("intro_split_thumbnail")
        .split_corner_icon_asset_id_2,
      split_corner_icon_asset_id_3: getDefaultValues("intro_split_thumbnail")
        .split_corner_icon_asset_id_3,
      split_corner_icon_size: getDefaultValues("intro_split_thumbnail")
        .split_corner_icon_size,
      show_duration_capsule: getDefaultValues("intro_split_thumbnail")
        .show_duration_capsule,
      show_level_capsule: getDefaultValues("intro_split_thumbnail")
        .show_level_capsule,
      show_instructor_capsule: getDefaultValues("intro_split_thumbnail")
        .show_instructor_capsule,
      show_hands_on_lab_capsule: getDefaultValues("intro_split_thumbnail")
        .show_hands_on_lab_capsule,
      capsule_style: getDefaultValues("intro_split_thumbnail").capsule_style,
      capsule_size: getDefaultValues("intro_split_thumbnail").capsule_size,
      surface_style: getDefaultValues("intro_split_thumbnail").surface_style,
      surface_shadow: getDefaultValues("intro_split_thumbnail").surface_shadow,
      border_style: getDefaultValues("intro_split_thumbnail").border_style,
      border_color_secondary: getDefaultValues("intro_split_thumbnail")
        .border_color_secondary,
      show_grid: getDefaultValues("intro_split_thumbnail").show_grid,
      grid_pattern: getDefaultValues("intro_split_thumbnail").grid_pattern,
      footer_size: getDefaultValues("intro_split_thumbnail").footer_size,
    },
    {
      title: "AI Voice Cloning in 45 Seconds",
      title_size: "lg",
      split_title_side: "left",
      split_partition_points: "(12, 3), (12, 24)",
      split_background_svg_asset_id: "",
      split_background_opacity: "55",
      split_background_scale: "100",
      split_background_x: "0",
      split_background_y: "0",
      split_foreground_asset_id: "",
      split_foreground_scale: "108",
      split_foreground_x: "0",
      split_foreground_y: "0",
      split_type_capsule: "bite",
      split_corner_icon_asset_id_1: "",
      split_corner_icon_asset_id_2: "",
      split_corner_icon_asset_id_3: "",
      split_corner_icon_size: "100",
      show_duration_capsule: "false",
      show_level_capsule: "false",
      show_instructor_capsule: "false",
      show_hands_on_lab_capsule: "false",
      capsule_style: "glass",
      capsule_size: "small",
      surface_style: "standard",
      surface_shadow: "middle",
      border_style: "solid",
      border_color_secondary: "",
      show_grid: "true",
      grid_pattern: "dots",
      footer_size: "small",
    },
  );

  const introSplitTemplate = getTemplateDef("intro_split_thumbnail");
  const splitTypeField = introSplitTemplate?.fields.find(
    (field) => field.id === "split_type_capsule",
  );

  assert.deepEqual(
    splitTypeField?.options?.map((option) => option.value),
    ["bite", "course", "mono", "debug"],
  );
});
