# Content model

Defined in `src/content.config.ts`. Everything is Markdown with YAML frontmatter, which suits git
diffs, theme swaps, and TinaCMS. Images are referenced as `/media/<key>` (see [media.md](media.md)).

## Trips: `src/content/trips/<slug>/index.md`

One hike, ride, or place visit. The folder name is the URL slug (`/trips/<slug>/`). Supporting files,
such as the GPX track, live in the same folder.

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | required |
| `region` | region id | required, e.g. `henry-coe-sp` (file name in `regions/`) |
| `area` | string | optional sub-area for grouping on the region page, e.g. "Fort Collins" |
| `activities` | list | one or more of `hike`, `mtb`, `gravel`, `road`, `scenic` |
| `date` | date | `2025-06-14`. Sorts trips newest-first. Undated trips keep their old-site order |
| `summary` | string | card and meta description. If omitted, the first real paragraph of the body is used |
| `cover` | image | card image. If omitted, the first image in the body |
| `banner` | image | wide hero image. Falls back to `cover` |
| `stats.distanceMiles` | number | overrides the value computed from GPX |
| `stats.elevationGainFeet` | number | overrides the value computed from GPX |
| `stats.duration` | string | free text, e.g. "4h 30m" |
| `stats.difficulty` | enum | `easy`, `moderate`, `hard`, `extreme` |
| `gpx` | string | file name in the trip folder, e.g. `track.gpx`. Shows a map and fills distance and gain |
| `links` | list | `[{ label: "Strava", url: "https://…" }]` |
| `tags` | list | free-form. Not shown yet; reserved for future filtering |
| `draft` | bool | hidden from production builds (still visible in `npm run dev`) |
| `legacy` | object | `{ page, order }` from the Google Sites import. Keeps the original ordering |

Body conventions:
- `## Heading` for sections (e.g. each lake or trail segment on a long hike).
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

## Regions: `src/content/regions/<slug>.md`

Places that group trips (parks, areas, states). They can nest via `parent` (e.g. Los Gatos → South Bay).
Henry Coe uses this for park zones (`henry-coe-grizzly-gulch-zone`, …). The region page lists its sub-regions and its own trips (grouped by `area`). Trip counts include sub-regions.

| Field | Notes |
| --- | --- |
| `title` | required |
| `parent` | optional region id |
| `order` | sort order on the Places page (lower first) |
| `summary`, `cover`, `banner` | as for trips |

The body (optional) is the intro text shown on the region page (e.g. the Henry Coe overview).

## Gear: `src/content/gear/<slug>.md`

`title`, `description`, `image`, `order`, `retired` (hides it). Currently body-less.

## Pages: `src/content/pages/{home,places,gear}.md`

Singleton settings for those pages: `title`, `tagline`, `hero`, plus `placesCard` and `gearCard` on home.

## Changing the schema

1. Edit `src/content.config.ts` and update this doc.
2. Theme and pages read fields through `src/lib/content.ts` where practical. Put derived logic there.
3. When TinaCMS is added, mirror the change in its schema (see [roadmap.md](roadmap.md)).
