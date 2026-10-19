// Theme-independent data access. Pages and themes should get content through these helpers
// rather than calling getCollection directly, so sorting/filtering/URL rules live in one place.
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { ACTIVITIES } from '../content.config';

export type Trip = CollectionEntry<'trips'>;
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

export const tripUrl = (t: Trip) => url(`/trips/${t.id}/`);
export const regionUrl = (r: Region) => url(`/places/${r.id}/`);
export const activityUrl = (a: Activity) => url(`/activities/${a}/`);

/** Newest first; undated trips after dated ones, in their original site order. */
function compareTrips(a: Trip, b: Trip) {
  const da = a.data.date?.getTime(), db = b.data.date?.getTime();
  if (da !== undefined && db !== undefined) return db - da;
  if (da !== undefined) return -1;
  if (db !== undefined) return 1;
  return (a.data.legacy?.order ?? 1e9) - (b.data.legacy?.order ?? 1e9);
}

export async function getTrips(): Promise<Trip[]> {
  const trips = await getCollection('trips', (t) => import.meta.env.DEV || !t.data.draft);
  return trips.sort(compareTrips);
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

export const tripsInRegion = (trips: Trip[], regions: Region[], region: Region) => {
  const ids = regionAndDescendants(regions, region);
  return trips.filter((t) => ids.has(t.data.region.id));
};

/** Card/meta-description text: frontmatter summary, else first prose paragraph of the body. */
export function excerpt(entry: Trip | Region, max = 160): string | undefined {
  if (entry.data.summary) return entry.data.summary;
  const para = (entry.body ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith('#') && !p.startsWith('!['))
    // Skip short caption-like lines ("Lake of Glass") in favour of a real sentence.
    .find((p, _, all) => p.length >= 40 || all.every((q) => q.length < 40));
  if (!para) return undefined;
  const text = para.replace(/\\([\\*_[\]<>#])/g, '$1').replace(/\s+/g, ' ');
  return text.length <= max ? text : text.slice(0, text.lastIndexOf(' ', max)) + '…';
}

export async function getPage(id: 'home' | 'places' | 'gear') {
  const page = await getEntry('pages', id);
  if (!page) throw new Error(`Missing src/content/pages/${id}.md`);
  return page;
}

export function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export const regionTitles = (regions: Region[]) => Object.fromEntries(regions.map((r) => [r.id, r.data.title]));

export const withCounts = (list: Region[], regions: Region[], trips: Trip[]) =>
  list.map((region) => ({ region, count: tripsInRegion(trips, regions, region).length }));
