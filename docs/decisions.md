# Decision log

Newest first. Add an entry whenever a choice would be non-obvious to someone picking up the project.

### 2026-10-29: `featured` flag for the home page

- Home page Trips and Places rows were purely automatic (longest write-ups until dates exist, then newest),
  so the owner couldn't choose what's shown. A boolean `featured` on trips and spots pins entries first;
  the automatic rule fills any remaining of the 6 slots. A boolean rather than a numeric rank keeps the
  frontmatter simple; featured entries keep the normal sort order among themselves.

### 2026-10-29: UI labels: Spots → Places, Places → Regions

- The owner never liked "Spots". In the UI, spots are now **Places** and the old Places (regions) page is
  **Regions**, which also matches the code's `regions` collection. Nav: Regions · Trips · Places · Gear.
- Label-only: URLs (`/spots/`, `/places/`), collection names, the `spots:` frontmatter field and code
  identifiers are unchanged. Moving spots to `/places/` would collide with the existing region URLs and
  need a pile of redirects; revisit if the names stick.

### 2026-10-29: Home page "More" cards; snacks page

- Removed the "All places" tile from the home page (Places is in the nav and already the first home section).
- The Gear tile used a Google Sites collage (white gutters baked in) as a short overlaid banner, which
  looked out of place. It's now a normal card in a "More" section using the gear page's own hero and
  tagline, so there is no separate `gearCard` image to maintain. `placesCard` and `gearCard` were dropped.
- New `/snacks/` page: favourite places to stop for a snack *during* a hike or ride (a bench, a viewpoint).
  It's only photos with one-line captions, so it's a `photos` list in `pages/snacks.md`, not a collection with
  one file per item, and there are no detail pages. Photos open in the shared lightbox (`<Img zoom>`).
  It's linked from the home page "More" section only, not the top nav (briefly in the nav, removed same day).

### 2026-10-28: One Mt Umunhum spot, in San Jose

- The two imported Mt Umunhum spots (Los Gatos and San Jose) were merged into `mt-umunhum`, region
  `san-jose`. The shorter slug was kept and `/spots/mt-umunhum-san-jose/` redirects to it. Photo keys under
  `trips/mt-umunhum-san-jose/` were left as they are (keys are opaque IDs).

### 2026-10-27: Blank description = none on purpose

- A blank `description:` (YAML null or `""`) is different from an omitted one. It means "no blurb": the
  first-sentence fallback is skipped and `content:check` doesn't report it. A `none: true` flag was
  avoided because the empty key already says this, and it's what people naturally type.

### 2026-10-24: Local-first media in dev

- The dev server always links images to itself and serves local files, falling back to an R2
  redirect. This means new photos can be previewed before upload, even with `PUBLIC_MEDIA_BASE_URL` set in `.env`.
  Unprocessed photos preview from their originals.
- The manifest is read from disk (mtime-cached) instead of a JSON import, so `media:process` output is
  picked up by a running dev server. Content-layer render caching still means an unchanged page keeps
  its old render until the page is edited or the server restarts. Accepted as minor.

### 2026-10-24: Explicit descriptions

- Renamed `summary` to `description`: it's the owner's word for it, and the name most Astro themes and
  TinaCMS templates expect.
- The fallback is now the first full sentence, not a 110-character cut. Card text is clamped to 3 lines in CSS.
- AI-drafted text is marked with a `# draft` YAML comment rather than a schema field, so it costs
  nothing to clear. Note that TinaCMS will drop YAML comments when it saves a file, so finish reviewing
  the drafts before adopting Tina, or switch to a `descriptionDraft: true` field then.
- `npm run content:check` reports content gaps without failing the build.

### 2026-10-23: Henry Coe zones are spots, not regions

- The 30 per-trail spots were too granular: you go to "the Grizzly Gulch side", not to one connector
  trail. Each zone is now one spot, with its trails as `##` sections. Henry Coe is a single region again.
- Trade-off: per-trail structured data (difficulty, GPX, last visited) now lives at zone level. If
  per-trail ratings are wanted later, add a small `trails: [{ name, difficulty, notes }]` list to the zone
  spot rather than splitting the pages again.
- Added an automatic section jump list (3 or more `##` headings) for long entries.

### 2026-10-20: Trips vs. spots

- The owner pointed out that the first model conflated **one-off outings** (Rocky Mountain NP hikes)
  with **regular local haunts** (Calero, Henry Coe). They're now two collections, `trips` and `spots`,
  sharing a base schema (`entryFields` in `content.config.ts`). The owner chose the name "Spots".
- **Two collections, not a `kind` flag**: each can have its own fields (`date`/`endDate` vs.
  `lastVisited`) and URL space, and they'll show as two clear content types in TinaCMS. The cost is
  that reclassifying means moving a folder (and a redirect, if the URL was shared).
- Places (regions) stay the geographic backbone and show both kinds in separate sections.
- Navigation: Places · Trips · Spots · Gear. The activity pages (`/activities/<a>/`) were replaced
  by client-side filters on the Trips and Spots lists (`?activity=hike`).
- Trips can reference spots (`spots: [...]`), shown in both directions.
- Deferred: a **visit log** (dated mini-entries attached to a spot). See [roadmap.md](roadmap.md).
- Media keys were not renamed for the moved entries: keys are opaque IDs, and renaming would mean
  re-uploading to R2 for no visible benefit.

### 2026-10-18: Initial architecture

- **Astro 7, static output, GitHub Pages.** The owner asked for Astro. Static output fits a photo journal
  and GitHub Pages is free. No custom domain yet, so the base path is `/chasing-horizons`.
- **Images on Cloudflare R2, never in git.** The 0.9 GB of originals would bloat git history permanently
  and approach the Pages 1 GB limit. R2 has free egress and 10 GB of free storage. During development
  the dev server serves local variants, so we never needed a temporary git copy.
- **Pre-generated WebP variants plus a committed manifest** rather than Astro `<Image>`. Astro would
  have to download every remote image on every CI build. The manifest gives width and height (no layout
  shift) and the build stays fast and offline.
- **Content model: trips + nested regions**, not a mirror of the old page tree. Region pages and
  activity pages are generated. This fits blog-style themes and TinaCMS better, and makes GPX, stats and
  dates per-trip.
- **Plain Markdown, not MDX**, with galleries inferred from consecutive image lines (rehype plugin).
  This keeps content portable and CMS-friendly. The trade-off is less layout control per post.
- **`unified()` Markdown processor** instead of Astro 7's default Sätteri, for rehype plugin support.
- **Theme behind a view contract** (`src/theme/types.ts` plus the `@theme` alias) so a paid theme can be
  dropped in without touching content or routes.
- **Leaflet + OpenTopoMap** for route maps: free, no API key. Revisit for heavy traffic (tile usage policy).
- **Multi-day route maps as GeoJSON** (`map:` frontmatter) rather than iframing a standalone HTML map.
  The data stays content (with day labels in a top-level `days` member) and the theme picks colours and
  draws the legend, so these maps match the GPX maps and follow light/dark mode.
- **One left edge for entry pages** (starter theme, screens ≥1100px). The content column (`--column`) is
  1000px so photos and maps get room. Text, the Sections box and meta keep the 760px `--prose` width
  for readable line length, but sit at the column's left edge rather than centred. This was chosen over
  centring text under wider photos because many sections are just a heading and photos, and centred text
  made headings line up with nothing. The `sizes` hint in `rehype-media.mjs` is 1000px to match,
  because lone photos (`width: auto`) take it as their natural width.
- **Photo captions use the Markdown image title** (`![alt](src "Caption")`) and render as
  `<figure>`/`<figcaption>` under the photo. It's standard Markdown (no HTML in bodies, CMS-friendly),
  ties the caption to one photo even inside a gallery row, and keeps alt text separate. Gallery photos
  now use `height: auto` with `align-items: start`, so a captioned photo stays the same size as its
  uncaptioned neighbours.
- **No "Last visited" chip on place cards.** It made the cards too busy. The date still shows on the
  place page and still sorts places; trip cards keep their date chip.
- **`content:check` lists unpublished entries** (`draft: true`). They show in `npm run dev` but not on
  the live site, which was easy to miss. Note this flag is separate from the `# draft` description comment.
