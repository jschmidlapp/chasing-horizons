#!/usr/bin/env node
// One-time import of the Google Sites export (HTML + images) into Astro content files.
//
//   npm run import:google-sites -- [exportDir]      (default: ~/website/current)
//
// Writes:
//   src/content/{regions,trips,gear,pages}/...   Markdown content (overwritten!)
//   .media/originals/<key>                        original images, deduped by content hash
// Page-to-content mapping lives in ./pages.config.mjs. See docs/migration.md.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import * as cheerio from 'cheerio';
import { regions, singleTripPages, multiTripPages, gearPage, homePage } from './pages.config.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const SRC = path.resolve(process.argv[2] ?? path.join(os.homedir(), 'website/current'));
const CONTENT = path.join(ROOT, 'src/content');
const ORIGINALS = path.join(ROOT, '.media/originals');

const report = [];
const note = (msg) => report.push(msg);

// ---------- helpers ----------

const slugify = (s) =>
  s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/['’]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const clean = (s) => s.replace(/\s+/g, ' ').trim();

const yamlStr = (s) => JSON.stringify(s);

function frontmatter(obj) {
  const lines = ['---'];
  const emit = (key, val, indent = '') => {
    if (val === undefined || val === null) return;
    if (Array.isArray(val)) lines.push(`${indent}${key}: [${val.map((v) => yamlStr(v)).join(', ')}]`);
    else if (typeof val === 'object') {
      lines.push(`${indent}${key}:`);
      for (const [k, v] of Object.entries(val)) emit(k, v, indent + '  ');
    } else lines.push(`${indent}${key}: ${typeof val === 'string' ? yamlStr(val) : val}`);
  };
  for (const [k, v] of Object.entries(obj)) emit(k, v);
  lines.push('---', '');
  return lines.join('\n');
}

const escapeMd = (s) => s.replace(/([\\*_[\]<>])/g, '\\$1').replace(/^(#|\d+\.|[-+] )/, '\\$1');

// ---------- media ----------

const mediaByHash = new Map(); // md5 -> key
const usedKeys = new Set();

/** Copy an exported image into .media/originals under `<prefix>/<hash>.jpg` (deduped) and return its /media URL. */
function addMedia(_page, relSrc, prefix) {
  const file = path.join(SRC, decodeURIComponent(relSrc));
  const buf = fs.readFileSync(file);
  const hash = crypto.createHash('md5').update(buf).digest('hex');
  let key = mediaByHash.get(hash);
  if (!key) {
    key = `${prefix}/${hash.slice(0, 10)}${path.extname(file).toLowerCase()}`;
    if (usedKeys.has(key)) throw new Error(`media key collision ${key}`);
    usedKeys.add(key);
    mediaByHash.set(hash, key);
    const dest = path.join(ORIGINALS, key);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(file, dest);
  }
  return `/media/${key}`;
}

// ---------- parsing ----------

/** Parse a Google Sites page into an ordered block list. Images keep their <section> index so we can group them. */
function parsePage(page) {
  const $ = cheerio.load(fs.readFileSync(path.join(SRC, page), 'utf8'));
  const blocks = [];
  let banner = null;
  $('section').each((si, sec) => {
    const bg = $(sec).find('[style*="background-image: url("]').attr('style');
    const m = bg && bg.match(/background-image: url\(([^)]+\.jpg)/);
    if (m && !banner) banner = m[1];
    $(sec).find('h1,h2,h3,h4,p,img').each((_, el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'img') {
        const src = $(el).attr('src') ?? '';
        if (!/^https?:/.test(src) && src.endsWith('.jpg')) blocks.push({ type: 'img', src, section: si });
        return;
      }
      if ($(el).parents('p,h1,h2,h3,h4,li').length) return;
      const text = clean($(el).text());
      if (!text) return;
      if (tag === 'p') blocks.push({ type: 'p', text });
      else blocks.push({ type: 'h', level: Number(tag[1]), text });
    });
  });
  return { blocks, banner };
}

const contentImages = (page) => parsePage(page).blocks.filter((b) => b.type === 'img');

/** Render blocks to Markdown. `baseLevel` is the heading level that maps to `##`. */
function toMarkdown(blocks, { baseLevel, mediaPrefix, page, title }) {
  const out = [];
  let images = [];
  let lastSection = null;
  let context = title;
  const flush = () => {
    if (images.length) out.push(images.join('\n'));
    images = [];
  };
  for (const b of blocks) {
    if (b.type === 'img') {
      if (lastSection !== null && b.section !== lastSection) flush();
      lastSection = b.section;
      images.push(`![${escapeMd(context)}](${addMedia(page, b.src, mediaPrefix)})`);
      continue;
    }
    flush();
    lastSection = null;
    if (b.type === 'h') {
      const level = Math.min(6, Math.max(2, b.level - baseLevel + 2));
      out.push(`${'#'.repeat(level)} ${escapeMd(b.text)}`);
      context = b.text;
    } else out.push(escapeMd(b.text));
  }
  flush();
  return out.join('\n\n') + '\n';
}

function firstImage(md) {
  const m = md.match(/!\[[^\]]*\]\(([^)]+)\)/);
  return m ? m[1] : undefined;
}

function hubCover(ref) {
  const img = contentImages(ref.page)[ref.index];
  if (!img) throw new Error(`no image ${ref.index} on ${ref.page}`);
  return img;
}

// ---------- writers ----------

function write(rel, text) {
  const file = path.join(CONTENT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

const tripSlugs = new Set();
function uniqueTripSlug(title, region) {
  let slug = slugify(title);
  if (tripSlugs.has(slug)) {
    const alt = `${slug}-${region}`;
    note(`Slug collision: "${title}" in ${region} → ${alt}`);
    slug = alt;
  }
  tripSlugs.add(slug);
  return slug;
}

let tripOrder = 0;
function writeTrip({ title, region, area, activities, body, cover, banner, page }) {
  const slug = uniqueTripSlug(title, region);
  const md = toMarkdown(body, { ...body.opts, page, title, mediaPrefix: `trips/${slug}` });
  const coverUrl = cover ? addMedia(cover.page, cover.src, `trips/${slug}`) : firstImage(md);
  if (!coverUrl) note(`Trip "${title}" (${page}) has no images`);
  if (!body.some((b) => b.type === 'p')) note(`Trip "${title}" (${page}) has no text`);
  write(`trips/${slug}/index.md`, frontmatter({
    title, region, area, activities, cover: coverUrl,
    banner: banner ? addMedia(page, banner, `trips/${slug}`) : undefined,
    legacy: { page, order: tripOrder++ },
  }) + md);
  return slug;
}

// ---------- main ----------

fs.rmSync(CONTENT, { recursive: true, force: true });
fs.rmSync(ORIGINALS, { recursive: true, force: true });

const regionIntro = {};

// Single-trip pages: h1 = region, h2 = trip title, h3+ = sections.
for (const spec of singleTripPages) {
  const { blocks, banner } = parsePage(spec.page);
  const titleIdx = blocks.findIndex((b) => b.type === 'h' && b.level === 2);
  const title = blocks[titleIdx].text;
  const body = blocks.slice(titleIdx + 1);
  body.opts = { baseLevel: 3 };
  const cover = { page: spec.cover.page, src: hubCover(spec.cover).src };
  writeTrip({ title, region: spec.region, activities: spec.activities, body, cover, banner, page: spec.page });
}

// Multi-trip pages.
for (const spec of multiTripPages) {
  const { blocks } = parsePage(spec.page);
  const headingParas = new Set(spec.headingParagraphs ?? []);
  const norm = blocks.map((b) =>
    b.type === 'p' && headingParas.has(b.text) ? { type: 'h', level: spec.split, text: b.text } : b);
  let area;
  let current = null;
  const intro = [];
  const trips = [];
  for (const b of norm) {
    if (b.type === 'h' && b.level === 1) continue;
    if (b.type === 'h' && b.level < spec.split) { area = b.text; current = null; continue; }
    if (b.type === 'h' && b.level === spec.split) {
      current = { title: b.text, area, body: [] };
      trips.push(current);
      continue;
    }
    (current ? current.body : intro).push(b);
  }
  if (intro.length) {
    const introImgs = intro.filter((b) => b.type === 'img').length;
    if (introImgs) note(`${spec.page}: ${introImgs} intro image(s) kept in region intro`);
    regionIntro[spec.region] = { blocks: intro, page: spec.page };
  }
  for (const t of trips) {
    t.body.opts = { baseLevel: spec.split + 1 };
    const activities = spec.activities?.[t.title] ?? spec.defaultActivities;
    writeTrip({ title: t.title, region: spec.region, area: t.area, activities, body: t.body, page: spec.page });
  }
}

// Regions.
regions.forEach((r, order) => {
  const coverImg = hubCover(r.cover);
  const cover = addMedia(r.cover.page, coverImg.src, `regions/${r.slug}`);
  const { banner } = parsePage(r.page);
  const bannerUrl = banner ? addMedia(r.page, banner, `regions/${r.slug}`) : undefined;
  const intro = regionIntro[r.slug];
  const md = intro ? toMarkdown(intro.blocks, { baseLevel: 2, page: intro.page, title: r.title, mediaPrefix: `regions/${r.slug}` }) : '';
  write(`regions/${r.slug}.md`, frontmatter({
    title: r.title, parent: r.parent, order, cover, banner: bannerUrl, legacy: { page: r.page },
  }) + md);
});

// Gear: image, then h1 name, then p description.
{
  const { blocks, banner } = parsePage(gearPage);
  let pendingImg = null;
  let item = null;
  let order = 0;
  const items = [];
  for (const b of blocks) {
    if (b.type === 'img') { pendingImg = b; continue; }
    if (b.type === 'h' && b.text !== 'Gear') { item = { name: b.text, img: pendingImg, order: order++ }; items.push(item); pendingImg = null; continue; }
    if (b.type === 'p' && item) item.description = b.text;
  }
  for (const it of items) {
    const slug = slugify(it.name);
    write(`gear/${slug}.md`, frontmatter({
      title: it.name, description: it.description, order: it.order,
      image: it.img ? addMedia(gearPage, it.img.src, `gear/${slug}`) : undefined,
    }));
  }
  write('pages/gear.md', frontmatter({ title: 'Gear', tagline: 'Stuff I Use', hero: addMedia(gearPage, banner, 'pages/gear') }));
}

// Home + Places pages.
{
  const { banner, blocks } = parsePage(homePage);
  const imgs = blocks.filter((b) => b.type === 'img');
  const places = parsePage('Places.html');
  write('pages/home.md', frontmatter({
    title: 'Chasing Horizons', tagline: 'Hikes, rides, and interesting places',
    hero: addMedia(homePage, banner, 'pages/home'),
    placesCard: addMedia(homePage, imgs[0].src, 'pages/home'),
    gearCard: addMedia(homePage, imgs[1].src, 'pages/home'),
  }));
  write('pages/places.md', frontmatter({
    title: 'Places', tagline: "Interesting Places I've Been", hero: addMedia('Places.html', places.banner, 'pages/places'),
  }));
}

const totalFiles = fs.readdirSync(SRC, { recursive: true }).filter((f) => f.endsWith('.jpg')).length;
console.log(`Imported ${tripSlugs.size} trips, ${regions.length} regions; ${usedKeys.size} unique images (from ${totalFiles} files).`);
if (report.length) console.log('\nNotes:\n- ' + report.join('\n- '));
