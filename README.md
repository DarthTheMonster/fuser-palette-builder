# FUSER Palette Builder

FUSER Palette Builder is a Windows tool for editing FUSER's TS_LUT_UIPalette colors and generating a replacement .pak + .sig palette mod.

Most users should download the packaged release from the GitHub Releases page. You do not need to clone the repository or build from source unless you want to modify the tool.

## Download

Go to the Releases page and download the latest .zip.

The release zip should contain:

- FUSER Palette Builder.exe
- README.txt
- NOTICE.txt

Run the EXE directly.

## What this tool does

The tool loads the cooked FUSER palette asset pair:

- TS_LUT_UIPalette.uasset
- TS_LUT_UIPalette.uexp

It can then generate:

- Custom_Palette_P.pak
- Custom_Palette_P.sig

Place both generated files in your FUSER Content\Paks\~mods folder.

The .pak and .sig files must stay together and must have matching names except for the extension.

## Basic usage

1. Open FUSER Palette Builder.exe.
2. Click Load .uasset and select TS_LUT_UIPalette.uasset.
3. Click Load .uexp and select TS_LUT_UIPalette.uexp.
4. Edit colors in Simple or Advanced mode.
5. Click Patch UEXP in memory.
6. Click Generate PAK + SIG.
7. Copy the generated .pak and .sig into your FUSER Paks folder.

FUSER\Fuser\Content\Paks

## Output folder behavior

You can choose an output folder in the app.

When using a selected output folder, the tool attempts to delete its previous generated .pak/.sig pair before writing fresh files. This helps avoid stale files when testing repeatedly.

If you manually copy files into ~mods, delete any older palette .pak/.sig pair first.

## Simple mode

Simple mode is for quick deck color edits.

It exposes the main editable deck color controls without requiring you to manually edit the full palette grid.

The option currently labeled Patch all 8 columns (Brute Force) / Apply to all 8 variants forces the selected simple color across all 8 sampled slots for that row. This is the most reliable way to make the color show up everywhere, but it may overwrite palette variants that FUSER uses for colorblind modes or other UI contexts.

## Advanced mode

> [!NOTE]
> Many advanced row/column meanings are still unknown. This tool intentionally does **not** claim a complete map yet.

## Known from testing so far

### Rows

| Row | Appears to affect |
| --- | --- |
| 0 | Drums |
| 2 | Bass |
| 4 | Loop |
| 6 | Lead |

### Columns

| Column | Appears to affect |
| --- | --- |
| 2 | Colorblind Off |
| 5 | Protanomaly |
| 6 | Deuteranomaly |
| 7 | Tritanomaly |

Other rows and columns are still being mapped, and the tool will be changed and adapted when more info is revealed.

## About original / default colors

The app includes bundled extracted palette defaults from TS_LUT_UIPalette.

These values may not perfectly match what you visually perceive in-game because FUSER can apply runtime colorblind/profile/UI behavior after sampling the palette.

Use Reset from loaded file when you want to restore the values from the exact .uexp you loaded.

## Notes on PAK/SIG generation

This tool includes a minimal internal .pak writer for this specific palette replacement workflow.

It also includes FUSER-compatible .sig sidecar generation based on observed behavior from existing FUSER modding tools and research.

This should not be treated as general-purpose Unreal Engine pak signing, official cryptographic signing, or a general pak creation library.

## Credits

PAK/SIG compatibility behavior was informed by prior FUSER modding work from NarrikSynthfox's FuserCustomSongCreator (that was forked by elenasayshi) and FuserSongLoader (that was forked from Mettra's):

https://github.com/NarrikSynthfox/FuserCustomSongCreator

https://github.com/NarrikSynthfox/FuserSongLoader (https://github.com/Mettra/FuserSongLoader)

Credit to NarrikSynthfox, Mettra, elenasayshi, and contributors for prior FUSER custom-content research and tooling. You guys are awesome!

Thanks to the FUSER modding community for the testing and reverse-engineering work that made this tool possible.

## Building from source

Most users do not need this section.

Requirements:

- Node.js
- Rust
- Tauri dependencies for Windows

Install dependencies:

npm install

Run development build:

npm run tauri dev

Build release EXE:

npm run tauri build

The built EXE appears at:

src-tauri\target\release\fuser_palette_builder.exe

## Disclaimer

This is an unofficial community tool.

It is not affiliated with Harmonix, NCSoft, Epic Games, or any official FUSER rights holder.

This repository does not include FUSER game assets. Users must provide their own legally obtained cooked asset files from their own FUSER installation.
