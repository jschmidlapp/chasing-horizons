# Roadmap

Status key: ✅ done · 🔜 next · 💡 idea

## Phase 1: basic site (current)

- ✅ Astro 7 project, content collections, starter theme
- ✅ Google Sites import (68 trips, 15 regions, gear)
- ✅ Image pipeline (WebP variants, manifest, local dev serving)
- ✅ GPX route maps and stats, external links, activities pages
- ✅ GitHub Actions → GitHub Pages workflow
- ✅ R2 bucket `chasing-horizons-media` (r2.dev public URL), media uploaded, `MEDIA_BASE_URL` set
- ✅ GitHub Pages enabled (source: GitHub Actions)
- ✅ Henry Coe split into park zones; 17-Mile Drive fixed
- ✅ Trips vs. spots split; Henry Coe zones merged into 6 spots (see [decisions.md](decisions.md))
- 🔜 Write real descriptions for the Henry Coe zones (summaries are placeholder trail lists)
- 🔜 Content review pass (see [migration.md](migration.md) → "Needs human review")

## Phase 2: polish

- 💡 Backfill dates, stats and GPX tracks (Strava/Garmin export). Date-sorted "latest trips" on home
- 💡 Custom domain on Cloudflare: site + `img.` subdomain (see [deployment.md](deployment.md))
- 💡 Overview map of all trips (needs a lat/lon per trip, e.g. a `location` field or the GPX start)
- 💡 Search (Pagefind works well with static Astro sites)
- 💡 RSS feed, sitemap (`@astrojs/sitemap`)
- 💡 Tags and difficulty filters

### Visit log for spots (planned)

Requested by the owner (2026-10-20): a quick way to record "rode Calero today, here are 6 photos"
without creating a trip or rewriting the spot page.

Sketch:
- New collection `visits`: `src/content/visits/<yyyy-mm-dd>-<spot>/index.md` with `spot` (reference),
  `date`, `activities` (optional, defaults to the spot's), optional `gpx`, `stats`, and a short body
  of notes and photos.
- Spot page: a dated timeline of its visits under the main write-up. `lastVisited` is derived from the
  newest visit, so it no longer needs maintaining by hand.
- Home page: a "Recent outings" strip mixing new trips and visits, so the site shows activity.
- Optional: a trip can include visits (e.g. day 2 of a trip = a visit to a spot).
- Tooling: `npm run new:visit -- calero-county-park ~/photos/*.jpg` to scaffold the folder, add the
  photos via `media:add`, and print the file to edit. Later, TinaCMS makes this a form.
- Theme contract: add `visits` to `EntryViewProps` (spots) and a `VisitCard` / timeline component.

### Activity stats import (planned)

The owner records nearly all hikes and rides on **Garmin** (they also show up in Trailforks). Findings as of 2026-10:
- **Trailforks API**: approval-only, generally not granted to individuals, and focused on trail data,
  not personal ride logs. Not viable.
- **Garmin Connect Developer Program**: for approved businesses only, and new applications were paused
  in 2026. Not viable.
- **Garmin Connect manual export** (per-activity GPX/FIT, or a bulk account export): works. **Start here.**
- **Strava API** (if Garmin → Strava sync is active): personal apps are allowed. This is the path to
  automatic sync, e.g. a scheduled GitHub Action that opens a PR with new visits. Check that the sync
  still works given the 2026 Garmin–Strava dispute.
- Unofficial Garmin Connect client libraries: possible fallback; may break when Garmin changes its login.

Plan:
1. `npm run gpx:add -- <trips|spots|visits>/<slug> activity.gpx|.fit`: copy the track into the entry
   folder, set `gpx`, and fill `date`/`lastVisited` and `stats.duration` from the timestamps (distance
   and gain are already computed at build time). FIT needs a parser (e.g. `fit-file-parser`).
2. Backfill: match a bulk Garmin export to existing entries by start location and date range.
3. Optional: Strava sync feeding the visit log.

## Phase 3: paid theme

- 💡 Pick a theme. Port it per [theming.md](theming.md) (new `src/theme/<name>/` implementing the views)

## Phase 4: CMS (TinaCMS)

Notes for when we get here:
- Tina reads and writes the same Markdown files. Its schema (`tina/config.ts`) must mirror
  `src/content.config.ts`: collections `trips` (path `src/content/trips`, format `md`, folder-per-entry),
  `regions`, `gear`, `pages`. `region`/`parent` become Tina `reference` fields.
- The body needs a rich-text field that preserves our `![](/media/…)` image lines and blank-line
  grouping (galleries). Verify Tina's Markdown serializer round-trips this. If not, introduce an explicit
  `<Gallery>` MDX component and migrate the bodies (a scriptable change).
- Media: build a custom Tina media store that uploads to R2 `originals/`. Variants then need generating
  at upload time (Cloudflare Worker with Images) or in CI (run `media:process && media:upload` in a
  workflow). Alternatively, switch to Cloudflare Image Transformations so variants aren't pre-generated.
- Hosting: TinaCloud (free tier) for auth plus the git backend, or self-hosted Tina with a backend
  (would need a server, so not GitHub Pages).
