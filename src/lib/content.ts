// Theme-independent data access. Pages and themes should get content through these helpers
// rather than calling getCollection directly, so sorting/filtering/URL rules live in one place.
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { ACTIVITIES } from '../content.config';

export type Trip = CollectionEntry<'trips'>;
export type Spot = CollectionEntry<'spots'>;
/** Anything with a write-up page: a trip (happened once) or a spot (visited regularly). */
export type Entry = Trip | Spot;
export type Region = CollectionEntry<'regions'>;
export type Activity = (typeof ACTIVITIES)[number];

export const ACTIVITY_LABELS: Record<Activity, string> = {
  hike: 'Hiking',
  mtb: 'Mountain Biking',
  gravel: 'Gravel',
  road: 'Road Cycling',
  scenic: 'Sightseeing',
};

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
/** Prefix an internal path with the deploy base path. */
export const url = (p: string) => `${base}${p.startsWith('/') ? p : `/${p}`}`;

export const isTrip = (e: Entry): e is Trip => e.collection === 'trips';
export const entryUrl = (e: Entry) => url(`/${e.collection}/${e.id}/`);
export const regionUrl = (r: Region) => url(`/places/${r.id}/`);
/** List page for a collection, optionally pre-filtered to an activity. */
export const listUrl = (collection: Entry['collection'], activity?: Activity) =>
  url(`/${collection}/`) + (activity ? `?activity=${activity}` : '');

const legacyOrder = (e: Entry) => e.data.legacy?.order ?? 1e9;

/** Newest first; undated trips after dated ones, in their original site order. */
function compareTrips(a: Trip, b: Trip) {
  const da = a.data.date?.getTime(), db = b.data.date?.getTime();
  if (da !== undefined && db !== undefined) return db - da;
  if (da !== undefined) return -1;
  if (db !== undefined) return 1;
  return legacyOrder(a) - legacyOrder(b);
}

/** Most recently visited first; never-dated spots after, in their original site order. */
function compareSpots(a: Spot, b: Spot) {
  const da = a.data.lastVisited?.getTime(), db = b.data.lastVisited?.getTime();
  if (da !== undefined && db !== undefined) return db - da;
  if (da !== undefined) return -1;
  if (db !== undefined) return 1;
  return legacyOrder(a) - legacyOrder(b);
}

const published = (e: Entry) => import.meta.env.DEV || !e.data.draft;

export async function getTrips(): Promise<Trip[]> {
  return (await getCollection('trips', published)).sort(compareTrips);
}

export async function getSpots(): Promise<Spot[]> {
  return (await getCollection('spots', published)).sort(compareSpots);
}

export async function getRegions(): Promise<Region[]> {
  return (await getCollection('regions')).sort((a, b) => a.data.order - b.data.order);
}

export const topLevelRegions = (regions: Region[]) => regions.filter((r) => !r.data.parent);
export const childRegions = (regions: Region[], parent: Region) =>
  regions.filter((r) => r.data.parent?.id === parent.id);

/** A region and all of its descendants' ids. */
export function regionAndDescendants(regions: Region[], root: Region): Set<string> {
  const ids = new Set([root.id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const r of regions) if (r.data.parent && ids.has(r.data.parent.id) && !ids.has(r.id)) { ids.add(r.id); grew = true; }
  }
  return ids;
}

/** Ancestors from top-level down to (not including) the region. */
export function regionAncestors(regions: Region[], region: Region): Region[] {
  const chain: Region[] = [];
  let cur = region.data.parent && regions.find((r) => r.id === region.data.parent!.id);
  while (cur) {
    chain.unshift(cur);
    cur = cur.data.parent && regions.find((r) => r.id === cur!.data.parent!.id);
  }
  return chain;
}

/** Entries in a region or any of its sub-regions. */
export function inRegion<T extends Entry>(entries: T[], regions: Region[], region: Region): T[] {
  const ids = regionAndDescendants(regions, region);
  return entries.filter((e) => ids.has(e.data.region.id));
}

/** Group entries by `area`, keeping first-seen order; entries without an area first. */
export function groupByArea<T extends Entry>(entries: T[]): { heading?: string; entries: T[] }[] {
  const groups = new Map<string | undefined, T[]>();
  for (const e of entries) groups.set(e.data.area, [...(groups.get(e.data.area) ?? []), e]);
  return [...groups].map(([heading, entries]) => ({ heading, entries }))
    .sort((a, b) => Number(a.heading !== undefined) - Number(b.heading !== undefined));
}

/** Max length of the auto-generated fallback (explicit descriptions are used as written). */
const FALLBACK_MAX = 160;

/**
 * Card/meta-description text: the frontmatter `description`, else the first full sentence of the
 * body's first prose paragraph (cut at a word boundary only if that sentence is very long).
 * A blank `description:` (or `""`) means "none on purpose": no blurb and no fallback.
 */
export function excerpt(entry: Entry | Region): string | undefined {
  const { description } = entry.data;
  if (description !== undefined) return description?.trim() || undefined;
  const para = (entry.body ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith('#') && !p.startsWith('!['))
    // Skip short caption-like lines ("Lake of Glass") in favour of a real sentence.
    .find((p, _, all) => p.length >= 40 || all.every((q) => q.length < 40));
  if (!para) return undefined;
  const text = para.replace(/\\([\\*_[\]<>#])/g, '$1').replace(/\s+/g, ' ');
  const sentence = text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text;
  if (sentence.length <= FALLBACK_MAX) return sentence;
  return sentence.slice(0, sentence.lastIndexOf(' ', FALLBACK_MAX)) + '…';
}

export async function getPage(id: 'home' | 'places' | 'gear') {
  const page = await getEntry('pages', id);
  if (!page) throw new Error(`Missing src/content/pages/${id}.md`);
  return page;
}

export function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/** "June 3–5, 2025" style range (or a single date). */
export function formatDateRange(start: Date, end?: Date) {
  if (!end || end.getTime() === start.getTime()) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export const regionTitles = (regions: Region[]) => Object.fromEntries(regions.map((r) => [r.id, r.data.title]));

export const withCounts = (list: Region[], regions: Region[], trips: Trip[], spots: Spot[]) =>
  list.map((region) => ({
    region,
    trips: inRegion(trips, regions, region).length,
    spots: inRegion(spots, regions, region).length,
  }));

/** Activities that appear in a list, in canonical order. */
export const activitiesIn = (entries: Entry[]) =>
  ACTIVITIES.filter((a) => entries.some((e) => e.data.activities.includes(a)));
