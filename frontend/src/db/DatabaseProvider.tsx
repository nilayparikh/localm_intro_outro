import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { initDatabase, type BannersDatabase } from "./database";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

const DatabaseContext = createContext<BannersDatabase | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<BannersDatabase | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initDatabase().then(setDb).catch(setError);
  }, []);

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error">
          Failed to initialize database: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!db) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>
  );
}

export function useDatabaseContext(): BannersDatabase {
  const db = useContext(DatabaseContext);
  if (!db)
    throw new Error("useDatabaseContext must be used within DatabaseProvider");
  return db;
}
