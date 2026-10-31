// Site-wide settings. Plain JS so astro.config.mjs, scripts, and pages can all import it.
// Environment variables (see .env.example) override the defaults here.

import dotenv from 'dotenv';

dotenv.config({ quiet: true });
const env = process.env;

export default {
  title: 'Chasing Horizons',
  description: '',

  // Where the site is served. Production sets SITE_URL=https://broadcastfrequency.net and BASE_PATH=/
  // through repo variables (see docs/deployment.md); these defaults are the old github.io project URL.
  siteUrl: env.SITE_URL || 'https://jschmidlapp.github.io',
  basePath: env.BASE_PATH || '/chasing-horizons',

  // Public base URL for images. Unset in local dev = served from .media/variants by the dev server.
  // Production: the R2 bucket's public URL (r2.dev for now, custom domain later). See docs/media.md.
  mediaBaseUrl: env.PUBLIC_MEDIA_BASE_URL || env.MEDIA_BASE_URL || '',
};
