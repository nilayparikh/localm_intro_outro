/**
 * SettingsDialog - Global settings for branding
 *
 * RxDB-backed version. Also includes Logoff button.
 */

import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import toast from "react-hot-toast";
import { ActionButton, SwitchControl } from "@common";

import { useSettings } from "../hooks/useSettings";
import { useLogoUpload } from "../hooks/useLogoUpload";
import { useAppState } from "../hooks/useAppState";
import { useManagedLogoff } from "../hooks/useManagedLogoff";
import { useSync } from "../sync";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { settings, updateSettings } = useSettings();
  const { appState, updateAppState } = useAppState();
  const { logoUrl, upload, remove, uploading } = useLogoUpload();
  const logoff = useManagedLogoff();
  const { syncOnSave } = useSync();
  const [displayName, setDisplayName] = useState("");
  const [website, setWebsite] = useState("");
  const [xTwitter, setXTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [youtube, setYoutube] = useState("");

  useEffect(() => {
    if (open) {
      setDisplayName(settings.display_name);
      setWebsite(settings.website);
      setXTwitter(settings.social_accounts.x_twitter ?? "");
      setLinkedin(settings.social_accounts.linkedin ?? "");
      setGithub(settings.social_accounts.github ?? "");
      setYoutube(settings.social_accounts.youtube ?? "");
    }
  }, [open, settings]);

  const handleSave = async () => {
    try {
      await updateSettings({
        display_name: displayName,
        website,
        social_accounts: {
          ...settings.social_accounts,
          x_twitter: xTwitter,
          linkedin,
          github,
          youtube,
        },
      });
      await syncOnSave();
      toast.success("Settings saved");
      onClose();
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("Failed to save settings");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Display Name
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name or channel name"
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Website
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Social Accounts
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="X / Twitter"
                value={xTwitter}
                onChange={(e) => setXTwitter(e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="LinkedIn"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="GitHub"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="YouTube"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
              />
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Brand Logo
            </Typography>
            <Stack spacing={1.5}>
              <Button component="label" variant="outlined" disabled={uploading}>
                {logoUrl ? "Replace Logo" : "Upload Logo"}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const input = event.currentTarget;
                    const file = event.target.files?.[0];
                    input.value = "";
                    if (file) {
                      await upload(file);
                    }
                  }}
                />
              </Button>
              {logoUrl && (
                <>
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
                      src={logoUrl}
                      alt="Stored logo preview"
                      style={{
                        maxWidth: 180,
                        maxHeight: 72,
                        objectFit: "contain",
                      }}
                    />
                  </Box>
                  <ActionButton
                    label="Remove Logo"
                    variant="secondary"
                    onClick={remove}
                  />
                </>
              )}
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              App Behavior
            </Typography>
            <Stack spacing={1}>
              <SwitchControl
                label="Auto-save current draft on logout"
                checked={appState.autoSaveOnLogout}
                onChange={(checked) => {
                  void updateAppState({ autoSaveOnLogout: checked });
                }}
                tooltip="If the current editor has unsaved changes, save it as a banner when you log off."
              />
              <Typography variant="body2" color="text.secondary">
                Azure sync is manual-only. Cloud publish runs only when you use
                the Sync menu or an explicit Save action.
              </Typography>
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom color="error">
              Session
            </Typography>
            <Button variant="outlined" color="error" onClick={logoff} fullWidth>
              Log Off
            </Button>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
