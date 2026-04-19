import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { StatusChip } from "@common";

export type BannerLibraryDialogMode = "load" | "save";

export interface BannerLibraryDialogItem {
  id: string;
  name: string;
  updatedAt: number;
}

interface BannerLibraryDialogProps {
  open: boolean;
  mode: BannerLibraryDialogMode;
  banners: BannerLibraryDialogItem[];
  selectedBannerId: string;
  bannerName: string;
  onBannerNameChange: (value: string) => void;
  onSelectBanner: (bannerId: string) => void;
  onClearSelection: () => void;
  onClose: () => void;
  onConfirm: () => void;
  onDeleteSelected: () => void;
}

export function BannerLibraryDialog({
  open,
  mode,
  banners,
  selectedBannerId,
  bannerName,
  onBannerNameChange,
  onSelectBanner,
  onClearSelection,
  onClose,
  onConfirm,
  onDeleteSelected,
}: BannerLibraryDialogProps) {
  const selectedBanner =
    banners.find((banner) => banner.id === selectedBannerId) ?? null;
  const confirmLabel =
    mode === "load"
      ? "Load Banner"
      : selectedBanner
        ? "Overwrite Banner"
        : "Save Banner";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === "load" ? "Load Saved Banner" : "Save Current Banner"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {mode === "load"
              ? "Choose a saved banner to restore its full setup, then continue editing from there."
              : "Save the full editor state. Type a new name for a new banner, or select an existing one below to overwrite it."}
          </Typography>

          {mode === "save" && (
            <TextField
              label="Banner Name"
              value={bannerName}
              onChange={(event) => onBannerNameChange(event.target.value)}
              fullWidth
              size="small"
              helperText={
                selectedBanner
                  ? "The selected banner will be overwritten with the current editor settings."
                  : "Saving without a selected banner creates a new saved banner."
              }
            />
          )}

          {mode === "save" && selectedBanner && (
            <Button
              onClick={onClearSelection}
              size="small"
              sx={{ alignSelf: "flex-start" }}
            >
              Save As New Banner
            </Button>
          )}

          <Stack spacing={1}>
            <Typography variant="subtitle2">Saved Banners</Typography>
            {banners.length > 0 ? (
              <List
                disablePadding
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                {banners.map((banner, index) => {
                  const isSelected = banner.id === selectedBannerId;

                  return (
                    <div key={banner.id}>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => onSelectBanner(banner.id)}
                        sx={{ alignItems: "flex-start", py: 1.25 }}
                      >
                        <ListItemText
                          primary={banner.name}
                          secondary={new Date(
                            banner.updatedAt,
                          ).toLocaleString()}
                          secondaryTypographyProps={{ variant: "caption" }}
                        />
                        {isSelected && (
                          <StatusChip
                            label={mode === "load" ? "Selected" : "Overwrite"}
                            status={mode === "load" ? "info" : "warning"}
                          />
                        )}
                      </ListItemButton>
                      {index < banners.length - 1 && <Divider />}
                    </div>
                  );
                })}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No saved banners yet. Save the current setup to create your
                first reusable banner preset.
              </Typography>
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        {selectedBanner && (
          <Button color="error" onClick={onDeleteSelected}>
            Delete
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={mode === "load" ? !selectedBanner : !bannerName.trim()}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
