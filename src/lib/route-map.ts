// Build-time multi-day route map from a GeoJSON file in the entry folder (frontmatter `map`).
// Format: docs/content-model.md#route-maps. The client-side map receives this RouteMap as-is.
import fs from 'node:fs';
import path from 'node:path';
import type { Entry } from './content';

type LatLng = [number, number];

export interface RouteDay {
  id: string;
  label: string;
  miles?: number;
}

export interface RouteMap {
  days: RouteDay[];
  /** `drive` = the main route, `ride` = a bike ride along the way. */
  lines: { day: string; kind: 'drive' | 'ride'; points: LatLng[] }[];
  stops: { day: string; name: string; note?: string; at: LatLng }[];
}

interface Feature {
  properties?: { day?: string; kind?: string; name?: string; note?: string };
  geometry?: { type: string; coordinates: number[] | number[][] | number[][][] };
}

const latLng = ([lon, lat]: number[]): LatLng => [lat, lon];

export function loadRouteMap(entry: Entry): RouteMap | undefined {
  if (!entry.data.map) return undefined;
  const file = path.resolve('src/content', entry.collection, entry.id, entry.data.map);
  const geo = JSON.parse(fs.readFileSync(file, 'utf8')) as { days?: RouteDay[]; features?: Feature[] };
  const days = geo.days ?? [];
  const known = new Set(days.map((d) => d.id));
  const map: RouteMap = { days, lines: [], stops: [] };

  for (const f of geo.features ?? []) {
    const { day = '', kind, name, note } = f.properties ?? {};
    if (!known.has(day)) throw new Error(`${file}: feature has day "${day}", which isn't listed in "days"`);
    const g = f.geometry;
    if (g?.type === 'Point') {
      map.stops.push({ day, name: name ?? '', note, at: latLng(g.coordinates as number[]) });
    } else if (g?.type === 'LineString' || g?.type === 'MultiLineString') {
      const parts = (g.type === 'LineString' ? [g.coordinates] : g.coordinates) as number[][][];
      for (const part of parts) map.lines.push({ day, kind: kind === 'ride' ? 'ride' : 'drive', points: part.map(latLng) });
    }
  }
  return map;
}
