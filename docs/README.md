# LocalM Intro Outro

LocalM Intro Outro is a browser-first banner editor for tutorial and social graphics with local persistence and optional Azure sync.

## Overview

- React 19 + TypeScript + MUI frontend
- RxDB local storage for settings, presets, banners, themes, and editor app state cache
- Optional Azure Table sync and Azure Blob Storage asset storage
- Client-side PNG export

## Capabilities

- Template-based banner authoring
- Background-only thumbnail export with optional logo, border, and grid overlay
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
- `themes`
- `app_state`

## Persistence Model

- `banners` and `themes` persist to Azure Table Storage immediately when cloud auth is configured.
- On startup with cloud auth enabled, cached local `banners` and `themes` are ignored and replaced from Azure before the app uses them.
- RxDB remains the local cache used for query speed, offline snapshotting, and cross-page state after that refresh completes.
- Manual sync still refreshes cached `banners` and `themes` from Azure so another machine can hydrate those records into local cache.
- Legacy collections such as `settings`, `presets`, and `app_state` still use the existing sync flow.

## Routes

- `/` - launcher
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
