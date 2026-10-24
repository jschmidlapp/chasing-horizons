// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import fs from 'node:fs';
import path from 'node:path';
import siteConfig from './site.config.mjs';
import rehypeMedia from './src/lib/rehype-media.mjs';
import { DEV_LOCAL_MEDIA_ENV, LOCAL_MEDIA_PREFIX, remoteMediaBase } from './src/lib/media-core.mjs';
import redirects from './src/data/redirects.json' with { type: 'json' };

/** @type {Record<string, string>} */
const TYPES = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

/**
 * Serve `<dir>/<request path>` if it exists; returns false otherwise.
 * @param {string} dir
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
function serveFrom(dir, req, res) {
  const file = path.join(dir, decodeURIComponent((req.url ?? '').split('?')[0]));
  if (!file.startsWith(dir + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
  res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
  return true;
}

/**
 * Dev-only media serving, so photos can be previewed before (or without) uploading to R2:
 *  - /_media/<variant>  local .media/variants file, else redirect to the same file on R2
 *  - /media/<key>       local original, used for photos referenced in Markdown but not yet processed
 */
/** @type {import('astro').AstroIntegration} */
const localMedia = {
  name: 'local-media',
  hooks: {
    'astro:config:setup': ({ command }) => {
      if (command === 'dev') process.env[DEV_LOCAL_MEDIA_ENV] = '1';
    },
    'astro:server:setup': ({ server }) => {
      const variants = path.resolve('.media/variants');
      const originals = path.resolve('.media/originals');
      server.middlewares.use(LOCAL_MEDIA_PREFIX, (req, res, next) => {
        if (serveFrom(variants, req, res)) return;
        if (!remoteMediaBase) return next();
        res.statusCode = 302;
        res.setHeader('Location', remoteMediaBase + (req.url ?? ''));
        res.end();
      });
      server.middlewares.use('/media', (req, res, next) => {
        if (!serveFrom(originals, req, res)) next();
      });
    },
    'astro:build:start': ({ logger }) => {
      if (!siteConfig.mediaBaseUrl) logger.warn('PUBLIC_MEDIA_BASE_URL is not set: images will only work under `astro dev`.');
    },
  },
};

export default defineConfig({
  site: siteConfig.siteUrl,
  base: siteConfig.basePath,
  trailingSlash: 'always',
  // Old URL -> new URL (src/data/redirects.json, paths without the base), e.g. after moving an entry
  // between trips/ and spots/. Astro prefixes the base on the source but not the destination.
  redirects: Object.fromEntries(
    Object.entries(redirects).map(([from, to]) => [from, `${siteConfig.basePath.replace(/\/$/, '')}${to}`]),
  ),
  integrations: [localMedia],
  markdown: {
    processor: unified({ rehypePlugins: [rehypeMedia] }),
  },
});
