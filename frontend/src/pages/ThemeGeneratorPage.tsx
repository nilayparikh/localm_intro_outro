import { useCallback, useEffect, useMemo, useState } from "react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import PaletteIcon from "@mui/icons-material/Palette";
import SettingsIcon from "@mui/icons-material/Settings";
import toast from "react-hot-toast";

import {
  ActionButton,
  AppBar,
  EditorLayout,
  PageLayout,
  SectionCard,
  SelectControl,
  SettingsPanel,
  SliderControl,
  StatusChip,
} from "@common";
import { SettingsDialog } from "../components/SettingsDialog";
import { SyncMenu } from "../components/SyncMenu";
import { useThemes } from "../hooks/useThemes";
import type { ThemeDefinition, ThemeGradientLayer } from "../templates/types";
import { toRenderableTheme } from "../themes/themeDefinitions";
import {
  buildThemeEditorState,
  buildThemeExportBundleEntries,
  buildThemeLibraryExportBundleEntries,
  duplicateThemeDefinition,
  shouldHydrateThemeDraft,
} from "./themeGenerator";

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

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Box sx={{ py: 1 }}>
      <Typography sx={CONTROL_LABEL_SX}>{label}</Typography>
      <TextField
        value={value}
        onChange={(event) => onChange(event.target.value)}
        size="small"
        fullWidth
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
      />
    </Box>
  );
}

function cloneLayer(layer: ThemeGradientLayer): ThemeGradientLayer {
  return {
    ...layer,
    stops: layer.stops.map((stop) => ({ ...stop })),
  };
}

function updateLayer(
  layers: ThemeGradientLayer[],
  layerId: string,
  updater: (layer: ThemeGradientLayer) => ThemeGradientLayer,
): ThemeGradientLayer[] {
  return layers.map((layer) =>
    layer.id === layerId ? cloneLayer(updater(layer)) : cloneLayer(layer),
  );
}

export function ThemeGeneratorPage() {
  const { themes, themeOptions, saveTheme, deleteTheme } = useThemes();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [draft, setDraft] = useState<ThemeDefinition | null>(null);

  useEffect(() => {
    if (
      themes.length === 0 ||
      !shouldHydrateThemeDraft({ draft, themes, selectedThemeId })
    ) {
      return;
    }

    const nextState = buildThemeEditorState({ themes, selectedThemeId });

    setSelectedThemeId((current) => current || nextState.selectedThemeId);
    setDraft((current) => {
      if (current && current.id === nextState.selectedThemeId) {
        return current;
      }
      return nextState.draft;
    });
  }, [draft, selectedThemeId, themes]);

  const renderableTheme = useMemo(
    () => (draft ? toRenderableTheme(draft) : null),
    [draft],
  );

  const handleSelectTheme = useCallback(
    (themeId: string) => {
      const nextState = buildThemeEditorState({
        themes,
        selectedThemeId: themeId,
      });
      setSelectedThemeId(nextState.selectedThemeId);
      setDraft(nextState.draft);
    },
    [themes],
  );

  const handleDraftChange = useCallback(
    <K extends keyof ThemeDefinition>(key: K, value: ThemeDefinition[K]) => {
      setDraft((current) => (current ? { ...current, [key]: value } : current));
    },
    [],
  );

  const handleNewTheme = useCallback(() => {
    if (!draft) {
      return;
    }

    const nextDraft = duplicateThemeDefinition(draft);
    nextDraft.name = "New Theme";
    nextDraft.description = "";
    setSelectedThemeId("");
    setDraft(nextDraft);
  }, [draft]);

  const handleDuplicateTheme = useCallback(() => {
    if (!draft) {
      return;
    }

    const duplicate = duplicateThemeDefinition(draft);
    setSelectedThemeId("");
    setDraft(duplicate);
  }, [draft]);

  const handleSaveTheme = useCallback(async () => {
    if (!draft) {
      return;
    }

    const firstLayer = draft.backgroundLayers[0];
    const savedTheme = {
      ...draft,
      gradientStart: firstLayer?.stops[0]?.color ?? draft.gradientStart,
      gradientMid:
        firstLayer?.stops[Math.min(1, (firstLayer?.stops.length ?? 1) - 1)]
          ?.color ?? draft.gradientMid,
      gradientEnd:
        firstLayer?.stops[(firstLayer?.stops.length ?? 1) - 1]?.color ??
        draft.gradientEnd,
    };

    const themeId = await saveTheme(savedTheme);
    setSelectedThemeId(themeId);
    toast.success(`Saved theme "${savedTheme.name}"`);
  }, [draft, saveTheme]);

  const handleDeleteTheme = useCallback(async () => {
    if (!draft) {
      return;
    }

    await deleteTheme(draft.id);
    const nextState = buildThemeEditorState({ themes, selectedThemeId: "" });
    setSelectedThemeId(nextState.selectedThemeId);
    setDraft(nextState.draft);
    toast.success(`Deleted theme "${draft.name}"`);
  }, [deleteTheme, draft, themes]);

  const handleExportTheme = useCallback(async () => {
    if (!draft) {
      return;
    }

    const zip = new JSZip();
    const entries = buildThemeExportBundleEntries(draft);
    const baseName = entries[0]?.fileName.replace(/\.json$/i, "") ?? "theme";

    for (const entry of entries) {
      zip.file(entry.fileName, entry.content);
    }

    saveAs(await zip.generateAsync({ type: "blob" }), `${baseName}.zip`);
  }, [draft]);

  const handleExportAllThemes = useCallback(async () => {
    const zip = new JSZip();

    for (const entry of buildThemeLibraryExportBundleEntries(themes)) {
      zip.file(entry.fileName, entry.content);
    }

    saveAs(
      await zip.generateAsync({ type: "blob" }),
      "localm_theme_library.zip",
    );
  }, [themes]);

  const handleAddLayer = useCallback(() => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const layerCount = current.backgroundLayers.length + 1;
      return {
        ...current,
        backgroundLayers: [
          ...current.backgroundLayers,
          {
            id: `${current.id}-layer-${layerCount}`,
            type: "linear",
            angle: 135,
            centerX: 50,
            centerY: 50,
            radius: 80,
            opacity: 80,
            stops: [
              {
                id: `${current.id}-layer-${layerCount}-stop-1`,
                color: current.accent,
                position: 0,
              },
              {
                id: `${current.id}-layer-${layerCount}-stop-2`,
                color: current.surface,
                position: 50,
              },
              {
                id: `${current.id}-layer-${layerCount}-stop-3`,
                color: current.background,
                position: 100,
              },
            ],
          },
        ],
      };
    });
  }, []);

  const handleRemoveLayer = useCallback((layerId: string) => {
    setDraft((current) => {
      if (!current || current.backgroundLayers.length <= 1) {
        return current;
      }

      return {
        ...current,
        backgroundLayers: current.backgroundLayers.filter(
          (layer) => layer.id !== layerId,
        ),
      };
    });
  }, []);

  const handleLayerChange = useCallback(
    (
      layerId: string,
      updater: (layer: ThemeGradientLayer) => ThemeGradientLayer,
    ) => {
      setDraft((current) =>
        current
          ? {
              ...current,
              backgroundLayers: updateLayer(
                current.backgroundLayers,
                layerId,
                updater,
              ),
            }
          : current,
      );
    },
    [],
  );

  const goHome = useCallback(() => {
    window.location.assign("/");
  }, []);

  const isSavedTheme = themes.some((theme) => theme.id === draft?.id);

  return (
    <PageLayout
      header={
        <AppBar
          title="Theme Generator"
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
          <SettingsPanel title="Theme Settings">
            <Stack spacing={2}>
              <SectionCard
                title="Library"
                icon={<PaletteIcon />}
                collapsible
                defaultExpanded
              >
                <Stack spacing={2}>
                  <SelectControl
                    label="Saved Themes"
                    value={selectedThemeId}
                    onChange={handleSelectTheme}
                    options={themeOptions}
                    tooltip="Load an existing theme into the editor"
                  />
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    useFlexGap
                  >
                    <ActionButton
                      label="New Theme"
                      variant="secondary"
                      icon={<AddIcon />}
                      onClick={handleNewTheme}
                      fullWidth
                    />
                    <ActionButton
                      label="Duplicate"
                      variant="secondary"
                      icon={<ContentCopyIcon />}
                      onClick={handleDuplicateTheme}
                      fullWidth
                    />
                  </Stack>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    useFlexGap
                  >
                    <ActionButton
                      label="Save Theme"
                      variant="primary"
                      onClick={handleSaveTheme}
                      fullWidth
                    />
                    <ActionButton
                      label="Delete Theme"
                      variant="secondary"
                      icon={<DeleteOutlineIcon />}
                      onClick={handleDeleteTheme}
                      fullWidth
                    />
                  </Stack>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    useFlexGap
                  >
                    <ActionButton
                      label="Export Theme"
                      variant="secondary"
                      icon={<DownloadIcon />}
                      onClick={handleExportTheme}
                      fullWidth
                    />
                    <ActionButton
                      label="Export All"
                      variant="secondary"
                      icon={<DownloadIcon />}
                      onClick={handleExportAllThemes}
                      fullWidth
                    />
                  </Stack>
                  <StatusChip
                    label={
                      isSavedTheme
                        ? `Editing saved theme: ${draft?.name ?? ""}`
                        : `Editing unsaved theme: ${draft?.name ?? ""}`
                    }
                    status={isSavedTheme ? "info" : "warning"}
                  />
                </Stack>
              </SectionCard>

              {draft && (
                <>
                  <SectionCard
                    title="Identity"
                    icon={<PaletteIcon />}
                    collapsible
                    defaultExpanded
                  >
                    <Stack spacing={2}>
                      <Box sx={{ py: 1 }}>
                        <Typography sx={CONTROL_LABEL_SX}>
                          Theme Name
                        </Typography>
                        <TextField
                          value={draft.name}
                          onChange={(event) =>
                            handleDraftChange("name", event.target.value)
                          }
                          fullWidth
                          size="small"
                          sx={TEXT_INPUT_SX}
                        />
                      </Box>
                      <Box sx={{ py: 1 }}>
                        <Typography sx={CONTROL_LABEL_SX}>
                          Description
                        </Typography>
                        <TextField
                          value={draft.description}
                          onChange={(event) =>
                            handleDraftChange("description", event.target.value)
                          }
                          fullWidth
                          size="small"
                          multiline
                          rows={3}
                          sx={TEXT_INPUT_SX}
                        />
                      </Box>
                    </Stack>
                  </SectionCard>

                  <SectionCard
                    title="Theme Colors"
                    icon={<PaletteIcon />}
                    collapsible
                    defaultExpanded
                  >
                    <Stack spacing={2}>
                      <ColorField
                        label="Background"
                        value={draft.background}
                        onChange={(value) =>
                          handleDraftChange("background", value)
                        }
                      />
                      <ColorField
                        label="Surface"
                        value={draft.surface}
                        onChange={(value) =>
                          handleDraftChange("surface", value)
                        }
                      />
                      <ColorField
                        label="Text Primary"
                        value={draft.textPrimary}
                        onChange={(value) =>
                          handleDraftChange("textPrimary", value)
                        }
                      />
                      <ColorField
                        label="Text Secondary"
                        value={draft.textSecondary}
                        onChange={(value) =>
                          handleDraftChange("textSecondary", value)
                        }
                      />
                      <ColorField
                        label="Accent"
                        value={draft.accent}
                        onChange={(value) => handleDraftChange("accent", value)}
                      />
                      <ColorField
                        label="Default Border"
                        value={draft.borderColor}
                        onChange={(value) =>
                          handleDraftChange("borderColor", value)
                        }
                      />
                    </Stack>
                  </SectionCard>

                  <SectionCard
                    title="Gradient Layers"
                    icon={<PaletteIcon />}
                    collapsible
                    defaultExpanded
                  >
                    <Stack spacing={2}>
                      {draft.backgroundLayers.map((layer, layerIndex) => (
                        <Box
                          key={layer.id}
                          sx={{
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 2,
                            p: 2,
                          }}
                        >
                          <Stack spacing={1.5}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography variant="subtitle2">
                                Layer {layerIndex + 1}
                              </Typography>
                              <ActionButton
                                label="Remove"
                                variant="secondary"
                                onClick={() => handleRemoveLayer(layer.id)}
                              />
                            </Stack>
                            <SelectControl
                              label="Gradient Type"
                              value={layer.type}
                              onChange={(value) =>
                                handleLayerChange(layer.id, (current) => ({
                                  ...current,
                                  type: value as ThemeGradientLayer["type"],
                                }))
                              }
                              options={[
                                { value: "linear", label: "Linear" },
                                { value: "radial", label: "Radial" },
                              ]}
                            />
                            <SliderControl
                              label="Opacity"
                              value={layer.opacity}
                              onChange={(value) =>
                                handleLayerChange(layer.id, (current) => ({
                                  ...current,
                                  opacity: value,
                                }))
                              }
                              min={0}
                              max={100}
                              step={1}
                              formatValue={(value) => `${value}%`}
                            />
                            {layer.type === "linear" ? (
                              <SliderControl
                                label="Angle"
                                value={layer.angle}
                                onChange={(value) =>
                                  handleLayerChange(layer.id, (current) => ({
                                    ...current,
                                    angle: value,
                                  }))
                                }
                                min={0}
                                max={360}
                                step={1}
                                formatValue={(value) => `${value}°`}
                              />
                            ) : (
                              <>
                                <SliderControl
                                  label="Center X"
                                  value={layer.centerX}
                                  onChange={(value) =>
                                    handleLayerChange(layer.id, (current) => ({
                                      ...current,
                                      centerX: value,
                                    }))
                                  }
                                  min={0}
                                  max={100}
                                  step={1}
                                  formatValue={(value) => `${value}%`}
                                />
                                <SliderControl
                                  label="Center Y"
                                  value={layer.centerY}
                                  onChange={(value) =>
                                    handleLayerChange(layer.id, (current) => ({
                                      ...current,
                                      centerY: value,
                                    }))
                                  }
                                  min={0}
                                  max={100}
                                  step={1}
                                  formatValue={(value) => `${value}%`}
                                />
                                <SliderControl
                                  label="Radius"
                                  value={layer.radius}
                                  onChange={(value) =>
                                    handleLayerChange(layer.id, (current) => ({
                                      ...current,
                                      radius: value,
                                    }))
                                  }
                                  min={10}
                                  max={120}
                                  step={1}
                                  formatValue={(value) => `${value}%`}
                                />
                              </>
                            )}
                            <Divider />
                            {layer.stops.map((stop, stopIndex) => (
                              <Box key={stop.id}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Stop {stopIndex + 1}
                                </Typography>
                                <ColorField
                                  label="Color"
                                  value={stop.color}
                                  onChange={(value) =>
                                    handleLayerChange(layer.id, (current) => ({
                                      ...current,
                                      stops: current.stops.map((entry) =>
                                        entry.id === stop.id
                                          ? { ...entry, color: value }
                                          : entry,
                                      ),
                                    }))
                                  }
                                />
                                <SliderControl
                                  label="Position"
                                  value={stop.position}
                                  onChange={(value) =>
                                    handleLayerChange(layer.id, (current) => ({
                                      ...current,
                                      stops: current.stops.map((entry) =>
                                        entry.id === stop.id
                                          ? { ...entry, position: value }
                                          : entry,
                                      ),
                                    }))
                                  }
                                  min={0}
                                  max={100}
                                  step={1}
                                  formatValue={(value) => `${value}%`}
                                />
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      ))}
                      <ActionButton
                        label="Add Gradient Layer"
                        variant="secondary"
                        icon={<AddIcon />}
                        onClick={handleAddLayer}
                        fullWidth
                      />
                    </Stack>
                  </SectionCard>
                </>
              )}
            </Stack>
          </SettingsPanel>
        }
        preview={
          <Box
            sx={{
              flex: 1,
              p: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {draft && renderableTheme ? (
              <Stack spacing={3} sx={{ width: "100%", maxWidth: 960 }}>
                <Box
                  sx={{
                    minHeight: 360,
                    borderRadius: 4,
                    p: 4,
                    color: renderableTheme.textPrimary,
                    bgcolor: renderableTheme.background,
                    background:
                      renderableTheme.backgroundImage ??
                      renderableTheme.background,
                    border: `2px solid ${draft.borderColor}`,
                    boxShadow: 6,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{ color: renderableTheme.accent, letterSpacing: 2.4 }}
                  >
                    Theme Preview
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ mt: 2, fontWeight: 800, maxWidth: 520 }}
                  >
                    {draft.name}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mt: 2,
                      color: renderableTheme.textSecondary,
                      maxWidth: 620,
                    }}
                  >
                    {draft.description ||
                      "Design background layers, accents, borders, and text colors here, then reuse the saved theme in the thumbnail generator."}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 4 }}>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.75,
                        bgcolor: renderableTheme.accent,
                        color: renderableTheme.background,
                        borderRadius: 99,
                        fontWeight: 700,
                      }}
                    >
                      Accent CTA
                    </Box>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.75,
                        bgcolor: `${renderableTheme.surface}dd`,
                        border: `1px solid ${renderableTheme.borderColor ?? draft.borderColor}`,
                        borderRadius: 99,
                        color: renderableTheme.textPrimary,
                      }}
                    >
                      Surface Panel
                    </Box>
                  </Stack>
                  <Box
                    sx={{
                      mt: 5,
                      p: 2,
                      borderRadius: 3,
                      bgcolor: `${renderableTheme.surface}cc`,
                      border: `1px solid ${renderableTheme.borderColor ?? draft.borderColor}`,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ color: renderableTheme.accent }}
                    >
                      CSS Background
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        color: renderableTheme.textSecondary,
                        wordBreak: "break-word",
                      }}
                    >
                      {renderableTheme.backgroundImage ??
                        renderableTheme.background}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            ) : null}
          </Box>
        }
      />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </PageLayout>
  );
}
