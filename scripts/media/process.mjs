#!/usr/bin/env node
// Generate responsive WebP variants for every original image and update the media manifest.
//
//   npm run media:process
//
// Reads   .media/originals/<key>                     (gitignored; the source of truth is R2 `originals/`)
// Writes  .media/variants/<key minus ext>-<w>.webp   (gitignored; uploaded to R2 by media:upload)
//         src/data/media.json                        (committed: key -> { w, h, widths })
// Idempotent: variants that already exist are skipped. See docs/media.md.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { WIDTHS, MAX_EDGE, QUALITY, variantKey } from './widths.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const ORIGINALS = path.join(ROOT, '.media/originals');
const VARIANTS = path.join(ROOT, '.media/variants');
const MANIFEST = path.join(ROOT, 'src/data/media.json');

const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
const keys = fs.readdirSync(ORIGINALS, { recursive: true })
  .map((f) => f.split(path.sep).join('/'))
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .sort();

let made = 0;
async function processOne(key) {
  const src = path.join(ORIGINALS, key);
  const meta = await sharp(src).rotate().metadata();
  // .rotate() applies EXIF orientation; metadata() still reports pre-rotation size, so swap if needed.
  const swap = (meta.orientation ?? 1) >= 5;
  const w = swap ? meta.height : meta.width;
  const h = swap ? meta.width : meta.height;
  // Cap the long edge at MAX_EDGE so portrait shots don't balloon; add the capped size itself
  // if it's meaningfully larger than the biggest standard width below it.
  const maxW = Math.min(w, Math.round((MAX_EDGE * w) / Math.max(w, h)));
  const widths = WIDTHS.filter((x) => x <= maxW);
  if (!widths.length || maxW > widths.at(-1) * 1.15) widths.push(maxW);
  for (const width of widths) {
    const out = path.join(VARIANTS, variantKey(key, width));
    if (fs.existsSync(out)) continue;
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await sharp(src).rotate().resize({ width }).webp({ quality: QUALITY }).toFile(out);
    made++;
  }
  manifest[key] = { w, h, widths };
}

const queue = [...keys];
const workers = Array.from({ length: Math.max(1, os.availableParallelism() - 1) }, async () => {
  while (queue.length) await processOne(queue.shift());
});
await Promise.all(workers);

for (const k of Object.keys(manifest)) if (!keys.includes(k)) delete manifest[k];
const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify(sorted, null, 1) + '\n');
console.log(`${keys.length} originals, ${made} new variants. Manifest: ${path.relative(ROOT, MANIFEST)}`);
