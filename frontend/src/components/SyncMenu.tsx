import { useState } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import SyncIcon from "@mui/icons-material/Sync";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { StatusChip } from "@common";
import { useSync } from "../sync";

function formatSyncTime(value: number | null): string {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleString();
}

export function SyncMenu() {
  const { isSyncing, lastSyncAt, lastSyncMessage, lastSyncStatus, manualSync } =
    useSync();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        color="inherit"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        startIcon={<SyncIcon />}
        sx={{ color: "text.secondary", textTransform: "none" }}
      >
        Sync
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ px: 2, pt: 1.5, pb: 1, minWidth: 280 }}>
          <StatusChip
            label={lastSyncStatus}
            status={
              lastSyncStatus === "success"
                ? "success"
                : lastSyncStatus === "error"
                  ? "error"
                  : lastSyncStatus === "syncing"
                    ? "info"
                    : "default"
            }
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {lastSyncMessage}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Last sync: {formatSyncTime(lastSyncAt)}
          </Typography>
        </Box>
        <MenuItem
          onClick={async () => {
            await manualSync();
            setAnchorEl(null);
          }}
          disabled={isSyncing}
        >
          <ListItemIcon>
            {lastSyncStatus === "error" ? <CloudOffIcon /> : <CloudDoneIcon />}
          </ListItemIcon>
          <ListItemText primary={isSyncing ? "Syncing..." : "Sync now"} />
        </MenuItem>
      </Menu>
    </>
  );
}
