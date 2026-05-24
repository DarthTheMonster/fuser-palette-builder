# Notices and Credits

FUSER Palette Builder is an unofficial community tool for creating FUSER palette replacement mods.

## PAK/SIG compatibility research

The internal PAK/SIG generation approach in this tool was informed by FUSER custom-content tooling work from:

- https://github.com/NarrikSynthfox/FuserCustomSongCreator
- https://github.com/NarrikSynthfox/FuserSongLoader
- https://github.com/Mettra/FuserSongLoader

Credit to NarrikSynthfox, Mettra, elenasayshi, and contributors for prior FUSER modding research and tooling.

This tool includes a minimal PAK writer and FUSER-compatible SIG sidecar generation for this specific palette replacement workflow. It is not intended as general-purpose Unreal Engine pak signing or official cryptographic signing.

## Asset disclaimer

This repository does not include FUSER game assets.

Users must provide their own legally obtained `TS_LUT_UIPalette.uasset` and `TS_LUT_UIPalette.uexp` files from their own FUSER installation.
