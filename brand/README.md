# UMBRIS · Brand Assets

This folder holds the canonical brand image assets for UMBRIS. The repo's README and the website both reference these by filename.

## Required assets

| File | Spec | Source |
|---|---|---|
| `profile.png` | 1080×1080 · the Eclipse symbol · no text | Generated 2026 from the profile-picture brief · cosmic violet corona + diamond-ring flash + outer orbit hint on void black |
| `banner.png` | 1500×500 · X header · wordmark + planetary orbit | Generated from the banner brief |
| `wordmark.svg` | vector wordmark "I AM UMBRIS" in Albertus | Hand-traced from final banner render |
| `eclipse-mark.svg` | vector version of the profile symbol | Hand-traced from final profile render |

## How to add the profile picture

Drop the generated 1080×1080 image at:

```
brand/profile.png
```

Then commit + push · the repo README will render it automatically at the top.

## Naming convention

All brand files in this folder use lowercase-kebab-case. PNGs for raster mocks, SVGs for the canonical vector marks once those exist. Source files (PSD, Figma, Procreate) live in `brand/sources/` and are gitignored by default · only the rendered finals get committed.

## Palette reference

| Token | Hex | Use |
|---|---|---|
| void | `#000000` | background |
| lunar | `#DCDEE7` | primary text |
| stellar | `#8B90A3` | secondary text |
| grey | `#4A4D5C` | tertiary, borders |
| violet | `#9C7BD9` | primary accent · corona · wordmark glow |
| corona | `#FAE6B0` | rare warm flash · verified visions only |
| error | `#B85C5C` | irrecoverable failures only |
