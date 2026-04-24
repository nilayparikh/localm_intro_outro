# Outro Background And Intro Split Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add richer thumbnail page title and background-asset controls, support multi-line outro support text editing, and fix the Intro Split foreground asset disappearing from preview and export.

**Architecture:** Keep the changes local to the thumbnail editor and the two affected templates. Extend template field definitions and render props for background asset transforms, move Outro-specific background controls into the assets section, and fix Intro Split by mapping the selected foreground asset into the renderer path it already expects.

**Tech Stack:** React 19, TypeScript, MUI, tsx node:test, Playwright

---

## Tracker

- [ ] Task 1: Add failing tests for title, split foreground mapping, and background control defaults
- [ ] Task 2: Implement template field and render-prop support for background scale and offsets
- [ ] Task 3: Update ThumbnailPage title and move Outro background controls into the assets section
- [ ] Task 4: Add multi-line support line editing for Outro
- [ ] Task 5: Run focused tests, runtime verification, and Playwright

## Test Plan

- Unit: `npm exec tsx --test tests/pages/thumbnailSettings.test.ts tests/pages/thumbnailRender.test.ts tests/templates/index.test.ts tests/templates/styles.test.tsx tests/pages/thumbnailPageSource.test.ts`
- E2E: `npx playwright test --reporter=list`
- Runtime: `npm run dev -- --host 127.0.0.1 --port 4174` then open `/thumbnail` with seeded Outro and Intro Split drafts and verify the page title, controls, preview, and export path render without console errors
- Diagnostics: `get_errors` on modified frontend files

## Acceptance Criteria

- [ ] Thumbnail page title follows `{{app name}} | {{module}} | {{template}}` when a template is active
- [ ] Outro background asset controls live in the assets section and support scale plus X/Y offsets
- [ ] Intro Split background asset supports scale plus X/Y offsets
- [ ] Intro Split selected foreground image appears in preview and export again
- [ ] Outro support line editor can create multiple short rows without manual newline typing
- [ ] Frontend tests and Playwright pass with no new diagnostics

### Task 1: Add failing tests

**Files:**

- Modify: `frontend/tests/pages/thumbnailSettings.test.ts`
- Modify: `frontend/tests/pages/thumbnailRender.test.ts`
- Modify: `frontend/tests/templates/index.test.ts`
- Modify: `frontend/tests/templates/styles.test.tsx`
- Modify: `frontend/tests/pages/thumbnailPageSource.test.ts`

**Step 1: Write the failing tests**

- Add assertions for new split/outro background defaults and field grouping.
- Add a render-props test covering split foreground image mapping and background transform values.
- Add source-level assertions for updated title text and moved Outro background controls.
- Add style/render assertions for multi-line Outro support text.

**Step 2: Run tests to verify they fail**

- Run: `npm exec tsx --test tests/pages/thumbnailSettings.test.ts tests/pages/thumbnailRender.test.ts tests/templates/index.test.ts tests/templates/styles.test.tsx tests/pages/thumbnailPageSource.test.ts`
- Expected: failures that point to missing fields, stale title text, or missing render support.

### Task 2: Implement background transform support

**Files:**

- Modify: `frontend/src/templates/index.ts`
- Modify: `frontend/src/templates/types.ts`
- Modify: `frontend/src/pages/thumbnailSettings.ts`
- Modify: `frontend/src/templates/IntroSplitThumbnailTemplate.tsx`
- Modify: `frontend/src/templates/OutroThumbnailTemplate.tsx`

**Step 1: Add minimal field/render support**

- Extend split/outro field defaults with background scale and X/Y offsets.
- Extend template render props with background asset transform values.
- Apply those values in Intro Split and Outro renderers.

**Step 2: Run focused tests**

- Run: `npm exec tsx --test tests/pages/thumbnailSettings.test.ts tests/templates/index.test.ts tests/templates/styles.test.tsx tests/pages/thumbnailRender.test.ts`
- Expected: new tests pass.

### Task 3: Update ThumbnailPage wiring

**Files:**

- Modify: `frontend/src/pages/ThumbnailPage.tsx`
- Modify: `frontend/tests/pages/thumbnailPageSource.test.ts`

**Step 1: Implement minimal page changes**

- Compute the page/app bar title from app, module, and active template.
- Route split foreground preview/export through the prop the template already consumes.
- Move Outro background asset controls into the assets section while leaving shared content/style rows intact.

**Step 2: Run focused tests**

- Run: `npm exec tsx --test tests/pages/thumbnailPageSource.test.ts tests/pages/thumbnailRender.test.ts`
- Expected: pass.

### Task 4: Add multi-line support line editing

**Files:**

- Modify: `frontend/src/pages/ThumbnailPage.tsx`
- Modify: `frontend/src/templates/OutroThumbnailTemplate.tsx`
- Modify: `frontend/tests/templates/styles.test.tsx`

**Step 1: Implement minimal support-line editor**

- Add an Outro-only helper control that appends newline-separated support lines.
- Preserve backward compatibility by continuing to persist a single `subtitle` string.
- Render each support line as its own row in the Outro template.

**Step 2: Run focused tests**

- Run: `npm exec tsx --test tests/templates/styles.test.tsx tests/pages/thumbnailPageSource.test.ts`
- Expected: pass.

### Task 5: Verify

**Files:**

- Modify: none

**Step 1: Run diagnostics and full verification**

- Run: `get_errors` on modified files.
- Run: `npm exec tsx --test tests/pages/thumbnailSettings.test.ts tests/pages/thumbnailRender.test.ts tests/templates/index.test.ts tests/templates/styles.test.tsx tests/pages/thumbnailPageSource.test.ts`
- Run: `npx playwright test --reporter=list`
- Run: seeded browser check for Outro and Intro Split in `/thumbnail`.

**Step 2: Confirm acceptance criteria**

- Re-check the title, background controls, support-line editing, and split foreground preview/export behavior against the user request.
