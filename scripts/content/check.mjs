#!/usr/bin/env node
// Content to-do report (never fails the build).
//
//   npm run content:check
//
// Lists trips, spots and places that have no `description`, have one longer than 160 characters,
// or have one still marked `# draft` (written by Claude, awaiting the owner's review).
// Also lists entries with `draft: true`, which are hidden from the live site (but shown in dev).
// A blank `description:` (or `""`) means "none on purpose" and is not reported.

import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CONTENT = path.join(ROOT, 'src/content');
const MAX = 160;

const files = [
  ...['trips', 'spots'].flatMap((c) =>
    fs.readdirSync(path.join(CONTENT, c)).map((d) => ({ kind: c, id: d, file: path.join(CONTENT, c, d, 'index.md') }))),
  ...fs.readdirSync(path.join(CONTENT, 'regions')).map((f) => ({ kind: 'places', id: f.replace(/\.md$/, ''), file: path.join(CONTENT, 'regions', f) })),
].filter((f) => fs.existsSync(f.file));

const missing = [], tooLong = [], drafts = [], unpublished = [];
for (const f of files) {
  const raw = fs.readFileSync(f.file, 'utf8');
  const head = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const data = parse(head) ?? {};
  const label = `${f.kind}/${f.id}`;
  if (data.draft === true) unpublished.push(label);
  if (!('description' in data)) missing.push(label);
  else if (data.description) {
    if (data.description.length > MAX) tooLong.push(`${label} (${data.description.length} chars)`);
    if (/^description:.*#\s*draft\s*$/m.test(head)) drafts.push(label);
  }
}

const section = (title, list, hint) => {
  console.log(`\n${title}: ${list.length}${list.length ? `  (${hint})` : ''}`);
  for (const l of list) console.log(`  - ${l}`);
};
console.log(`Checked ${files.length} trips, spots and places.`);
section('Missing description', missing, 'cards fall back to the first sentence of the text');
section(`Longer than ${MAX} characters`, tooLong, 'cards clamp to 3 lines; search previews get cut');
section('Draft descriptions to review', drafts, 'edit if needed, then delete the "# draft" comment');
section('Unpublished (draft: true)', unpublished, 'hidden from the live site; delete the line to publish');
