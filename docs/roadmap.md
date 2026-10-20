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
- 🔜 Assign zones for Rodeo Pond and Manzanita Point Road
- 🔜 Content review pass (see [migration.md](migration.md) → "Needs human review")

## Phase 2: polish

- 💡 Backfill dates, stats and GPX tracks (Strava/Garmin export). Date-sorted "latest trips" on home
- 💡 Custom domain on Cloudflare: site + `img.` subdomain (see [deployment.md](deployment.md))
- 💡 Overview map of all trips (needs a lat/lon per trip, e.g. a `location` field or the GPX start)
- 💡 Search (Pagefind works well with static Astro sites)
- 💡 RSS feed, sitemap (`@astrojs/sitemap`)
- 💡 Tags and difficulty filters

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
