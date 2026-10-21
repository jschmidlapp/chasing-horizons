// Shared data loading for /trips/<slug>/ and /spots/<slug>/ (EntryView props, minus the body slot).
import { excerpt, getRegions, getSpots, getTrips, isTrip, regionAncestors, type Entry } from './content';
import { loadTrack } from './gpx';
import type { EntryViewProps } from '../theme/types';

export async function entryPageProps(entry: Entry): Promise<EntryViewProps> {
  const [regions, trips, spots] = await Promise.all([getRegions(), getTrips(), getSpots()]);
  const region = regions.find((r) => r.id === entry.data.region.id)!;

  // Trip → the spots it lists; spot → every trip that lists it.
  const linked: Entry[] = isTrip(entry)
    ? spots.filter((s) => entry.data.spots.some((ref) => ref.id === s.id))
    : trips.filter((t) => t.data.spots.some((ref) => ref.id === entry.id));

  // Up to 3 neighbours of the same kind in the same region, continuing in order after this one.
  const sameKind: Entry[] = isTrip(entry) ? trips : spots;
  const siblings = sameKind.filter((e) => e.data.region.id === region.id);
  const i = siblings.findIndex((e) => e.id === entry.id);
  const related = [...siblings.slice(i + 1), ...siblings.slice(0, i)].slice(0, 3);

  return {
    entry,
    regionChain: [...regionAncestors(regions, region), region],
    track: loadTrack(entry),
    linked,
    related,
    description: excerpt(entry),
  };
}
