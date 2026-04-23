import { useEffect, useMemo, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import { APP_CONFIG } from "../config";
import { useAuth } from "./AuthContext";
import {
  buildAzureTableName,
  detectAzureProfileFromTableName,
  AZURE_PROFILE_VALUES,
} from "../azureProfiles";
import {
  DEFAULT_CONNECTION_DETAILS,
  DEFAULT_AUTH_FORM_VALUES,
  mergeConnectionDetailsFromConnectionString,
  validateAuthForm,
  type AuthFormValues,
  type AuthMode,
} from "./credentials";
import { validateStoredAuthSession } from "./sessionValidation";

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const {
    isAuthenticated,
    authState,
    authErrorMessage,
    login,
    invalidateAuth,
  } = useAuth();
  const [formValues, setFormValues] = useState<AuthFormValues>(
    DEFAULT_AUTH_FORM_VALUES,
  );
  const [formError, setFormError] = useState("");
  const [isValidatingStoredAuth, setIsValidatingStoredAuth] = useState(false);

  useEffect(() => {
    let isDisposed = false;

    if (!isAuthenticated || !authState) {
      setIsValidatingStoredAuth(false);
      return () => {
        isDisposed = true;
      };
    }

    setIsValidatingStoredAuth(true);

    void validateStoredAuthSession(authState)
      .then((result) => {
        if (isDisposed) {
          return;
        }

        if (!result.ok) {
          invalidateAuth(result.message);
          return;
        }

        setIsValidatingStoredAuth(false);
      })
      .catch((error) => {
        console.error("Stored auth validation failed:", error);
        if (!isDisposed) {
          setIsValidatingStoredAuth(false);
        }
      });

    return () => {
      isDisposed = true;
    };
  }, [authState, invalidateAuth, isAuthenticated]);

  function handleConnect() {
    const result = validateAuthForm(formValues);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    login(result.authState);
  }

  const helperText = useMemo(() => {
    if (formError) {
      return formError;
    }

    if (authErrorMessage) {
      return authErrorMessage;
    }

    if (formValues.mode === "sas-token") {
      return "Paste a SAS token for direct browser access to Azure Tables and Blob Storage.";
    }

    if (formValues.mode === "connection-string") {
      return "Use a SAS-based connection string. Account-key connection strings are intentionally blocked in this browser-only app.";
    }

    return "Paste a Microsoft Entra access token with Azure Storage data-plane access.";
  }, [authErrorMessage, formError, formValues.mode]);

  const credentialDetails = useMemo(() => {
    if (formValues.mode === "sas-token") {
      return "Format: either '?sv=...' or 'sv=...'. Use a token that grants Table and Blob permissions for the configured account.";
    }

    if (formValues.mode === "connection-string") {
      return "Format: a SAS-based Azure Storage connection string. Endpoints can be extracted from it, but table name and blob container name are still explicit below.";
    }

    return "Format: a Microsoft Entra bearer token string. Because the token does not contain service endpoints, the storage connection fields below are required.";
  }, [formValues.mode]);

  const exampleText = useMemo(() => {
    if (formValues.mode === "sas-token") {
      return "?sv=2025-01-05&ss=ft&srt=sco&sp=rwdlacupiytfx&se=2026-12-31T23:59:00Z&st=2026-04-14T00:00:00Z&spr=https&sig=<signature>";
    }

    if (formValues.mode === "connection-string") {
      return [
        "DefaultEndpointsProtocol=https",
        "AccountName=satutslocalm",
        "TableEndpoint=https://satutslocalm.table.core.windows.net/",
        "BlobEndpoint=https://satutslocalm.blob.core.windows.net/",
        "SharedAccessSignature=sv=2025-01-05&ss=btf&srt=sco&sp=rwdlacupiytfx&sig=<signature>",
      ].join(";");
    }

    return "Bearer eyJ0eXAiOiJKV1QiLCJub25jZSI6Ij...";
  }, [formValues.mode]);

  const isConnectDisabled =
    (formValues.mode === "sas-token" && !formValues.sasToken.trim()) ||
    (formValues.mode === "connection-string" &&
      !formValues.connectionString.trim()) ||
    (formValues.mode === "access-token" && !formValues.accessToken.trim());

  function updateMode(mode: AuthMode) {
    setFormValues((current) => ({ ...current, mode }));
    setFormError("");
  }

  if (isAuthenticated && !isValidatingStoredAuth) return <>{children}</>;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Card sx={{ maxWidth: 480, width: "100%", mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          {isValidatingStoredAuth ? (
            <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
              <CircularProgress size={40} />
              <Typography variant="h6" fontWeight={700} textAlign="center">
                Validating saved Azure credentials
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Checking whether the saved token is still accepted before
                opening the app.
              </Typography>
            </Stack>
          ) : (
            <>
              <Box sx={{ textAlign: "center", mb: 3 }}>
                <LockOutlinedIcon
                  sx={{ fontSize: 48, color: "primary.main", mb: 1 }}
                />
                <Typography variant="h5" fontWeight={700}>
                  {APP_CONFIG.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Enter Azure Storage credentials to connect.
                  <br />
                  This stays in your browser until you use Log off, so the app
                  can reconnect automatically next time.
                </Typography>
              </Box>

              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Connection Details
                </Typography>
                <TextField
                  select
                  label="Profile"
                  fullWidth
                  value={formValues.connection.profile}
                  onChange={(e) => {
                    const nextProfile = e.target
                      .value as (typeof AZURE_PROFILE_VALUES)[number];
                    setFormValues((current) => {
                      const currentProfileTable =
                        detectAzureProfileFromTableName(
                          current.connection.tableName,
                        );
                      const shouldResetTableName =
                        !current.connection.tableName.trim() ||
                        current.connection.tableName.trim().toLowerCase() ===
                          "banners" ||
                        currentProfileTable !== null;

                      return {
                        ...current,
                        connection: {
                          ...current.connection,
                          profile: nextProfile,
                          tableName: shouldResetTableName
                            ? buildAzureTableName(nextProfile)
                            : current.connection.tableName,
                        },
                      };
                    });
                    setFormError("");
                  }}
                  helperText="Dev uses BannersDev. Prod uses BannersProd."
                >
                  {AZURE_PROFILE_VALUES.map((profile) => (
                    <MenuItem key={profile} value={profile}>
                      {profile}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Storage Account Name"
                  fullWidth
                  value={formValues.connection.storageAccountName}
                  onChange={(e) => {
                    const storageAccountName = e.target.value;
                    setFormValues((current) => ({
                      ...current,
                      connection: {
                        ...current.connection,
                        storageAccountName,
                        tableEndpoint:
                          current.connection.tableEndpoint ===
                          DEFAULT_CONNECTION_DETAILS.tableEndpoint
                            ? `https://${storageAccountName || DEFAULT_CONNECTION_DETAILS.storageAccountName}.table.core.windows.net`
                            : current.connection.tableEndpoint,
                        blobEndpoint:
                          current.connection.blobEndpoint ===
                          DEFAULT_CONNECTION_DETAILS.blobEndpoint
                            ? `https://${storageAccountName || DEFAULT_CONNECTION_DETAILS.storageAccountName}.blob.core.windows.net`
                            : current.connection.blobEndpoint,
                      },
                    }));
                    setFormError("");
                  }}
                  helperText="Example: satutslocalm"
                />
                <TextField
                  label="Table Endpoint"
                  fullWidth
                  value={formValues.connection.tableEndpoint}
                  onChange={(e) => {
                    setFormValues((current) => ({
                      ...current,
                      connection: {
                        ...current.connection,
                        tableEndpoint: e.target.value,
                      },
                    }));
                    setFormError("");
                  }}
                  helperText="Example: https://satutslocalm.table.core.windows.net"
                />
                <TextField
                  label="Table Name"
                  fullWidth
                  value={formValues.connection.tableName}
                  onChange={(e) => {
                    const nextTableName = e.target.value;
                    setFormValues((current) => ({
                      ...current,
                      connection: {
                        ...current.connection,
                        profile:
                          detectAzureProfileFromTableName(nextTableName) ??
                          current.connection.profile,
                        tableName: nextTableName,
                      },
                    }));
                    setFormError("");
                  }}
                  helperText="Example: BannersDev or BannersProd"
                />
                <TextField
                  label="Blob Endpoint"
                  fullWidth
                  value={formValues.connection.blobEndpoint}
                  onChange={(e) => {
                    setFormValues((current) => ({
                      ...current,
                      connection: {
                        ...current.connection,
                        blobEndpoint: e.target.value,
                      },
                    }));
                    setFormError("");
                  }}
                  helperText="Example: https://satutslocalm.blob.core.windows.net"
                />
                <TextField
                  label="Blob Container Name"
                  fullWidth
                  value={formValues.connection.blobContainerName}
                  onChange={(e) => {
                    setFormValues((current) => ({
                      ...current,
                      connection: {
                        ...current.connection,
                        blobContainerName: e.target.value,
                      },
                    }));
                    setFormError("");
                  }}
                  helperText="Example: banner"
                />

                <TextField
                  select
                  label="Credential Type"
                  value={formValues.mode}
                  onChange={(e) => updateMode(e.target.value as AuthMode)}
                  fullWidth
                >
                  <MenuItem value="sas-token">SAS Token</MenuItem>
                  <MenuItem value="connection-string">
                    Connection String
                  </MenuItem>
                  <MenuItem value="access-token">Access Token</MenuItem>
                </TextField>

                <Typography variant="caption" color="text.secondary">
                  {credentialDetails}
                </Typography>

                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, bgcolor: "background.default" }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Paste Example
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.75,
                      fontFamily: "monospace",
                      wordBreak: "break-all",
                    }}
                  >
                    {exampleText}
                  </Typography>
                </Paper>

                {formValues.mode === "sas-token" && (
                  <TextField
                    label="SAS Token"
                    fullWidth
                    type="password"
                    value={formValues.sasToken}
                    onChange={(e) => {
                      setFormValues((current) => ({
                        ...current,
                        sasToken: e.target.value,
                      }));
                      setFormError("");
                    }}
                    error={!!formError || !!authErrorMessage}
                    helperText={helperText}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && formValues.sasToken.trim()) {
                        handleConnect();
                      }
                    }}
                  />
                )}

                {formValues.mode === "connection-string" && (
                  <TextField
                    label="Connection String"
                    fullWidth
                    type="password"
                    multiline
                    minRows={3}
                    value={formValues.connectionString}
                    onChange={(e) => {
                      const connectionString = e.target.value;
                      setFormValues((current) => ({
                        ...current,
                        connectionString,
                        connection: mergeConnectionDetailsFromConnectionString(
                          current.connection,
                          connectionString,
                        ),
                      }));
                      setFormError("");
                    }}
                    error={!!formError || !!authErrorMessage}
                    helperText={helperText}
                  />
                )}

                {formValues.mode === "access-token" && (
                  <TextField
                    label="Access Token"
                    fullWidth
                    type="password"
                    multiline
                    minRows={3}
                    value={formValues.accessToken}
                    onChange={(e) => {
                      setFormValues((current) => ({
                        ...current,
                        accessToken: e.target.value,
                      }));
                      setFormError("");
                    }}
                    error={!!formError || !!authErrorMessage}
                    helperText={helperText}
                  />
                )}
              </Stack>
            </>
          )}

          {!isValidatingStoredAuth && (
            <Button
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 2 }}
              onClick={handleConnect}
              disabled={isConnectDisabled}
            >
              Connect
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
