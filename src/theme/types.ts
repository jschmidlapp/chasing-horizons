// The view contract: props each theme's views/ must accept. Pages in src/pages compute these and
// render `@theme/views/<Name>.astro`. A new theme implements the same views (see docs/theming.md).
import type { CollectionEntry } from 'astro:content';
import type { Activity, Entry, Region, Spot, Trip } from '../lib/content';
import type { Track } from '../lib/gpx';

export interface RegionWithCount {
  region: Region;
  /** Trips and spots in this region and its sub-regions. */
  trips: number;
  spots: number;
}

/** region id -> title, for labelling cards. */
export type RegionTitles = Record<string, string>;

export interface EntryGroup<T extends Entry> {
  /** Area name; undefined = no area. */
  heading?: string;
  entries: T[];
}

export interface HomeViewProps {
  page: CollectionEntry<'pages'>;
  regions: RegionWithCount[];
  featuredTrips: Trip[];
  featuredSpots: Spot[];
  regionTitles: RegionTitles;
}

export interface PlacesViewProps {
  page: CollectionEntry<'pages'>;
  regions: RegionWithCount[];
}

/** Rendered region intro (Markdown body) is passed as the default slot. */
export interface RegionViewProps {
  region: Region;
  ancestors: Region[];
  subRegions: RegionWithCount[];
  /** This region's own trips and spots (not sub-regions'), grouped by area. */
  tripGroups: EntryGroup<Trip>[];
  spotGroups: EntryGroup<Spot>[];
  description?: string;
  regionTitles: RegionTitles;
}

/** Rendered entry body (Markdown) is passed as the default slot. Used for both trips and spots. */
export interface EntryViewProps {
  entry: Entry;
  /** Top-level region down to the entry's own region. */
  regionChain: Region[];
  track?: Track;
  /** Trip → spots it visited; spot → trips that visited it. */
  linked: Entry[];
  /** More of the same kind from the same region. */
  related: Entry[];
  description?: string;
}

/** All trips or all spots, with client-side activity filter (?activity=hike). */
export interface EntryListViewProps {
  title: string;
  subtitle?: string;
  image?: string;
  entries: Entry[];
  activities: Activity[];
  regionTitles: RegionTitles;
}

export interface GearViewProps {
  page: CollectionEntry<'pages'>;
  items: CollectionEntry<'gear'>[];
}

export interface NotFoundViewProps {
  title: string;
  message: string;
}
