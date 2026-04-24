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
  saveAction?: "overwrite" | "save-as-new";
  onBannerNameChange: (value: string) => void;
  onSelectBanner: (bannerId: string) => void;
  onSelectSaveAction: (action: "overwrite" | "save-as-new") => void;
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
  saveAction = "save-as-new",
  onBannerNameChange,
  onSelectBanner,
  onSelectSaveAction,
  onClose,
  onConfirm,
  onDeleteSelected,
}: BannerLibraryDialogProps) {
  const selectedBanner =
    banners.find((banner) => banner.id === selectedBannerId) ?? null;
  const isOverwriteMode = mode === "save" && saveAction === "overwrite";
  const confirmLabel =
    mode === "load"
      ? "Load Banner"
      : isOverwriteMode
        ? "Overwrite Banner"
        : "Save New Banner";
  const showDeleteButton =
    selectedBanner && (mode === "load" || isOverwriteMode);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === "load" ? "Load Saved Banner" : "Save Banner"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {mode === "load"
              ? "Choose a saved banner to restore its full setup, then continue editing from there."
              : "Save the full editor state. Overwrite updates the selected banner in place, while Save As New Copy creates a separate saved banner from the current draft."}
          </Typography>

          {mode === "save" && (
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant={isOverwriteMode ? "contained" : "outlined"}
                  onClick={() => onSelectSaveAction("overwrite")}
                  disabled={!selectedBanner}
                >
                  Overwrite Selected Banner
                </Button>
                <Button
                  variant={!isOverwriteMode ? "contained" : "outlined"}
                  onClick={() => onSelectSaveAction("save-as-new")}
                >
                  Save As New Copy
                </Button>
              </Stack>
              <TextField
                label="Banner Name"
                value={
                  isOverwriteMode
                    ? (selectedBanner?.name ?? bannerName)
                    : bannerName
                }
                onChange={(event) => onBannerNameChange(event.target.value)}
                fullWidth
                size="small"
                disabled={isOverwriteMode}
                helperText={
                  isOverwriteMode
                    ? "Overwrite replaces the selected banner in place. Switch to Save As New Copy to create a separate banner."
                    : "Save As New Copy keeps the selected banner untouched and creates a new saved banner from the current editor state."
                }
              />
            </Stack>
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
                            label={
                              mode === "load"
                                ? "Selected"
                                : isOverwriteMode
                                  ? "Overwrite"
                                  : "Selected"
                            }
                            status={
                              mode === "load"
                                ? "info"
                                : isOverwriteMode
                                  ? "warning"
                                  : "default"
                            }
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
        {showDeleteButton && (
          <Button color="error" onClick={onDeleteSelected}>
            Delete
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={
            mode === "load"
              ? !selectedBanner
              : isOverwriteMode
                ? !selectedBanner
                : !bannerName.trim()
          }
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
