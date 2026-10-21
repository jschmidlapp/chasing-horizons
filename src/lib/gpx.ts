// Build-time GPX -> GeoJSON + summary stats. The client-side map only receives the (simplified) line.
import fs from 'node:fs';
import path from 'node:path';
import { gpx as gpxToGeoJson } from '@tmcw/togeojson';
import { DOMParser } from '@xmldom/xmldom';
import type { Entry } from './content';

export interface Track {
  /** [lat, lon] pairs per track segment, downsampled. */
  lines: [number, number][][];
  distanceMiles: number;
  elevationGainFeet?: number;
}

const toRad = (d: number) => (d * Math.PI) / 180;
function haversineMiles([lon1, lat1]: number[], [lon2, lat2]: number[]) {
  const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1) / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(a));
}

export function loadTrack(entry: Entry): Track | undefined {
  if (!entry.data.gpx) return undefined;
  const file = path.resolve('src/content', entry.collection, entry.id, entry.data.gpx);
  const doc = new DOMParser().parseFromString(fs.readFileSync(file, 'utf8'), 'text/xml');
  const geo = gpxToGeoJson(doc as unknown as Document);
  const segments: number[][][] = [];
  for (const f of geo.features) {
    const g = f.geometry;
    if (g?.type === 'LineString') segments.push(g.coordinates);
    else if (g?.type === 'MultiLineString') segments.push(...g.coordinates);
  }
  let distance = 0, gain = 0, hasEle = false;
  for (const seg of segments) {
    for (let i = 1; i < seg.length; i++) {
      distance += haversineMiles(seg[i - 1], seg[i]);
      if (seg[i][2] !== undefined && seg[i - 1][2] !== undefined) {
        hasEle = true;
        const d = seg[i][2] - seg[i - 1][2];
        if (d > 0) gain += d;
      }
    }
  }
  const step = (n: number) => Math.max(1, Math.floor(n / 800));
  const lines = segments.map((seg) =>
    seg.filter((_, i) => i % step(seg.length) === 0 || i === seg.length - 1).map(([lon, lat]) => [lat, lon] as [number, number]));
  return {
    lines,
    distanceMiles: Math.round(distance * 10) / 10,
    elevationGainFeet: hasEle ? Math.round(gain * 3.28084) : undefined,
  };
}
