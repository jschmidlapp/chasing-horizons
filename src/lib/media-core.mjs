// Theme-independent image helpers, shared by the rehype plugin (Markdown bodies) and components.
//
// Content refers to images as "/media/<key>" (e.g. /media/trips/sky-pond/abc.jpg). At render time
// those become responsive <img srcset> URLs on the media host (R2), using src/data/media.json for
// dimensions and available widths. See docs/media.md.

import manifest from '../data/media.json' with { type: 'json' };
import siteConfig from '../../site.config.mjs';
import { variantKey } from '../../scripts/media/widths.mjs';

export const LOCAL_MEDIA_PREFIX = '/_media';
const base = (siteConfig.mediaBaseUrl || LOCAL_MEDIA_PREFIX).replace(/\/$/, '');

/** "/media/trips/x/a.jpg" -> "trips/x/a.jpg" (or null if not a media ref). */
export function mediaKey(src) {
  if (typeof src !== 'string') return null;
  const m = src.match(/^\/?media\/(.+)$/);
  return m ? m[1] : null;
}

/**
 * Attributes for an <img> showing a media ref. `sizes` is the CSS-width hint for the browser.
 * Unknown refs (not in the manifest) are passed through untouched so external URLs still work.
 */
export function imageAttrs(src, { sizes = '100vw', maxWidth } = {}) {
  const key = mediaKey(src);
  const info = key && manifest[key];
  if (!info) return { src };
  const widths = maxWidth ? info.widths.filter((w, i) => w <= maxWidth || i === 0) : info.widths;
  const url = (w) => `${base}/${variantKey(key, w)}`;
  const fallback = widths.find((w) => w >= 960) ?? widths.at(-1);
  return {
    src: url(fallback),
    srcset: widths.map((w) => `${url(w)} ${w}w`).join(', '),
    sizes,
    width: info.w,
    height: info.h,
    // Full-size image for the lightbox.
    'data-full': url(info.widths.at(-1)),
  };
}

/** Single URL at roughly `width` px — for og:image, CSS backgrounds, etc. */
export function imageUrl(src, width = 1600) {
  const key = mediaKey(src);
  const info = key && manifest[key];
  if (!info) return src;
  const w = info.widths.find((x) => x >= width) ?? info.widths.at(-1);
  return `${base}/${variantKey(key, w)}`;
}

export function aspect(src) {
  const info = manifest[mediaKey(src)];
  return info ? info.w / info.h : 1.5;
}
