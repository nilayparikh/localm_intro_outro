/**
 * LauncherPage - Tool selection landing page
 *
 * Presents the sub-tools:
 * - Thumbnail Generator
 */

import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import PaletteIcon from "@mui/icons-material/Palette";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";

import { PageLayout, AppBar } from "@common";
import { SettingsDialog } from "../components/SettingsDialog";
import { SyncMenu } from "../components/SyncMenu";
import { useManagedLogoff } from "../hooks/useManagedLogoff";
import { useState } from "react";

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function ToolCard({ title, description, icon, onClick }: ToolCardProps) {
  return (
    <Card
      sx={{
        width: 340,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        transition: "all 0.2s",
        "&:hover": {
          borderColor: "primary.main",
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ p: 3 }}>
        <CardContent sx={{ textAlign: "center", p: 0 }}>
          <Box
            sx={{
              mb: 2,
              "& .MuiSvgIcon-root": {
                fontSize: 48,
                color: "primary.main",
              },
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" gutterBottom fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export function LauncherPage() {
  const navigate = useNavigate();
  const logoff = useManagedLogoff();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <PageLayout
      header={
        <AppBar
          title="LocalM™ Banners"
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
              <IconButton
                onClick={logoff}
                size="small"
                sx={{ color: "text.secondary" }}
                title="Log off"
              >
                <LogoutIcon />
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

        <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
          <ToolCard
            title="Thumbnail Generator"
            description="Create eye-catching thumbnails with titles, code snippets, background patterns, and branded footer."
            icon={<PhotoLibraryIcon />}
            onClick={() => navigate("/thumbnail")}
          />
          <ToolCard
            title="Theme Generator"
            description="Design reusable theme backgrounds, gradients, text colors, and border defaults for the thumbnail generator."
            icon={<PaletteIcon />}
            onClick={() => navigate("/themes")}
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
