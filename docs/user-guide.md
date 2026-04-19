# LocalM Intro Outro User Guide

## Sign In

Choose one of the supported Azure auth modes:

- SAS token
- Connection string
- Access token

Connection strings can prefill the storage account and endpoints while typing. Blob container and table values remain explicit so the destination stays clear.

Choose a profile before connecting:

- `Dev` uses table `BannersDev`
- `Prod` uses table `BannersProd`

## Create And Edit

- Pick a template, platform, and theme.
- Edit text, images, borders, and typography.
- Paste an image from the clipboard to populate the tutorial image.
- Save the current banner when you want a named reusable record.

The current draft is persisted automatically, including pasted images.

## Theme Generator

Use the Theme Generator from the launcher to:

- load an existing theme into the editor
- create a new theme or duplicate an existing one
- edit background, surface, text, accent, and default border colors
- stack multiple linear or radial gradient layers
- set gradient angles, radial center points, radius, opacity, and stop positions
- export the current theme or the full theme library as JSON

Saved themes become available immediately in the Thumbnail Generator theme picker.

## Settings

Use Settings to manage:

- display name and website
- social accounts
- stored brand logo
- auto-save on logout
- sync status messaging

## Sync

Use the Sync menu in the app bar to review status and trigger manual sync.

Manual sync mirrors `settings`, `presets`, `banners`, `themes`, and `app_state` to Azure Table Storage.

Before first use against a new storage account, provision the resources and CORS rules:

```bash
python apps/localm_intro_outro/scripts/setup_azure_resources.py
```
