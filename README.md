# FUSER Palette Builder

FUSER Palette Builder is a Windows tool for editing FUSER's `TS_LUT_UIPalette` colors and generating a replacement `.pak` + `.sig` palette mod.

Most users should download the packaged release from the GitHub Releases page. You do **not** need to clone the repository or build from source unless you want to modify the tool.

## Download

Go to the Releases page and download the latest `.zip`.

The release zip should contain:

- `FUSER Palette Builder.exe`
- `README.txt`
- `NOTICE.txt`

Run the EXE directly.

## What this tool does

The tool loads the cooked FUSER palette asset pair:

- `TS_LUT_UIPalette.uasset`
- `TS_LUT_UIPalette.uexp`

It can then generate:

- `Custom_Palette_P.pak`
- `Custom_Palette_P.sig`

Place both generated files in your FUSER Paks folder:

```text
FUSER\Fuser\Content\Paks
```

The `.pak` and `.sig` files must stay together and must have matching names except for the extension.

## Basic usage

1. Open `FUSER Palette Builder.exe`.
2. Click **Load .uasset** and select `TS_LUT_UIPalette.uasset`.
3. Click **Load .uexp** and select `TS_LUT_UIPalette.uexp`.
4. Edit colors in Simple or Advanced mode.
5. Click **Patch UEXP in memory**.
6. Click **Generate PAK + SIG**.
7. Copy the generated `.pak` and `.sig` into your FUSER Paks folder.

## Output folder behavior

You can choose an output folder in the app.

When using a selected output folder, the tool attempts to delete its previous generated `.pak/.sig` pair before writing fresh files. This helps avoid stale files when testing repeatedly.

If you manually copy files into the FUSER Paks folder, delete any older matching palette `.pak/.sig` pair first.

## Simple mode

Simple mode is for template-aware palette editing without manually editing the full grid.

The palette is organized as:

- Rows = what gameplay/UI color slot is affected
- Columns = platform or colorblind template

In Simple mode, choose which template you are currently editing, such as:

- PlayStation
- Xbox
- Nintendo Switch
- Protanomaly
- Deuteranomaly
- Tritanomaly

Switching templates preserves each template's separate colors. For example, you can edit Xbox colors, switch to PlayStation colors, then switch back to Xbox and your Xbox edits will still be there.

Simple mode is grouped in the same general left-to-right lane order as the game:

- Beats / Drums
- Bass
- Loops
- Leads

Each group exposes the known mapped color slots for that lane.

## Advanced mode

Advanced mode exposes the active `12 x 8` palette block directly.

Use Advanced mode if you want to manually edit exact row/template cells.

## Known palette mapping

The current community-tested model is:

- Rows = gameplay/UI usage
- Columns = platform/colorblind template

### Rows

| Row | Affects |
| ---: | --- |
| 0 | Beats / Drums main color, Beat square grid base color, Beat circle grid left-click color |
| 1 | Beat right-click color for all grid shapes |
| 2 | Bass main color, Bass square grid base color, Bass circle grid left-click color |
| 3 | Bass right-click color for all grid shapes |
| 4 | Loop main color, Loop square grid base color, Loop circle grid left-click color |
| 5 | Loop right-click color for all grid shapes |
| 6 | Lead main color, Lead square grid base color, Lead circle grid left-click color |
| 7 | Lead right-click color for all grid shapes |
| 8 | Beat circle grid base color, Beat square grid left-click color |
| 9 | Bass circle grid base color, Bass square grid left-click color |
| 10 | Loop circle grid base color, Loop square grid left-click color |
| 11 | Lead circle grid base color, Lead square grid left-click color |

### Columns / templates

| Column | Affects |
| ---: | --- |
| 0 | Unknown / currently unmapped |
| 1 | PlayStation, Colorblindness: None |
| 2 | Xbox, Colorblindness: None |
| 3 | Nintendo Switch, Colorblindness: None |
| 4 | Unknown / currently unmapped |
| 5 | Protanomaly |
| 6 | Deuteranomaly |
| 7 | Tritanomaly |

If more row or column behavior is discovered, the tool can be updated again. Thanks to blahaszi for assisting with this!

## About original / default colors

The app includes bundled extracted palette defaults from `TS_LUT_UIPalette`.

These values may not perfectly match what you visually perceive in-game because FUSER can apply runtime colorblind/profile/UI behavior after sampling the palette.

Use **Reset From Loaded File** when you want to restore the values from the exact `.uexp` you loaded.

## Notes on PAK/SIG generation

This tool includes a minimal internal `.pak` writer for this specific palette replacement workflow.

It also includes FUSER-compatible `.sig` sidecar generation based on observed behavior from existing FUSER modding tools and research.

This should not be treated as general-purpose Unreal Engine pak signing, official cryptographic signing, or a general pak creation library.

## Credits

PAK/SIG compatibility behavior was informed by prior FUSER modding work from NarrikSynthfox's FuserCustomSongCreator, which was forked by elenasayshi, and FuserSongLoader, which was forked from Mettra's work:

- https://github.com/NarrikSynthfox/FuserCustomSongCreator
- https://github.com/NarrikSynthfox/FuserSongLoader
- https://github.com/Mettra/FuserSongLoader

Credit to NarrikSynthfox, Mettra, elenasayshi, and contributors for prior FUSER custom-content research and tooling. You guys are awesome!

Thanks to the FUSER modding community for the testing and reverse-engineering work that made this tool possible.

## Building from source

Most users do not need this section.

Requirements:

- Node.js
- Rust
- Tauri dependencies for Windows

Install dependencies:

```powershell
npm install
```

Run development build:

```powershell
npm run tauri dev
```

Build release EXE:

```powershell
npm run tauri build
```

The built EXE appears at:

```text
src-tauri\target\release\fuser_palette_builder.exe
```

## Disclaimer

This is an unofficial community tool.

It is not affiliated with Harmonix, NCSoft, Epic Games, or any official FUSER rights holder.

This repository does not include FUSER game assets. Users must provide their own legally obtained cooked asset files from their own FUSER installation.
