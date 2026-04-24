/**
 * LauncherPage - Tool selection landing page
 *
 * Presents the sub-tools:
 * - Thumbnail Generator
 */

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import PaletteIcon from "@mui/icons-material/Palette";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import SettingsIcon from "@mui/icons-material/Settings";

import { AppBar, AppCard, PageLayout } from "@common";
import { SettingsDialog } from "../components/SettingsDialog";
import { SyncMenu } from "../components/SyncMenu";
import { useState } from "react";

export function LauncherPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  function openTool(path: string) {
    window.location.assign(path);
  }

  return (
    <PageLayout
      header={
        <AppBar
          title="LocalM™ Intro (Bite)"
          rightContent={
            <Stack direction="row" spacing={0.5}>
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          p: 4,
        }}
      >
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{ mb: 1, textAlign: "center" }}
        >
          Choose a Tool
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3, textAlign: "center", maxWidth: 500 }}
        >
          Generate branded banners, thumbnails, and social media assets — all
          rendered client-side with local-first storage.
        </Typography>

        <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
          <AppCard
            appKey="thumbnail"
            title="Thumbnail Generator"
            description="Create eye-catching thumbnails with titles, code snippets, background patterns, and branded footer."
            icon={<PhotoLibraryIcon />}
            color="#38bdf8"
            onClick={() => openTool("/thumbnail")}
          />
          <AppCard
            appKey="themes"
            title="Theme Generator"
            description="Design reusable theme backgrounds, gradients, text colors, and border defaults for the thumbnail generator."
            icon={<PaletteIcon />}
            color="#f59e0b"
            onClick={() => openTool("/themes")}
          />
          <AppCard
            appKey="assets"
            title="Asset Library"
            description="Upload shared MP3, MP4, image, and file assets once, then reuse them across the app from a single Azure-backed library."
            icon={<LibraryMusicIcon />}
            color="#22c55e"
            onClick={() => openTool("/assets")}
          />
        </Stack>
      </Box>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </PageLayout>
  );
}
