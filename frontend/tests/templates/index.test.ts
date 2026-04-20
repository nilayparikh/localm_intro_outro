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

test("background template defaults keep only background-specific controls", () => {
  const defaults = getDefaultValues("background_thumbnail");

  assert.deepEqual(defaults, {
    show_grid: "true",
    grid_pattern: "dots",
  });
});