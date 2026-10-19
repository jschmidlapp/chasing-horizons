// Shared between the media scripts and the site (src/lib/media.ts). Changing these requires
// re-running `npm run media:process` and `npm run media:upload`.
export const WIDTHS = [480, 960, 1600, 2400];
export const MAX_EDGE = 2400; // longest side of the largest variant
export const QUALITY = 72;

/** "trips/x/abc.jpg", 960 -> "trips/x/abc-960.webp" */
export const variantKey = (key, width) => key.replace(/\.[^.]+$/, '') + `-${width}.webp`;
