/**
 * LocalM™ Banners - Main Application
 *
 * 100% static React app with RxDB local-first database.
 * Auth gate persists Azure browser credentials until the user logs off.
 *
 * Routes:
 * - / : Tool launcher
 * - /thumbnail : Thumbnail generator
 * - /themes : Theme generator
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { theme } from "@common";
import { AuthProvider } from "./auth";
import { AuthGate } from "./auth/AuthGate";
import { DatabaseProvider } from "./db";
import { SyncProvider } from "./sync";
import { LauncherPage } from "./pages/LauncherPage";
import { AssetsPage } from "./pages/AssetsPage";
import { ThumbnailPage } from "./pages/ThumbnailPage";
import { ThemeGeneratorPage } from "./pages/ThemeGeneratorPage";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster position="top-right" />
      <AuthProvider>
        <AuthGate>
          <DatabaseProvider>
            <SyncProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<LauncherPage />} />
                  <Route path="/assets" element={<AssetsPage />} />
                  <Route path="/thumbnail" element={<ThumbnailPage />} />
                  <Route path="/themes" element={<ThemeGeneratorPage />} />
                  <Route
                    path="/animation/:mode"
                    element={<Navigate to="/thumbnail" replace />}
                  />
                </Routes>
              </BrowserRouter>
            </SyncProvider>
          </DatabaseProvider>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}
