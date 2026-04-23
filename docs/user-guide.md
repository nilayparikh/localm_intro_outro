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
- Edit text, images, borders, typography, footer visibility, and copyright text.
- For Centered and Center Course templates, optionally add duration, skill-level, and instructor capsules.
- Use `Intro Bite` for short clip teasers with a bite title, `BITE FROM` source attribution, and bite/duration/speed capsules.
- Use `Outro` for static end cards with a thank-you headline, a subscribe CTA, and a reusable shared audio track selected from the Asset Library.
- Use the shared audio selector on `Intro Bite` and `Outro` to attach an uploaded MP3 or other audio asset reference from the Asset Library.
- Motion video export keeps the configured canvas resolution, uses ffmpeg.wasm to build MP4 output from the rendered still frame, and falls back to WEBM if the browser cannot complete the MP4 encode path.
- When a shared audio track is selected and loaded, motion video export includes that track in the exported file.
- Paste an image from the clipboard to populate the tutorial image.
- Save the current banner when you want a named reusable record.
- Saved banners write to Azure immediately when cloud auth is configured, then update the local RxDB cache.
- When cloud auth is configured, the app ignores cached local banner and theme records on startup and reloads them from Azure.

The `Background` thumbnail template keeps only the background-specific controls: theme, border, grid overlay, optional brand logo, and footer settings.

The current draft is persisted automatically, including pasted images.

## Theme Generator

Use the Theme Generator from the launcher to:

- load an existing theme into the editor
- create a new theme or duplicate an existing one
- edit background, surface, text, accent, and default border colors
- stack multiple linear or radial gradient layers
- set gradient angles, radial center points, radius, opacity, and stop positions
- export the current theme as a zip containing the theme JSON and a generated React page
- export the full theme library as a zip containing the library JSON plus one JSON and TSX pair per theme
- saved themes write to Azure immediately when cloud auth is configured, then update the local RxDB cache

Saved themes become available immediately in the Thumbnail Generator theme picker.

## Asset Library

Use the Asset Library from the launcher to:

- upload shared MP3, MP4, image, and document assets into the Azure `banner` blob container
- store reusable metadata for those assets in the shared `assets` collection
- preview existing image, audio, and video assets
- delete assets from both blob storage and cached local metadata
- reuse uploaded audio from Intro Bite and Outro without re-uploading the same file per banner

Downloaded blob-backed assets are cached locally after the first fetch so later previews and renders reuse the local cache instead of refetching the same blob.

## Settings

Use Settings to manage:

- display name and website
- social accounts
- stored brand logo
- auto-save on logout
- sync status messaging

## Sync

Use the Sync menu in the app bar to review status and trigger manual sync.

When cloud auth is configured, opening the app already refreshes `banners`, `assets`, and `themes` from Azure instead of trusting previously cached local copies.

Manual sync refreshes cached `banners`, `assets`, and `themes` from Azure so a second machine can pull remote records into its local RxDB cache.

`settings`, `presets`, and `app_state` continue to use the existing sync flow until they are migrated to the Azure-first cache model.

Before first use against a new storage account, provision the resources and CORS rules:

```bash
python apps/localm_intro_outro/scripts/setup_azure_resources.py
```
