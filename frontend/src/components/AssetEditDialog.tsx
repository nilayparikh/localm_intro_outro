import { useEffect, useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { StatusChip } from "@common";
import type { AssetDoc } from "../hooks/useAssets";
import { parseAssetTagInput } from "../pages/assetsMetadata";

interface AssetEditDialogProps {
  open: boolean;
  asset: AssetDoc | null;
  saving: boolean;
  availableTags: string[];
  onClose: () => void;
  onSave: (values: { name: string; tags: string }) => void;
}

export function AssetEditDialog({
  open,
  asset,
  saving,
  availableTags,
  onClose,
  onSave,
}: AssetEditDialogProps) {
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [tagInputValue, setTagInputValue] = useState("");
  const normalizedTags = useMemo(() => parseAssetTagInput(tags), [tags]);

  useEffect(() => {
    if (!open || !asset) {
      return;
    }

    setName(asset.name);
    setTags(asset.tags.join(", "));
    setTagInputValue("");
  }, [asset, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Asset</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Update the asset metadata used by the library grid and tokenized
            search.
          </Typography>
          {asset ? (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <StatusChip label={`Type: ${asset.kind}`} status="info" />
              <StatusChip label={asset.fileName} status="default" />
            </Stack>
          ) : null}
          <TextField
            label="Display Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
            size="small"
          />
          <Autocomplete
            multiple
            freeSolo
            filterSelectedOptions
            options={availableTags}
            value={normalizedTags}
            inputValue={tagInputValue}
            onInputChange={(_, value) => setTagInputValue(value)}
            onChange={(_, value) => {
              const resolvedTags = value.map((tag) => String(tag));
              setTags(resolvedTags.join(", "));
              setTagInputValue("");
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                fullWidth
                size="small"
                helperText="Reuse existing tags or add new ones. Search can target them with #tag."
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSave({ name, tags })}
          disabled={saving || !name.trim()}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
