import React, { useMemo, useState } from "react";
import { Download, Upload, Palette, Package, RotateCcw, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";

const PALETTE_START = 0xAD;
const WIDTH = 8;
const HEIGHT = 32;
const ENTRY_SIZE = 16;
const MOUNT_POINT = "../../../Fuser/Content/UI/Shared/Textures/";
const PAK_NAME = "zzz_TS_LUT_UIPalette_P.pak";
const SIG_NAME = "zzz_TS_LUT_UIPalette_P.sig";
const PAK_MAGIC = 0x5a6f12e1;
const PAK_VERSION = 8;
const SIG_MAGIC = 0x73832daa;

const ROWS = [
  { row: 0, key: "BeatBase", label: "Beat Base", deck: "Deck 1 / Beat", defaultHex: "#309BBF" },
  { row: 2, key: "BassBase", label: "Bass Base", deck: "Deck 2 / Bass", defaultHex: "#1997CF" },
  { row: 4, key: "LoopBase", label: "Loop Base", deck: "Deck 3 / Loop", defaultHex: "#0084C4" },
  { row: 6, key: "LeadBase", label: "Lead Base", deck: "Deck 4 / Lead", defaultHex: "#904BF2" },
  { row: 1, key: "BeatSecondary", label: "Beat Secondary", deck: "Secondary", defaultHex: "#F279E6" },
  { row: 3, key: "BassSecondary", label: "Bass Secondary", deck: "Secondary", defaultHex: "#309BBF" },
  { row: 5, key: "LoopSecondary", label: "Loop Secondary", deck: "Secondary", defaultHex: "#904BF2" },
  { row: 7, key: "LeadSecondary", label: "Lead Secondary", deck: "Secondary", defaultHex: "#058EAC" },
  { row: 8, key: "BeatTertiary", label: "Beat Tertiary", deck: "Tertiary", defaultHex: "#3BEDA7" },
  { row: 9, key: "BassTertiary", label: "Bass Tertiary", deck: "Tertiary", defaultHex: "#9A50D3" },
  { row: 10, key: "LoopTertiary", label: "Loop Tertiary", deck: "Tertiary", defaultHex: "#3BEDA7" },
  { row: 11, key: "LeadTertiary", label: "Lead Tertiary", deck: "Tertiary", defaultHex: "#3BEDA7" },
];

const COLUMNS = ["PC", "PS4", "XboxOne", "Switch", "Demo", "Protanopia", "Deutaranopia", "Tritanopia"];
const TEST_PRESET = {
  BeatBase: "#FF0000",
  BassBase: "#00FF00",
  LoopBase: "#0000FF",
  LeadBase: "#FFFFFF",
};

function srgbToLinear01(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function linearToSrgbByte(v) {
  const x = Math.max(0, Math.min(1, Number(v) || 0));
  const s = x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(s * 255)));
}
function hexToLinearRgba(hex) {
  const clean = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [srgbToLinear01(r), srgbToLinear01(g), srgbToLinear01(b), 1.0];
}
function linearRgbaToHex(r, g, b) {
  const rr = linearToSrgbByte(r).toString(16).padStart(2, "0");
  const gg = linearToSrgbByte(g).toString(16).padStart(2, "0");
  const bb = linearToSrgbByte(b).toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`.toUpperCase();
}
function basename(name) { return String(name || "").split(/[\\/]/).pop(); }
function downloadBytes(name, bytes, mime = "application/octet-stream") {
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function concatArrays(arrays) {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const a of arrays) { out.set(a, o); o += a.length; }
  return out;
}
class BinWriter {
  constructor() { this.bytes = []; }
  get length() { return this.bytes.length; }
  u8(v) { this.bytes.push(v & 255); }
  i32(v) { this.u32(v >>> 0); }
  u32(v) { for (let i = 0; i < 4; i++) this.u8(v >>> (i * 8)); }
  u64(v) { let n = BigInt(v); for (let i = 0; i < 8; i++) this.u8(Number((n >> BigInt(i * 8)) & 255n)); }
  bytesArr(a) { for (const b of a) this.u8(b); }
  zero(n) { for (let i = 0; i < n; i++) this.u8(0); }
  str(s) { const b = new TextEncoder().encode(s); this.i32(b.length + 1); this.bytesArr(b); this.u8(0); }
  out() { return new Uint8Array(this.bytes); }
}
async function sha1(bytes) {
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  return new Uint8Array(digest);
}
function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c >>> 0;
  }
  return table;
}
const CRC_TABLE = makeCrcTable();
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function buildSig(pakBytes) {
  const w = new BinWriter();
  w.u32(SIG_MAGIC); w.u32(1); w.u32(512); w.zero(512);
  const chunk = 64 * 1024;
  for (let o = 0; o < pakBytes.length; o += chunk) w.u32(crc32(pakBytes.slice(o, Math.min(o + chunk, pakBytes.length))));
  return w.out();
}
async function buildPak(files) {
  const usable = files.filter((f) => f?.bytes?.length && /\.(uasset|uexp)$/i.test(f.name));
  if (usable.length !== 2) throw new Error("Load both TS_LUT_UIPalette.uasset and TS_LUT_UIPalette.uexp before building the pak.");
  const data = new BinWriter();
  const entries = [];
  for (const file of usable) {
    const name = basename(file.name);
    const offset = data.length;
    const hash = await sha1(file.bytes);
    data.u64(offset); data.u64(file.bytes.length); data.u64(file.bytes.length); data.u32(0); data.bytesArr(hash); data.u32(0); data.u8(0);
    data.bytesArr(file.bytes);
    entries.push({ name, offset, size: file.bytes.length, hash });
  }
  const index = new BinWriter();
  index.str(MOUNT_POINT);
  index.i32(entries.length);
  for (const e of entries) {
    index.str(e.name);
    index.u64(e.offset); index.u64(e.size); index.u64(e.size); index.u32(0); index.bytesArr(e.hash); index.u32(0); index.u8(0);
  }
  const indexBytes = index.out();
  const indexHash = await sha1(indexBytes);
  const footer = new BinWriter();
  footer.u32(PAK_MAGIC); footer.u32(PAK_VERSION); footer.u64(data.length); footer.u64(indexBytes.length); footer.bytesArr(indexHash); footer.zero(160);
  return concatArrays([data.out(), indexBytes, footer.out()]);
}
function checkUexp(bytes) {
  if (!bytes || bytes.length < PALETTE_START + WIDTH * HEIGHT * ENTRY_SIZE) return "too small";
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const firstA = view.getFloat32(PALETTE_START + 12, true);
  const lastA = view.getFloat32(PALETTE_START + (WIDTH * HEIGHT - 1) * ENTRY_SIZE + 12, true);
  if (Math.abs(firstA - 1) > 0.01 || Math.abs(lastA - 1) > 0.01) return "does not look like TS_LUT_UIPalette.uexp at offset 0xAD";
  return null;
}
function readColor(bytes, row, column) {
  const off = PALETTE_START + (row * WIDTH + column) * ENTRY_SIZE;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return [view.getFloat32(off, true), view.getFloat32(off + 4, true), view.getFloat32(off + 8, true), view.getFloat32(off + 12, true)];
}
function patchUexp(originalBytes, colors, patchAllColumns) {
  const out = new Uint8Array(originalBytes);
  const view = new DataView(out.buffer);
  for (const rowDef of ROWS) {
    const hex = colors[rowDef.key];
    if (!hex) continue;
    const rgba = hexToLinearRgba(hex);
    const columns = patchAllColumns ? [...Array(WIDTH).keys()] : [0];
    for (const col of columns) {
      const off = PALETTE_START + (rowDef.row * WIDTH + col) * ENTRY_SIZE;
      view.setFloat32(off, rgba[0], true);
      view.setFloat32(off + 4, rgba[1], true);
      view.setFloat32(off + 8, rgba[2], true);
      view.setFloat32(off + 12, rgba[3], true);
    }
  }
  return out;
}

export default function App() {
  const [uasset, setUasset] = useState(null);
  const [uexp, setUexp] = useState(null);
  const [patchedUexp, setPatchedUexp] = useState(null);
  const [patchAllColumns, setPatchAllColumns] = useState(true);
  const [status, setStatus] = useState("Load TS_LUT_UIPalette.uasset and TS_LUT_UIPalette.uexp.");
  const [colors, setColors] = useState(() => Object.fromEntries(ROWS.map((r) => [r.key, r.defaultHex])));

  const loadedPreview = useMemo(() => {
    if (!uexp?.bytes) return [];
    return ROWS.map((r) => {
      try {
        const [rr, gg, bb, aa] = readColor(uexp.bytes, r.row, 0);
        return { ...r, hex: linearRgbaToHex(rr, gg, bb), alpha: aa };
      } catch { return { ...r, hex: "#000000", alpha: 0 }; }
    });
  }, [uexp]);

  async function loadFile(e, kind) {
    const file = e.target.files?.[0];
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (kind === "uasset") {
      if (file.name !== "TS_LUT_UIPalette.uasset") return setStatus("Wrong uasset. Load exactly TS_LUT_UIPalette.uasset.");
      setUasset({ name: file.name, bytes });
      setStatus(`Loaded ${file.name}.`);
    } else {
      if (file.name !== "TS_LUT_UIPalette.uexp") return setStatus("Wrong uexp. Load exactly TS_LUT_UIPalette.uexp, not MPC_Hype.");
      const problem = checkUexp(bytes);
      if (problem) return setStatus(`Rejected ${file.name}: ${problem}.`);
      setUexp({ name: file.name, bytes });
      setPatchedUexp(null);
      const next = { ...colors };
      for (const r of ROWS) {
        const [rr, gg, bb] = readColor(bytes, r.row, 0);
        next[r.key] = linearRgbaToHex(rr, gg, bb);
      }
      setColors(next);
      setStatus(`Loaded ${file.name}. Read row colors from column 0.`);
    }
  }
  function setColor(key, hex) { setColors((c) => ({ ...c, [key]: hex.toUpperCase() })); }
  function resetFromLoaded() {
    if (!uexp?.bytes) return;
    const next = { ...colors };
    for (const r of ROWS) {
      const [rr, gg, bb] = readColor(uexp.bytes, r.row, 0);
      next[r.key] = linearRgbaToHex(rr, gg, bb);
    }
    setColors(next);
    setStatus("Reset controls to loaded TS_LUT_UIPalette values.");
  }
  function applyTestPreset() {
    setColors((c) => ({ ...c, ...TEST_PRESET }));
    setStatus("Applied obvious test preset: Beat red, Bass green, Loop blue, Lead white.");
  }
  function makePatched() {
    if (!uexp?.bytes) { setStatus("Load TS_LUT_UIPalette.uexp first."); return null; }
    const bytes = patchUexp(uexp.bytes, colors, patchAllColumns);
    setPatchedUexp(bytes);
    setStatus(`Patched UEXP in memory. ${patchAllColumns ? "All 8 columns" : "Only column 0"} were patched for the listed rows.`);
    return bytes;
  }
  function exportUexp() {
    const bytes = patchedUexp || makePatched();
    if (bytes) downloadBytes("TS_LUT_UIPalette.uexp", bytes);
  }
  async function generatePakSig() {
    if (!uasset?.bytes) return setStatus("Load TS_LUT_UIPalette.uasset first.");
    const uexpBytes = patchedUexp || makePatched();
    if (!uexpBytes) return;
    try {
      const pak = await buildPak([
        { name: "TS_LUT_UIPalette.uasset", bytes: uasset.bytes },
        { name: "TS_LUT_UIPalette.uexp", bytes: uexpBytes },
      ]);
      const sig = buildSig(pak);
      downloadBytes(PAK_NAME, pak);
      setTimeout(() => downloadBytes(SIG_NAME, sig), 300);
      setStatus(`Generated ${PAK_NAME} and ${SIG_NAME} internally. Mount: ${MOUNT_POINT}`);
    } catch (err) {
      setStatus(`Pak build failed: ${err.message}`);
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-8 bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3 text-cyan-300 mb-2"><Palette className="w-7 h-7"/><span className="text-sm uppercase tracking-widest">TS_LUT_UIPalette workflow</span></div>
            <h1 className="text-3xl md:text-5xl font-bold">FUSER Palette Builder</h1>
            <p className="text-zinc-400 mt-3 max-w-4xl">Patches the confirmed runtime palette source, then builds a minimal replacement .pak and .sig internally. No UnrealPak.exe required.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 cursor-pointer shadow"><Upload className="w-4 h-4"/>Load .uasset<input className="hidden" type="file" accept=".uasset" onChange={(e) => loadFile(e, "uasset")}/></label>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 cursor-pointer shadow"><Upload className="w-4 h-4"/>Load .uexp<input className="hidden" type="file" accept=".uexp" onChange={(e) => loadFile(e, "uexp")}/></label>
          </div>
        </header>

        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-zinc-500">UAsset:</span> <span className="font-mono">{uasset?.name || "not loaded"}</span></div>
            <div><span className="text-zinc-500">UExp:</span> <span className="font-mono">{uexp?.name || "not loaded"}</span></div>
            <div><span className="text-zinc-500">Palette:</span> <span className="font-mono">offset 0xAD, 8 × 32, float32 RGBA</span></div>
          </div>
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-300 whitespace-pre-wrap">{status}</div>
        </CardContent></Card>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2 bg-zinc-900 border-zinc-800"><CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold">Palette rows</h2>
                <p className="text-sm text-zinc-400">For normal deck color mods, keep “patch all 8 columns” on.</p>
              </div>
              <label className="flex items-center gap-2 text-sm bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2"><input type="checkbox" checked={patchAllColumns} onChange={(e) => setPatchAllColumns(e.target.checked)}/> Patch all 8 columns</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ROWS.map((r) => (
                <div key={r.key} className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div><div className="font-semibold">{r.label}</div><div className="text-xs text-zinc-500">row {r.row} · {r.deck}</div></div>
                    <div className="w-10 h-10 rounded-xl border border-zinc-700" style={{ background: colors[r.key] }} />
                  </div>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={colors[r.key]} onChange={(e) => setColor(r.key, e.target.value)} className="w-12 h-10" />
                    <input value={colors[r.key]} onChange={(e) => setColor(r.key, e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 font-mono text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent></Card>

          <div className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-5 space-y-3">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Package className="w-5 h-5"/>Internal pak builder</h2>
              <p className="text-sm text-zinc-400">Outputs {PAK_NAME} and {SIG_NAME}. Place both in FUSER’s ~mods folder.</p>
              <Button onClick={makePatched} className="w-full gap-2"><ShieldCheck className="w-4 h-4"/>Patch UEXP in memory</Button>
              <Button onClick={exportUexp} className="w-full gap-2 bg-zinc-700 text-zinc-100 hover:bg-zinc-600"><Download className="w-4 h-4"/>Export patched .uexp only</Button>
              <Button onClick={generatePakSig} className="w-full gap-2"><Package className="w-4 h-4"/>Generate PAK + SIG</Button>
              <Button onClick={applyTestPreset} className="w-full gap-2 bg-fuchsia-500 hover:bg-fuchsia-400"><Palette className="w-4 h-4"/>Apply obvious test colors</Button>
              <Button onClick={resetFromLoaded} className="w-full gap-2 bg-zinc-700 text-zinc-100 hover:bg-zinc-600"><RotateCcw className="w-4 h-4"/>Reset from loaded file</Button>
            </CardContent></Card>

            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-5 space-y-3">
              <h2 className="text-xl font-semibold">Loaded column 0 preview</h2>
              <p className="text-sm text-zinc-400">These are read from TS_LUT_UIPalette.uexp using sRGB preview conversion.</p>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {loadedPreview.length ? loadedPreview.slice(0, 12).map((p) => (
                  <div key={p.key} className="flex items-center gap-2 justify-between rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2">
                    <span>{p.label}</span><span className="font-mono text-zinc-400">{p.hex}</span><span className="w-6 h-6 rounded border border-zinc-700" style={{ background: p.hex }}/>
                  </div>
                )) : <div className="text-zinc-500">Load a UEXP to preview.</div>}
              </div>
            </CardContent></Card>
          </div>
        </section>

        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-5 text-sm text-zinc-400 space-y-2">
          <p className="font-semibold text-zinc-200">Confirmed pipeline</p>
          <p><span className="font-mono">TS_LUT_UIPalette.uexp</span> stores the sampled image cache at offset <span className="font-mono">0xAD</span>. FUSER samples this ColorPaletteAtlas, then writes runtime colors into MPC_Hype. This app patches the upstream LUT, not the downstream MPC defaults.</p>
          <p>Pak mount point: <span className="font-mono">{MOUNT_POINT}</span></p>
        </CardContent></Card>
      </div>
    </main>
  );
}
