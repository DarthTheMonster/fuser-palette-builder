import React, { useEffect, useMemo, useState } from "react";
import { Download, Upload, Palette, Package, RotateCcw, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";

const PALETTE_START = 0xAD;
const WIDTH = 8;
const HEIGHT = 32;
const ACTIVE_ROWS = 12;
const ENTRY_SIZE = 16;
const MOUNT_POINT = "../../../Fuser/Content/UI/Shared/Textures/";
const PAK_NAME = "zzz_Custom_Palette_P.pak";
const SIG_NAME = "zzz_Custom_Palette_P.sig";
const PAK_MAGIC = 0x5a6f12e1;
const PAK_VERSION = 8;
const SIG_MAGIC = 0x73832daa;

const SIMPLE_ROWS = [
  { row: 0, key: "BeatBase", label: "Deck 1", sublabel: "Beat / Primary", defaultHex: "#309BBF" },
  { row: 2, key: "BassBase", label: "Deck 2", sublabel: "Bass / Primary", defaultHex: "#904BF2" },
  { row: 4, key: "LoopBase", label: "Deck 3", sublabel: "Loop / Primary", defaultHex: "#FF4F6C" },
  { row: 6, key: "LeadBase", label: "Deck 4", sublabel: "Lead / Primary", defaultHex: "#E69E39" },
];

const ACTIVE_ROW_LABELS = [
  "Beat Base", "Beat Secondary", "Bass Base", "Bass Secondary",
  "Loop Base", "Loop Secondary", "Lead Base", "Lead Secondary",
  "Beat Tertiary", "Bass Tertiary", "Loop Tertiary", "Lead Tertiary",
];

const ORIGINAL_ACTIVE_HEX = [
  ["#309BBF", "#F279E6", "#1997CF", "#309BBF", "#0084C4", "#904BF2", "#904BF2", "#058EAC"],
  ["#3BEDA7", "#9A50D3", "#3BEDA7", "#3BEDA7", "#0084C4", "#67C9FF", "#67C9FF", "#2CC9FF"],
  ["#904BF2", "#6D8AF2", "#58B32C", "#904BF2", "#62B347", "#F07AEA", "#F07AEA", "#16519D"],
  ["#67C9FF", "#00CFFF", "#EDE73B", "#67C9FF", "#62B347", "#67FFE1", "#67FFE1", "#0E75C4"],
  ["#FF4F6C", "#3BDB66", "#F0D830", "#FF4F6C", "#F0D202", "#DCB425", "#DCB425", "#B21D49"],
  ["#9D65F9", "#2BE9AD", "#F08F30", "#9D65F9", "#F0D202", "#FFF266", "#FFF266", "#FE4179"],
  ["#E69E39", "#F2616D", "#E62F3E", "#E69E39", "#E6454D", "#186914", "#AD1616", "#FB6949"],
  ["#FE5C58", "#F49F30", "#A44CD6", "#FF3F3A", "#E6454D", "#EADA30", "#EADA30", "#FFB15E"],
  ["#904BF2", "#2A95D3", "#AB39ED", "#7A3BED", "#0084C4", "#FFF266", "#FFF266", "#FE4179"],
  ["#FD4FFF", "#2CF752", "#3BE3ED", "#FD4FFF", "#62B347", "#FFF266", "#FFF266", "#EB8518"],
  ["#FFE033", "#3078CA", "#F22121", "#FA814D", "#F0D202", "#A667FF", "#A666FF", "#2CC9FF"],
  ["#F2CF10", "#F430E8", "#D69922", "#FF47FD", "#E6454D", "#A667FF", "#A666FF", "#60D6FF"],
];

const ORIGINAL_SIMPLE = Object.fromEntries(SIMPLE_ROWS.map((r) => [r.key, r.defaultHex]));

function srgbToLinear01(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function linearToSrgbByte(v) {
  const x = Math.max(0, Math.min(1, Number(v) || 0));
  const s = x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(s * 255)));
}
function normalizeHex(hex) {
  const clean = String(hex || "").replace(/[^0-9a-fA-F]/g, "").padEnd(6, "0").slice(0, 6);
  return `#${clean}`.toUpperCase();
}
function hexToLinearRgba(hex) {
  const clean = normalizeHex(hex).replace("#", "");
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
function hexToRgb01(hex) {
  const clean = normalizeHex(hex).replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
  };
}
function srgb01ToLinear(v) {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function colorLuminance(hex) {
  const { r, g, b } = hexToRgb01(hex);
  return 0.2126 * srgb01ToLinear(r) + 0.7152 * srgb01ToLinear(g) + 0.0722 * srgb01ToLinear(b);
}
function isRiskyForSongLabels(hex) {
  return colorLuminance(hex) < 0.12;
}
function basename(name) {
  return String(name || "").split(/[\\/]/).pop();
}
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

async function saveBytesToOutput(outputDirHandle, name, bytes, mime = "application/octet-stream") {
  if (!outputDirHandle) {
    downloadBytes(name, bytes, mime);
    return "download";
  }

  const fileHandle = await outputDirHandle.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(new Blob([bytes], { type: mime }));
  await writable.close();
  return "folder";
}

function concatArrays(arrays) {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const a of arrays) {
    out.set(a, o);
    o += a.length;
  }
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
const SIG_TEMPLATE = new Uint8Array([152, 254, 213, 19, 9, 231, 185, 133, 177, 147, 127, 129, 201, 32, 95, 129, 121, 155, 59, 46, 5, 65, 119, 132, 82, 176, 210, 231, 19, 119, 2, 157, 89, 35, 211, 47, 8, 6, 144, 236, 22, 193, 11, 16, 156, 195, 26, 238, 9, 50, 118, 234, 184, 231, 175, 159, 25, 208, 0, 166, 54, 87, 125, 135, 113, 146, 134, 213, 36, 224, 34, 1, 237, 229, 182, 179, 55, 189, 88, 88, 165, 183, 111, 33, 96, 189, 36, 113, 134, 184, 107, 146, 184, 3, 39, 12, 112, 240, 6, 153, 93, 16, 35, 190, 11, 80, 7, 134, 173, 24, 136, 18, 73, 225, 106, 166, 236, 29, 85, 171, 26, 194, 50, 117, 84, 16, 124, 26, 25, 225, 41, 244, 195, 148, 14, 183, 141, 164, 11, 198, 137, 217, 82, 131, 11, 148, 184, 66, 91, 13, 20, 178, 8, 105, 32, 165, 9, 49, 131, 125, 189, 134, 188, 11, 53, 61, 87, 3, 190, 170, 236, 38, 238, 192, 120, 60, 56, 153, 36, 123, 202, 197, 163, 188, 101, 90, 155, 14, 44, 153, 48, 139, 139, 210, 25, 253, 86, 217, 108, 240, 248, 254, 180, 248, 126, 214, 188, 107, 162, 211, 239, 147, 63, 136, 25, 115, 193, 2, 213, 246, 206, 189, 125, 43, 14, 117, 247, 178, 9, 120, 28, 28, 215, 50, 1, 138, 232, 22, 88, 72, 148, 58, 123, 44, 63, 135, 60, 192, 75, 94, 228, 232, 176, 110, 30, 68, 90, 26, 191, 114, 68, 39, 122, 39, 73, 242, 68, 220, 187, 135, 22, 255, 175, 205, 99, 209, 175, 72, 255, 7, 128, 152, 239, 34, 125, 238, 34, 95, 203, 112, 81, 139, 118, 6, 83, 148, 174, 118, 50, 10, 130, 111, 177, 125, 178, 151, 6, 84, 156, 99, 74, 2, 208, 186, 213, 89, 44, 1, 154, 22, 160, 14, 87, 63, 175, 244, 189, 190, 117, 7, 58, 118, 211, 56, 154, 38, 198, 151, 186, 206, 35, 65, 198, 142, 216, 12, 37, 224, 30, 161, 26, 66, 98, 80, 194, 77, 242, 121, 184, 50, 185, 189, 48, 159, 226, 255, 98, 166, 114, 8, 223, 68, 248, 194, 250, 155, 160, 233, 107, 105, 128, 239, 68, 145, 188, 139, 148, 72, 211, 176, 86, 199, 77, 84, 234, 249, 50, 97, 77, 154, 91, 93, 127, 157, 152, 160, 156, 154, 109, 17, 1, 191, 166, 236, 217, 126, 78, 113, 106, 199, 50, 213, 16, 38, 88, 194, 58, 189, 169, 77, 120, 32, 63, 254, 219, 110, 234, 6, 175, 166, 170, 175, 86, 198, 149, 58, 14, 137, 163, 82, 144, 9, 236, 99, 218, 117, 32, 101, 175, 249, 188, 108, 217, 95, 0, 238, 34, 47, 85, 76, 156, 46, 254, 106, 31, 61, 204, 207, 36, 213, 24, 37, 155, 129, 5, 37, 173, 36, 33, 194, 108, 196, 20, 139, 82, 234, 43, 44, 50, 87, 93, 180, 222, 153, 53, 6, 73, 251, 69, 127, 58, 202]);
function buildSig(pakBytes) {
  const crcs = [];
  const chunk = 64 * 1024;
  for (let o = 0; o < pakBytes.length; o += chunk) crcs.push(crc32(pakBytes.slice(o, Math.min(o + chunk, pakBytes.length))));
  const w = new BinWriter();
  w.u32(SIG_MAGIC);
  w.u32(1);
  w.u32(512);
  w.bytesArr(SIG_TEMPLATE);
  w.u32(crcs.length);
  for (const c of crcs) w.u32(c);
  return w.out();
}
async function buildPak(files) {
  const usable = files
    .filter((f) => f?.bytes?.length && /\.(uasset|uexp)$/i.test(f.name))
    .sort((a, b) => {
      const an = basename(a.name).toLowerCase();
      const bn = basename(b.name).toLowerCase();
      if (an.endsWith(".uasset") && bn.endsWith(".uexp")) return -1;
      if (an.endsWith(".uexp") && bn.endsWith(".uasset")) return 1;
      return an.localeCompare(bn);
    });
  if (usable.length !== 2) throw new Error("Load both TS_LUT_UIPalette.uasset and TS_LUT_UIPalette.uexp before building the pak.");
  const names = usable.map((f) => basename(f.name).toLowerCase());
  if (!names.includes("ts_lut_uipalette.uasset") || !names.includes("ts_lut_uipalette.uexp")) throw new Error("Internal pak build expects TS_LUT_UIPalette.uasset and TS_LUT_UIPalette.uexp.");

  const data = new BinWriter();
  const entries = [];
  for (const file of usable) {
    const name = basename(file.name);
    const offset = data.length;
    const hash = await sha1(file.bytes);
    data.u64(offset);
    data.u64(file.bytes.length);
    data.u64(file.bytes.length);
    data.u32(0);
    data.bytesArr(hash);
    data.u32(0);
    data.u8(0);
    data.bytesArr(file.bytes);
    entries.push({ name, offset, size: file.bytes.length, hash });
  }

  const index = new BinWriter();
  index.str(MOUNT_POINT);
  index.i32(entries.length);
  for (const e of entries) {
    index.str(e.name);
    index.u64(e.offset);
    index.u64(e.size);
    index.u64(e.size);
    index.u32(0);
    index.bytesArr(e.hash);
    index.u32(0);
    index.u8(0);
  }

  const indexBytes = index.out();
  const indexHash = await sha1(indexBytes);
  const footer = new BinWriter();
  footer.zero(16);
  footer.u8(0);
  footer.u32(PAK_MAGIC);
  footer.u32(PAK_VERSION);
  footer.u64(data.length);
  footer.u64(indexBytes.length);
  footer.bytesArr(indexHash);
  footer.zero(160);
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
function writeColor(view, row, col, hex) {
  const rgba = hexToLinearRgba(hex);
  const off = PALETTE_START + (row * WIDTH + col) * ENTRY_SIZE;
  view.setFloat32(off, rgba[0], true);
  view.setFloat32(off + 4, rgba[1], true);
  view.setFloat32(off + 8, rgba[2], true);
  view.setFloat32(off + 12, rgba[3], true);
}
function patchUexp(originalBytes, mode, simpleColors, advancedColors, patchAllColumns) {
  const out = new Uint8Array(originalBytes);
  const view = new DataView(out.buffer);

  if (mode === "advanced") {
    for (let row = 0; row < ACTIVE_ROWS; row++) {
      if (patchAllColumns) {
        const rowColor = advancedColors[row]?.[0] || "#000000";
        for (let col = 0; col < WIDTH; col++) writeColor(view, row, col, rowColor);
      } else {
        for (let col = 0; col < WIDTH; col++) writeColor(view, row, col, advancedColors[row]?.[col] || "#000000");
      }
    }
  } else {
    for (const rowDef of SIMPLE_ROWS) {
      const columns = patchAllColumns ? Array.from({ length: WIDTH }, (_, i) => i) : [0];
      for (const col of columns) writeColor(view, rowDef.row, col, simpleColors[rowDef.key]);
    }
  }

  return out;
}
function makeAdvancedFromBytes(bytes) {
  return Array.from({ length: ACTIVE_ROWS }, (_, row) =>
    Array.from({ length: WIDTH }, (_, col) => {
      const [r, g, b] = readColor(bytes, row, col);
      return linearRgbaToHex(r, g, b);
    })
  );
}
function makeSimpleFromBytes(bytes) {
  const next = { ...ORIGINAL_SIMPLE };
  for (const r of SIMPLE_ROWS) {
    const [rr, gg, bb] = readColor(bytes, r.row, 0);
    next[r.key] = linearRgbaToHex(rr, gg, bb);
  }
  return next;
}
function HexDraftInput({ value, onCommit, className = "" }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  function change(v) {
    let next = String(v || "").toUpperCase();
    if (!next.startsWith("#")) next = `#${next.replace("#", "")}`;
    next = `#${next.slice(1).replace(/[^0-9A-F]/g, "").slice(0, 6)}`;
    setDraft(next);
  }
  function commit() {
    const normalized = normalizeHex(draft);
    setDraft(normalized);
    onCommit(normalized);
  }
  return (
    <input
      value={draft}
      onChange={(e) => change(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") { setDraft(value); e.currentTarget.blur(); }
      }}
      className={className || "min-w-0 flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 font-mono text-sm"}
      spellCheck="false"
      maxLength={7}
      placeholder="#RRGGBB"
    />
  );
}
function ColorCard({ rowDef, color, setColor }) {
  const risky = isRiskyForSongLabels(color);
  return (
    <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold">{rowDef.label}</div>
          <div className="text-sm text-zinc-400">{rowDef.sublabel}</div>
        </div>
        <div className="text-xs text-zinc-600 font-mono">row {rowDef.row}</div>
      </div>
      <div className="h-16 w-full rounded-xl border border-zinc-700 pointer-events-none shadow-inner" style={{ background: color }} title="Color preview" />
      {risky && <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">Readability warning: this color may make song labels hard to read in-game.</div>}
      <div className="flex flex-wrap gap-2 items-center">
        <input type="color" value={color} onChange={(e) => setColor(rowDef.key, e.target.value.toUpperCase())} className="w-12 h-10" title="Pick color" />
        <HexDraftInput value={color} onCommit={(next) => setColor(rowDef.key, next)} />
      </div>
    </div>
  );
}
function AdvancedGrid({ advancedColors, setAdvancedColor }) {
  const cols = Array.from({ length: WIDTH }, (_, col) => col);
  const rows = Array.from({ length: ACTIVE_ROWS }, (_, row) => row);
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">Advanced palette</h2>
        <p className="text-sm text-zinc-400">Edit the active 12 x 8 palette block. Rows 12-31 are black filler and are hidden.</p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950">
        <table className="min-w-[980px] w-full table-fixed border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-zinc-900 text-cyan-200">
              <th className="sticky left-0 bg-zinc-900 p-2 text-left z-10 w-[132px]">Row</th>
              {cols.map((col) => <th key={col} className="p-2 text-left">Col {col}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row} className="border-t border-zinc-800">
                <th className="sticky left-0 bg-zinc-950 p-2 text-left text-zinc-300 z-10 whitespace-nowrap w-[132px] text-xs">{row} Â· {ACTIVE_ROW_LABELS[row]}</th>
                {cols.map((col) => {
                  const color = advancedColors[row]?.[col] || "#000000";
                  return (
                    <td key={`${row}-${col}`} className="p-1.5 border-l border-zinc-900">
                      <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-1.5 items-center min-w-0">
                        <input type="color" value={color} onChange={(e) => setAdvancedColor(row, col, e.target.value.toUpperCase())} className="w-[28px] h-[30px] p-0 rounded border border-zinc-700 bg-transparent" />
                        <HexDraftInput value={color} onCommit={(next) => setAdvancedColor(row, col, next)} className="w-full min-w-0 h-[30px] bg-zinc-900 border border-zinc-800 rounded-lg px-1.5 font-mono text-[11px]" />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function App() {
  const [uasset, setUasset] = useState(null);
  const [uexp, setUexp] = useState(null);
  const [patchedUexp, setPatchedUexp] = useState(null);
  const [mode, setMode] = useState("simple");
  const [patchAllColumns, setPatchAllColumns] = useState(true);
  const [status, setStatus] = useState("Load TS_LUT_UIPalette.uasset and TS_LUT_UIPalette.uexp.");
  const [simpleColors, setSimpleColors] = useState(() => ({ ...ORIGINAL_SIMPLE }));
  const [advancedColors, setAdvancedColors] = useState(() => ORIGINAL_ACTIVE_HEX.map((row) => [...row]));
  const [outputDirHandle, setOutputDirHandle] = useState(null);
  const [outputDirName, setOutputDirName] = useState("");

  const loadedPreview = useMemo(() => {
    if (!uexp?.bytes) return [];
    return SIMPLE_ROWS.map((r) => {
      try {
        const [rr, gg, bb, aa] = readColor(uexp.bytes, r.row, 0);
        return { ...r, hex: linearRgbaToHex(rr, gg, bb), alpha: aa };
      } catch {
        return { ...r, hex: "#000000", alpha: 0 };
      }
    });
  }, [uexp]);

  async function loadFile(e, kind) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (kind === "uasset") {
      if (file.name !== "TS_LUT_UIPalette.uasset") return setStatus("Wrong uasset. Load exactly TS_LUT_UIPalette.uasset.");
      setUasset({ name: file.name, bytes });
      setStatus(`Loaded ${file.name}.`);
      return;
    }
    if (file.name !== "TS_LUT_UIPalette.uexp") return setStatus("Wrong uexp. Load exactly TS_LUT_UIPalette.uexp, not MPC_Hype.");
    const problem = checkUexp(bytes);
    if (problem) return setStatus(`Rejected ${file.name}: ${problem}.`);
    setUexp({ name: file.name, bytes });
    setPatchedUexp(null);
    setSimpleColors(makeSimpleFromBytes(bytes));
    setAdvancedColors(makeAdvancedFromBytes(bytes));
    setStatus(`Loaded ${file.name}. Read editable colors from column 0 and active 12-row palette block.`);
  }

  function setSimpleColor(key, hex) {
    setSimpleColors((c) => ({ ...c, [key]: normalizeHex(hex) }));
    setPatchedUexp(null);
  }
  function setAdvancedColor(row, col, hex) {
    setAdvancedColors((old) => old.map((r, ri) => ri === row ? r.map((v, ci) => ci === col ? normalizeHex(hex) : v) : r));
    setPatchedUexp(null);
  }
  function resetFromLoaded() {
    if (!uexp?.bytes) return setStatus("Load TS_LUT_UIPalette.uexp first.");
    setSimpleColors(makeSimpleFromBytes(uexp.bytes));
    setAdvancedColors(makeAdvancedFromBytes(uexp.bytes));
    setPatchedUexp(null);
    setStatus("Reset controls to loaded TS_LUT_UIPalette values.");
  }
  function applyOriginalPreset() {
    setSimpleColors({ ...ORIGINAL_SIMPLE });
    setAdvancedColors(ORIGINAL_ACTIVE_HEX.map((row) => [...row]));
    setPatchedUexp(null);
    setStatus("Applied original TS_LUT_UIPalette colors.");
  }
  function makePatched() {
    if (!uexp?.bytes) {
      setStatus("Load TS_LUT_UIPalette.uexp first.");
      return null;
    }
    const bytes = patchUexp(uexp.bytes, mode, simpleColors, advancedColors, patchAllColumns);
    setPatchedUexp(bytes);
    setStatus(mode === "advanced" ? "Patched UEXP in memory using Advanced active 12 x 8 palette values. Patch all 8 columns mirrors column 0 across each active row." : `Patched UEXP in memory using Simple deck colors. ${patchAllColumns ? "All 8 columns" : "Only column 0"} were patched for the 4 primary deck rows.`);
    return bytes;
  }
  async function chooseOutputFolder() {
    if (!("showDirectoryPicker" in window)) {
      setStatus("This WebView does not support folder writing. The app will keep using normal downloads.");
      return;
    }

    try {
      const handle = await window.showDirectoryPicker({ mode: "readwrite" });
      setOutputDirHandle(handle);
      setOutputDirName(handle.name || "selected folder");
      setStatus(`Output folder set to ${handle.name || "selected folder"}.`);
    } catch (err) {
      if (err?.name !== "AbortError") {
        setStatus(`Output folder picker failed: ${err?.message || err}`);
      }
    }
  }

  function clearOutputFolder() {
    setOutputDirHandle(null);
    setOutputDirName("");
    setStatus("Output folder cleared. Files will download normally.");
  }

  async function exportUexp() {
    const bytes = patchedUexp || makePatched();
    if (!bytes) return;
    try {
      const method = await saveBytesToOutput(outputDirHandle, "TS_LUT_UIPalette.uexp", bytes);
      setStatus(method === "folder" ? "Exported patched TS_LUT_UIPalette.uexp to the selected output folder." : "Exported patched TS_LUT_UIPalette.uexp as a download.");
    } catch (err) {
      setStatus(`Export failed: ${err?.message || err}`);
    }
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
      const method = await saveBytesToOutput(outputDirHandle, PAK_NAME, pak);
      await saveBytesToOutput(outputDirHandle, SIG_NAME, sig);
      setStatus(`Generated ${PAK_NAME} and ${SIG_NAME} ${method === "folder" ? "in the selected output folder" : "as downloads"}. Mount: ${MOUNT_POINT}. Pak ${pak.length} bytes, sig ${sig.length} bytes.`);
    } catch (err) {
      setStatus(`Pak build failed: ${err.message}`);
    }
  }

  const pakBuilderPanel = (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-5 space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Package className="w-5 h-5" />Internal pak builder</h2>
        <p className="text-sm text-zinc-400">Outputs {PAK_NAME} and {SIG_NAME}. Place both in FUSER's ~mods folder.</p>
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 space-y-2">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Output location</div>
          <div className="text-sm font-mono break-all text-zinc-300">{outputDirName || "Downloads folder / browser default"}</div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={chooseOutputFolder} className="gap-2 bg-zinc-700 text-zinc-100 hover:bg-zinc-600"><Download className="w-4 h-4" />Set output folder</Button>
            {outputDirHandle && <Button onClick={clearOutputFolder} className="gap-2 bg-zinc-800 text-zinc-100 hover:bg-zinc-700">Clear</Button>}
          </div>
          <p className="text-xs text-zinc-500">If folder writing is not supported, files will download normally.</p>
        </div>
        <Button onClick={makePatched} className="w-full gap-2"><ShieldCheck className="w-4 h-4" />Patch UEXP in memory</Button>
        <Button onClick={exportUexp} className="w-full gap-2 bg-zinc-700 text-zinc-100 hover:bg-zinc-600"><Download className="w-4 h-4" />Export patched .uexp only</Button>
        <Button onClick={generatePakSig} className="w-full gap-2"><Package className="w-4 h-4" />Generate PAK + SIG</Button>
        <Button onClick={applyOriginalPreset} className="w-full gap-2 bg-fuchsia-500 hover:bg-fuchsia-400"><Palette className="w-4 h-4" />Apply original colors</Button>
        <Button onClick={resetFromLoaded} className="w-full gap-2 bg-zinc-700 text-zinc-100 hover:bg-zinc-600"><RotateCcw className="w-4 h-4" />Reset from loaded file</Button>
      </CardContent>
    </Card>
  );

  return (
    <main className="min-h-screen p-4 md:p-6 bg-zinc-950 text-zinc-100 overflow-x-hidden">
      <div className="w-full max-w-[1500px] mx-auto space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3 text-cyan-300 mb-2"><Palette className="w-7 h-7" /><span className="text-sm uppercase tracking-widest">TS_LUT_UIPalette workflow</span></div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">FUSER Palette Builder</h1>
            <p className="text-zinc-400 mt-3 max-w-4xl">Patches the confirmed runtime palette source, then builds a minimal replacement .pak and .sig internally.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 cursor-pointer shadow"><Upload className="w-4 h-4" />Load .uasset<input className="hidden" type="file" accept=".uasset" onChange={(e) => loadFile(e, "uasset")} /></label>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 cursor-pointer shadow"><Upload className="w-4 h-4" />Load .uexp<input className="hidden" type="file" accept=".uexp" onChange={(e) => loadFile(e, "uexp")} /></label>
          </div>
        </header>

        <section className={mode === "advanced" ? "grid grid-cols-1 gap-4 items-start" : "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start"}>
          <div className="space-y-4 min-w-0">
            <Card className="bg-zinc-900 border-zinc-800 min-w-0"><CardContent className="p-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div><span className="text-zinc-500">UAsset:</span> <span className="font-mono">{uasset?.name || "not loaded"}</span></div>
                <div><span className="text-zinc-500">UExp:</span> <span className="font-mono">{uexp?.name || "not loaded"}</span></div>
                <div><span className="text-zinc-500">Palette:</span> <span className="font-mono">offset 0xAD, 8 x 32, float32 RGBA</span></div>
              </div>
              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-300 whitespace-pre-wrap">{status}</div>
            </CardContent></Card>

            <Card className="bg-zinc-900 border-zinc-800 min-w-0"><CardContent className="p-5 space-y-6">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-xl font-semibold">Palette controls</h2>
                  <p className="text-sm text-zinc-400">Simple edits only the four main deck colors. Advanced edits the active 12 x 8 palette block.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setMode("simple")} className={mode === "simple" ? "" : "bg-zinc-700 text-zinc-100 hover:bg-zinc-600"}>Simple</Button>
                  <Button onClick={() => setMode("advanced")} className={mode === "advanced" ? "" : "bg-zinc-700 text-zinc-100 hover:bg-zinc-600"}>Advanced</Button>
                </div>
              </div>

              {mode === "simple" ? (
                <section className="space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="text-xl font-semibold text-cyan-200">Primary deck colors</h3>
                      <p className="text-sm text-zinc-400">For normal deck color mods, keep Patch all 8 columns enabled.</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2"><input type="checkbox" checked={patchAllColumns} onChange={(e) => setPatchAllColumns(e.target.checked)} /> Patch all 8 columns</label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3">
                    {SIMPLE_ROWS.map((r) => <ColorCard key={r.key} rowDef={r} color={simpleColors[r.key]} setColor={setSimpleColor} />)}
                  </div>
                </section>
              ) : (
                <AdvancedGrid advancedColors={advancedColors} setAdvancedColor={setAdvancedColor} />
              )}
            </CardContent></Card>
          </div>

          <div className={mode === "advanced" ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "space-y-4"}>
            {pakBuilderPanel}
            <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-5 space-y-3">
              <h2 className="text-xl font-semibold">Loaded column 0 preview</h2>
              <p className="text-sm text-zinc-400">These are read from TS_LUT_UIPalette.uexp using sRGB preview conversion.</p>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {loadedPreview.length ? loadedPreview.map((p) => (
                  <div key={p.key} className="flex items-center gap-2 justify-between rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2">
                    <span>{p.sublabel}</span><span className="font-mono text-zinc-400">{p.hex}</span><span className="w-10 h-6 rounded border border-zinc-700 pointer-events-none" style={{ background: p.hex }} />
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

