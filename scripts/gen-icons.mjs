// Generates the PWA icons (192, 512) and the iOS apple-touch-icon (180) as real
// PNGs, with no external dependencies — builds the PNG byte stream directly via
// zlib. Design: full-bleed accent background with a centered cream rounded
// square echoing the brand mark. Run with: npm run icons
import zlib from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public");
mkdirSync(outDir, { recursive: true });

// --- colors (match the app's CSS variables) ---
const ACCENT = [0x55, 0x65, 0x4c]; // #55654C
const CREAM = [0xed, 0xef, 0xe9]; // #EDEFE9

// --- CRC32 ---
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// rounded-rect membership test
function inRoundedRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cxMin = x0 + r;
  const cxMax = x1 - r;
  const cyMin = y0 + r;
  const cyMax = y1 - r;
  const dx = x < cxMin ? cxMin - x : x > cxMax ? x - cxMax : 0;
  const dy = y < cyMin ? cyMin - y : y > cyMax ? y - cyMax : 0;
  return dx * dx + dy * dy <= r * r;
}

function buildPng(size) {
  const markSide = Math.round(size * 0.46);
  const m0 = Math.round((size - markSide) / 2);
  const m1 = m0 + markSide;
  const markR = Math.round(markSide * 0.28);

  // raw scanlines: each row prefixed with a filter byte (0)
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const onMark = inRoundedRect(x + 0.5, y + 0.5, m0, m0, m1, m1, markR);
      const [r, g, b] = onMark ? CREAM : ACCENT;
      raw[p++] = r;
      raw[p++] = g;
      raw[p++] = b;
      raw[p++] = 0xff;
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const targets = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
];
for (const [name, size] of targets) {
  writeFileSync(join(outDir, name), buildPng(size));
  console.log(`wrote ${name} (${size}x${size})`);
}
