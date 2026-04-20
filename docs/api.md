# LocalM Intro Outro API

LocalM Intro Outro is primarily frontend-driven. The main API surface is its persisted client-side data and Azure sync configuration.

## Local Data Collections

### `settings`

Stores brand profile defaults including display name, website, social accounts, and logo URL.

### `presets`

Stores reusable editor presets.

### `banners`

Stores saved banner documents, including template, theme, typography, image, field content, footer visibility, footer text, and logo sizing.

### `themes`

Stores editable theme documents, including:

- display metadata (`id`, `name`, `description`)
- surface and typography colors
- accent and default border color
- derived gradient colors for legacy template compatibility
- multi-layer gradient configuration with stops, opacity, angle, and radial center/radius values

### `app_state`

Stores persisted UI state:

- `autoSaveOnLogout`
- `autoStartSync`
- `currentDraft`
- `draftDirty`
- `lastSyncAt`
- `lastSyncStatus`
- `lastSyncMessage`

## Azure Connection Requirements

The browser needs explicit connection details:

- `profile`
- `storageAccountName`
- `tableEndpoint`
- `tableName`
- `blobEndpoint`
- `blobContainerName`

Recommended table naming:

- `BannersDev`
- `BannersProd`

Supported credential modes:

- SAS token
- SAS-based connection string
- Microsoft Entra access token

Best practices:

- Keep blob assets as relative paths like `logos/logo.svg`, not temporary signed URLs.
- Provision the target Azure table and blob container up front, or ensure they are created before the first sync or upload attempt.
- Use profile-based tables instead of creating timestamped test tables for normal app operation.
- Sync includes `themes` alongside `settings`, `presets`, `banners`, and `app_state`.
