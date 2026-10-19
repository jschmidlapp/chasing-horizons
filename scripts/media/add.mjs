#!/usr/bin/env node
// Add new photos to a trip (or any content folder) and print Markdown to paste.
//
//   npm run media:add -- trips/<trip-slug> ~/Pictures/IMG_1234.jpg ~/Pictures/IMG_1235.jpg
//
// Copies each file to .media/originals/<prefix>/<hash>.<ext>, then you run
// `npm run media:process && npm run media:upload`. See docs/media.md.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '../..');
const [prefix, ...files] = process.argv.slice(2);
if (!prefix || !files.length || prefix.startsWith('/')) {
  console.error('usage: npm run media:add -- <prefix e.g. trips/my-trip> <image files...>');
  process.exit(1);
}

const lines = [];
for (const file of files) {
  const buf = fs.readFileSync(file);
  const hash = crypto.createHash('md5').update(buf).digest('hex').slice(0, 10);
  const ext = path.extname(file).toLowerCase().replace('.jpeg', '.jpg');
  const key = `${prefix.replace(/\/$/, '')}/${hash}${ext}`;
  const dest = path.join(ROOT, '.media/originals', key);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
  lines.push(`![](/media/${key})`);
}
console.log(lines.join('\n'));
console.log('\nNext: npm run media:process && npm run media:upload');
