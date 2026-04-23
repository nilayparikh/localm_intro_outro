# LocalM Intro Outro

LocalM Intro Outro is a browser-first banner editor for tutorial and social graphics with local persistence and optional Azure sync.

## Overview

- React 19 + TypeScript + MUI frontend
- RxDB local storage for settings, presets, shared assets, banners, themes, and editor app state cache
- Optional Azure Table sync and Azure Blob Storage asset storage
- Client-side image export plus fixed-frame motion video export with explicit 4K-aware bitrate control, ffmpeg.wasm-backed MP4 encoding, and browser-recorder fallback

## Capabilities

- Template-based banner authoring
- New `Intro Bite` template for clip-title teasers with source attribution plus bite/duration/speed capsules
- New `Outro` template for static thank-you/subscribe end cards with the shared audio-track workflow used by saved banners
- Shared `Asset Library` for MP3, MP4, image, and file uploads backed by Azure Blob Storage and Azure Table metadata
- Intro Bite and Outro shared audio selectors that persist only the chosen shared asset reference
- Background-only thumbnail export with optional logo, border, and grid overlay
- Fixed-frame motion video export from the current thumbnail frame with configurable duration, the selected output resolution, ffmpeg.wasm-backed MP4 output, and the chosen shared audio track when available
- Local cache for downloaded blob-backed assets so repeated renders reuse cached media instead of refetching each time
- Theme Generator for editable theme records, multi-layer gradients, and border defaults
- Optional duration, skill-level, and instructor capsules for centered thumbnail layouts
- Persisted draft recovery across refresh and restart
- Saved banner profiles with Azure-first persistence and RxDB cache hydration
- Saved theme profiles with Azure-first persistence and RxDB cache hydration
- Per-banner footer visibility, custom copyright text, and constrained logo sizing
- Clipboard image paste for tutorial art
- Auto-save on logout and manual sync controls
- Profile-based Azure tables: `BannersDev` and `BannersProd`

## Collections

- `settings`
- `presets`
- `banners`
- `assets`
- `themes`
- `app_state`

## Persistence Model

- `banners`, `assets`, and `themes` persist to Azure Table Storage immediately when cloud auth is configured.
- On startup with cloud auth enabled, cached local `banners` and `themes` are ignored and replaced from Azure before the app uses them.
- RxDB remains the local cache used for query speed, offline snapshotting, and cross-page state after that refresh completes.
- Manual sync still refreshes cached `banners`, `assets`, and `themes` from Azure so another machine can hydrate those records into local cache.
- Legacy collections such as `settings`, `presets`, and `app_state` still use the existing sync flow.

## Routes

- `/` - launcher
- `/assets` - shared asset library
- `/thumbnail` - thumbnail generator
- `/themes` - theme generator

## Related Docs

- [API](api.md)
- [User Guide](user-guide.md)

## Azure Setup

Use the provisioning script to create the shared blob container, the stable Dev and Prod tables, and the required CORS rules:

```bash
python apps/localm_intro_outro/scripts/setup_azure_resources.py
```

The script reads `BANNER_TEST_ACCESS_KEY` from the environment by default and provisions:

- `BannersDev`
- `BannersProd`
- blob container `banner`
- blob and table CORS rules
