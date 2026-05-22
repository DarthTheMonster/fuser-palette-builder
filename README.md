# FUSER Palette Builder

This build targets the confirmed FUSER runtime palette source:

- `/Game/UI/Shared/Textures/TS_LUT_UIPalette.TS_LUT_UIPalette`
- Cooked files: `TS_LUT_UIPalette.uasset` and `TS_LUT_UIPalette.uexp`

The app patches the sampled image cache in `TS_LUT_UIPalette.uexp`:

- palette start offset: `0xAD`
- dimensions: `8 x 32`
- entry size: `16 bytes`
- format: little-endian float32 RGBA

It then builds a minimal replacement `.pak` and `.sig` internally. No UnrealPak.exe path is required.

## Build

From this folder:

```powershell
npm install
npm run tauri:build
```

or:

```powershell
npx tauri build
```

The EXE is written under:

```text
src-tauri\target\release\fuser_palette_builder.exe
```

MSI bundling is disabled in `tauri.conf.json` to avoid the `.ico` bundler problem.

## Usage

1. Load `TS_LUT_UIPalette.uasset`.
2. Load `TS_LUT_UIPalette.uexp`.
3. Choose colors.
4. Keep "Patch all 8 columns" enabled for normal deck color mods.
5. Click `Generate PAK + SIG`.
6. Put both output files in FUSER's `~mods` folder.

## Confirmed row mapping

```text
0  BeatBase
1  BeatSecondary
2  BassBase
3  BassSecondary
4  LoopBase
5  LoopSecondary
6  LeadBase
7  LeadSecondary
8  BeatTertiary
9  BassTertiary
10 LoopTertiary
11 LeadTertiary
```


Build note: use `npm run tauri:build` from this folder. The Vite imports are relative and the @ alias is configured in vite.config.js.
