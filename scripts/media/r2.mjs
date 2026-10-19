#!/usr/bin/env node
// Sync the local media working set with Cloudflare R2.
//
//   npm run media:upload            upload missing originals + variants
//   npm run media:upload -- --force re-upload everything (e.g. after changing QUALITY)
//   npm run media:pull              download originals missing locally (new machine), then run media:process
//
// Bucket layout:  originals/<key>      untouched source images (never served publicly by the site)
//                 w/<variant key>      WebP variants the site links to (PUBLIC_MEDIA_BASE_URL points here)
// Credentials come from .env (see .env.example and docs/media.md).

import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const ROOT = path.resolve(import.meta.dirname, '../..');
const LOCAL = { originals: path.join(ROOT, '.media/originals'), w: path.join(ROOT, '.media/variants') };
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error('Missing R2_* settings in .env (see .env.example).');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

async function listRemote(prefix) {
  const out = new Map();
  let token;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: R2_BUCKET, Prefix: prefix, ContinuationToken: token }));
    for (const o of res.Contents ?? []) out.set(o.Key, o.Size);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return out;
}

const listLocal = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true }).map((f) => f.split(path.sep).join('/'))
    .filter((f) => fs.statSync(path.join(dir, f)).isFile()) : [];

const TYPES = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

async function pool(items, n, fn) {
  const q = [...items];
  let done = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (q.length) {
      await fn(q.shift());
      if (++done % 100 === 0) console.log(`  ${done}/${items.length}`);
    }
  }));
}

async function upload(force) {
  for (const [prefix, dir] of Object.entries(LOCAL)) {
    const remote = await listRemote(`${prefix}/`);
    const todo = listLocal(dir).filter((f) => force || remote.get(`${prefix}/${f}`) !== fs.statSync(path.join(dir, f)).size);
    console.log(`${prefix}/: ${todo.length} to upload (${remote.size} already in bucket)`);
    await pool(todo, 8, (f) => s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: `${prefix}/${f}`,
      Body: fs.readFileSync(path.join(dir, f)),
      ContentType: TYPES[path.extname(f).toLowerCase()] ?? 'application/octet-stream',
      // Variant names are derived from content hashes, so they can be cached forever.
      CacheControl: prefix === 'w' ? 'public, max-age=31536000, immutable' : undefined,
    })));
  }
}

async function pull() {
  const remote = await listRemote('originals/');
  const have = new Set(listLocal(LOCAL.originals));
  const todo = [...remote.keys()].map((k) => k.slice('originals/'.length)).filter((k) => !have.has(k));
  console.log(`originals/: ${todo.length} to download`);
  await pool(todo, 8, async (k) => {
    const res = await s3.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: `originals/${k}` }));
    const dest = path.join(LOCAL.originals, k);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, Buffer.from(await res.Body.transformToByteArray()));
  });
  console.log('Now run: npm run media:process');
}

const cmd = process.argv[2];
if (cmd === 'upload') await upload(process.argv.includes('--force'));
else if (cmd === 'pull') await pull();
else { console.error('usage: r2.mjs upload [--force] | pull'); process.exit(1); }
