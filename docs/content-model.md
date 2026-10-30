# Content model

Defined in `src/content.config.ts`. Everything is Markdown with YAML frontmatter, which suits git
diffs, theme swaps, and TinaCMS. Images are referenced as `/media/<key>` (see [media.md](media.md)).

## Trips vs. spots

There are two kinds of write-up. Both live in Places (regions) and share most fields:

| | **Trips**: `src/content/trips/<slug>/index.md` | **Spots**: `src/content/spots/<slug>/index.md` |
| --- | --- | --- |
| What | Something that happened once: a hike, ride, or outing, usually on a trip away | A park or trail visited regularly. An evergreen page, updated over time |
| Examples | Hike to Sky Pond, Horsetooth Mountain, Arches | Calero County Park, Spike Jones Trail, Wilder Ranch |
| URL | `/trips/<slug>/` | `/spots/<slug>/` |
| Own fields | `date`, `endDate`, `spots` (links to spots visited) | `lastVisited` |
| Sorting | newest `date` first | most recent `lastVisited` first |

Rule of thumb: if you'd go back and add to it, it's a spot. Size a spot as "where I'd say I'm going today":
a park, or a zone of a big park (Henry Coe has one spot per zone, with its trails as sections), not a single connector trail. To reclassify, `git mv` the folder between
`trips/` and `spots/` and adjust the type-specific fields. Photo keys don't need to change (see
[media.md](media.md)). The URL does change, so if the page has been shared, add a redirect in
`src/data/redirects.json` (`"/trips/<slug>/": "/spots/<slug>/"`, paths without the base).

A trip can list `spots: ["calero-county-park"]`. The trip page then shows "Spots on this trip" and the
spot page shows "Trips that came here".

Each folder name is the URL slug. Supporting files, such as the GPX track, live in the same folder.

### Shared fields

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | required |
| `region` | region id | required, e.g. `henry-coe-sp` (file name in `regions/`) |
| `area` | string | optional sub-area for grouping on the region page, e.g. "Fort Collins" |
| `activities` | list | one or more of `hike`, `mtb`, `gravel`, `road`, `scenic`. Drives the list-page filters |
| `description` | string | one or two sentences, ideally ≤160 chars, for cards, lists, and search/link previews. If omitted, the first full sentence of the body is used. Leave it blank (`description:`) for no blurb at all |
| `cover` | image | card image. If omitted, the first image in the body |
| `banner` | image | wide hero image. Falls back to `cover` |
| `stats.distanceMiles` | number | overrides the value computed from GPX |
| `stats.elevationGainFeet` | number | overrides the value computed from GPX |
| `stats.duration` | string | free text, e.g. "4h 30m" |
| `stats.difficulty` | enum | `easy`, `moderate`, `hard`, `extreme` |
| `gpx` | string | file name in the entry folder, e.g. `track.gpx`. Shows a map and fills distance and gain. For a spot, use your usual route |
| `map` | string | GeoJSON file name in the entry folder, e.g. `route.geojson`, for a multi-day route map (see [Route maps](#route-maps)). Shown instead of the GPX map when both are set; GPX still fills the stats |
| `links` | list | `[{ label: "Strava", url: "https://…" }]` |
| `tags` | list | free-form. Not shown yet; reserved for future filtering |
| `draft` | bool | hidden from production builds (still visible in `npm run dev`) |
| `legacy` | object | `{ page, order }` from the Google Sites import. Keeps the original ordering for undated entries |

### Descriptions

Write `description` by hand. It's the blurb people see on cards and in search results. Drafts written
by Claude carry a YAML comment, `description: "…" # draft`. Edit the text if needed, then delete the
`# draft` comment. `npm run content:check` lists entries that have no description, a description over
160 characters, or a draft still awaiting review. It never fails the build. Entries that don't need a
blurb (e.g. a photo-only trip) can say so with a blank `description:`. The check skips them, and cards and
link previews show no text (previews use the site description).

### Trip-only fields

| Field | Type | Notes |
| --- | --- | --- |
| `date` | date | `2025-06-14`. Undated trips sort after dated ones, in old-site order |
| `endDate` | date | for multi-day trips. Shown as a range |
| `spots` | list of spot ids | spots visited on this trip |

### Spot-only fields

| Field | Type | Notes |
| --- | --- | --- |
| `lastVisited` | date | shown on cards and the page. Sorts spots |

Body conventions:
- `## Heading` for sections (e.g. each lake on a long hike, or each trail in a park zone). With 3 or more
  sections, the page shows a jump list at the top, and each section can be linked as `…/#heading-slug`.
- Consecutive image lines with no blank line between them form one gallery row (2–3 per row looks best).
- An image on its own line, separated by blank lines, shows as a single photo.

```markdown
---
title: "Hike to Sky Pond"
region: "rocky-mountain-np"
activities: ["hike"]
date: 2024-07-09
gpx: "track.gpx"
stats:
  difficulty: hard
links:
  - label: "AllTrails"
    url: "https://www.alltrails.com/..."
---
Intro paragraph.

## The Loch

![The Loch](/media/trips/hike-to-sky-pond/c348bfce0d.jpg)
![The Loch](/media/trips/hike-to-sky-pond/be5e78ac74.jpg)
```

### Route maps

For road trips, `map: "route.geojson"` draws a map with one colour per day and a legend that toggles days
on and off. The file is a GeoJSON `FeatureCollection` with an extra top-level `days` list:

```json
{
  "type": "FeatureCollection",
  "days": [{ "id": "day1", "label": "Day 1: San Jose to Gualala", "miles": 177 }],
  "features": [
    { "type": "Feature", "properties": { "day": "day1", "kind": "drive" }, "geometry": { "type": "LineString", "coordinates": [[-121.85, 37.34], "…"] } },
    { "type": "Feature", "properties": { "day": "day1", "kind": "ride" }, "geometry": { "type": "LineString", "coordinates": ["…"] } },
    { "type": "Feature", "properties": { "day": "day1", "kind": "stop", "name": "Gualala", "note": "Overnight" }, "geometry": { "type": "Point", "coordinates": [-123.53, 38.77] } }
  ]
}
```

- `days` sets the legend order and labels. `miles` is optional and shown as written (it isn't computed).
- Each feature's `day` must match a day `id`, or the build fails.
- Lines: `kind` is `drive` (solid) or `ride` (dashed, for bike rides). `LineString` or `MultiLineString`.
- Points are stops. `name` and the optional `note` show as a tooltip.
- Keep lines simplified (a few hundred points in total). The whole file goes into the page.

## Regions: `src/content/regions/<slug>.md`

Places that group trips and spots (parks, areas, states). They can nest via `parent` (e.g. Los Gatos → South Bay).
The region page lists its sub-regions, then its own trips and spots (each grouped by `area`). Counts on region cards include sub-regions.

| Field | Notes |
| --- | --- |
| `title` | required |
| `parent` | optional region id |
| `order` | sort order on the Places page (lower first) |
| `description`, `cover`, `banner` | as for trips |

The body (optional) is the intro text shown on the region page (e.g. the Henry Coe overview).

## Gear: `src/content/gear/<slug>.md`

`title`, `description`, `image`, `order`, `retired` (hides it). Currently body-less.

## Pages: `src/content/pages/{home,places,gear,snacks}.md`

Singleton settings for those pages: `title`, `tagline`, `hero`. The home page's "More" cards for gear and
snacks use those pages' own `title`, `tagline` and `hero` (falling back to the first photo).

`snacks.md` also has `photos`: favourite places to stop for a snack mid-hike or mid-ride, shown as a
photo wall in list order. Each has an `image` and an optional one-line `caption`. There are no detail pages.

```yaml
photos:
  - image: "/media/pages/snacks/<key>.jpg"
    caption: "Eagles Point overlooking the Rockies"
```

## Changing the schema

1. Edit `src/content.config.ts` and update this doc.
2. Theme and pages read fields through `src/lib/content.ts` where practical. Put derived logic there.
3. When TinaCMS is added, mirror the change in its schema (see [roadmap.md](roadmap.md)).
