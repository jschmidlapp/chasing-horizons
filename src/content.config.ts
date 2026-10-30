// Content model — the contract between content (src/content), themes (src/theme), and a future
// CMS (TinaCMS). Field docs: docs/content-model.md. Keep this theme-agnostic.
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** An image reference: "/media/<key>" (see docs/media.md) or an absolute URL. */
const image = z.string();

export const ACTIVITIES = ['hike', 'mtb', 'gravel', 'road', 'scenic'] as const;

const regions = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/regions' }),
  schema: z.object({
    title: z.string(),
    parent: reference('regions').optional(),
    order: z.number().default(100),
    /** One or two sentences (≤160 chars) for cards, lists, and search/link previews. Blank = none. */
    description: z.string().nullish(),
    cover: image.optional(),
    banner: image.optional(),
    legacy: z.object({ page: z.string() }).optional(),
  }),
});

/** Fields shared by trips and spots (anything you can write up with photos, stats and a map). */
const entryFields = {
  title: z.string(),
  region: reference('regions'),
  /** Sub-area within the region, e.g. "Fort Collins" in Colorado. */
  area: z.string().optional(),
  activities: z.array(z.enum(ACTIVITIES)).min(1),
  /** One or two sentences (≤160 chars) for cards, lists, and search/link previews. Blank = none. */
  description: z.string().nullish(),
  cover: image.optional(),
  banner: image.optional(),
  stats: z
    .object({
      distanceMiles: z.number().optional(),
      elevationGainFeet: z.number().optional(),
      duration: z.string().optional(),
      difficulty: z.enum(['easy', 'moderate', 'hard', 'extreme']).optional(),
    })
    .optional(),
  /** GPX file name, relative to the entry folder (e.g. "track.gpx"). */
  gpx: z.string().optional(),
  /** Multi-day route map (GeoJSON) file name, relative to the entry folder (e.g. "route.geojson"). */
  map: z.string().optional(),
  links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  legacy: z.object({ page: z.string(), order: z.number() }).optional(),
};

/** One folder per entry: src/content/<collection>/<slug>/index.md (+ optional track.gpx). Id = <slug>. */
const folderLoader = (collection: string) =>
  glob({ pattern: '*/index.md', base: `./src/content/${collection}`, generateId: ({ entry }) => entry.split('/')[0] });

/** Trips: something that happened once (a hike, ride, or outing), usually on a trip away. */
const trips = defineCollection({
  loader: folderLoader('trips'),
  schema: z.object({
    ...entryFields,
    date: z.coerce.date().optional(),
    /** Last day, for multi-day trips. */
    endDate: z.coerce.date().optional(),
    /** Spots visited on this trip (shown on both pages). */
    spots: z.array(reference('spots')).default([]),
  }),
});

/** Spots: parks and trails visited regularly. Evergreen pages, updated over time. */
const spots = defineCollection({
  loader: folderLoader('spots'),
  schema: z.object({
    ...entryFields,
    lastVisited: z.coerce.date().optional(),
  }),
});

const gear = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/gear' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    image: image.optional(),
    order: z.number().default(100),
    retired: z.boolean().default(false),
  }),
});

/** Singleton pages (home, places, gear, snacks) — hero images, taglines, optional body text. */
const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string().optional(),
    hero: image.optional(),
    /** Captioned photos shown as a wall (the snacks page). */
    photos: z.array(z.object({ image, caption: z.string().optional() })).default([]),
  }),
});

export const collections = { regions, trips, spots, gear, pages };
