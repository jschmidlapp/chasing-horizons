// The view contract: props each theme's views/ must accept. Pages in src/pages compute these and
// render `@theme/views/<Name>.astro`. A new theme implements the same views (see docs/theming.md).
import type { CollectionEntry } from 'astro:content';
import type { Activity, Region, Trip } from '../lib/content';
import type { Track } from '../lib/gpx';

export interface RegionWithCount {
  region: Region;
  /** Trips in this region and its sub-regions. */
  count: number;
}

/** region id -> title, for labelling trip cards. */
export type RegionTitles = Record<string, string>;

export interface HomeViewProps {
  page: CollectionEntry<'pages'>;
  regions: RegionWithCount[];
  featuredTrips: Trip[];
  activityCounts: Record<Activity, number>;
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
  /** Trips grouped by `area`; heading undefined = no area. */
  tripGroups: { heading?: string; trips: Trip[] }[];
  description?: string;
  regionTitles: RegionTitles;
}

/** Rendered trip body (Markdown) is passed as the default slot. */
export interface TripViewProps {
  trip: Trip;
  /** Top-level region down to the trip's own region. */
  regionChain: Region[];
  track?: Track;
  related: Trip[];
  description?: string;
}

export interface TripListViewProps {
  title: string;
  subtitle?: string;
  image?: string;
  trips: Trip[];
  regionTitles: RegionTitles;
}

export interface GearViewProps {
  page: CollectionEntry<'pages'>;
  items: CollectionEntry<'gear'>[];
}
