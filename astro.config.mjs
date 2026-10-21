// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import fs from 'node:fs';
import path from 'node:path';
import siteConfig from './site.config.mjs';
import rehypeMedia from './src/lib/rehype-media.mjs';
import { LOCAL_MEDIA_PREFIX } from './src/lib/media-core.mjs';
import redirects from './src/data/redirects.json' with { type: 'json' };

/** Dev-only: serve .media/variants at /_media so the site works before/without R2. */
/** @type {import('astro').AstroIntegration} */
const localMedia = {
  name: 'local-media',
  hooks: {
    'astro:server:setup': ({ server }) => {
      const dir = path.resolve('.media/variants');
      server.middlewares.use(LOCAL_MEDIA_PREFIX, (req, res, next) => {
        const file = path.join(dir, decodeURIComponent((req.url ?? '').split('?')[0]));
        if (!file.startsWith(dir) || !fs.existsSync(file)) return next();
        res.setHeader('Content-Type', 'image/webp');
        fs.createReadStream(file).pipe(res);
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
