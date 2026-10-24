# Google Sites migration

The content in `src/content` was generated once from the Google Sites export at `~/website/current`
(24 HTML pages, 556 JPGs) by `scripts/import/google-sites.mjs`, using the page mapping in
`scripts/import/pages.config.mjs`.

> ⚠️ Re-running `npm run import:google-sites` **deletes and regenerates `src/content`** and
> `.media/originals`. Only do it before hand edits are made, or on a branch. After the initial import,
> treat the Markdown as the source of truth.

## How pages were mapped

- **Hub pages** (Home, Places, Rocky Mountain NP, Sequoia NP, South Bay) became generated listing pages.
  Their card images became region and trip `cover`s, and their banner images became `hero`/`banner`.
- **Single-trip pages** (Sky Pond, Flattop, Five Lakes, Sequoias & Moro Rock, Lake Trails, Marble Falls):
  one trip each. The `h2` became the title and the `h3`s became `##` sections.
- **Multi-trip pages** (Arizona, Colorado, Henry Coe, Los Gatos, Monterey, North Bay, Ohio, Palo Alto,
  San Jose, Santa Cruz, Saratoga, Utah) were split into one trip per heading at the configured level.
  Headings above that level became `area` (Fort Collins, Moab, Cincinnati). Text before the first trip
  became the region intro (Henry Coe).
- A few `<p>` elements used as headings ("Mt Tam", "Pt Reyes National Seashore", "Cotoni-Coast Dairies")
  were treated as headings.
- Images were deduped by content hash: 556 files became 523 unique images. All images from the export were used.
- Google Sites crop offsets were dropped, so photos show uncropped.
- Images in the same Google Sites section became one gallery row.

Result: 68 trips, 15 regions, 4 gear items.

## Post-import edits (2026-10-19)

- "12 Mile Drive" renamed to **17-Mile Drive** (slug `17-mile-drive`, media keys moved too).
- **Henry Coe** split into zone sub-regions (superseded 2026-10-23, see below) (`henry-coe-<zone>`, parent `henry-coe-sp`):
  Grizzly Gulch, Phegley, Coit, Kelly, Mahoney, and Western (hiking trails). Rodeo Pond → Grizzly Gulch,
  Manzanita Point Road → Western (assigned 2026-10-21).

- **Henry Coe zones → spots** (2026-10-23): the 30 per-trail spots were merged into 6 zone spots
  (`spots/henry-coe-<zone>-zone/`, trails as `##` sections), and the zone sub-regions were removed. Old trail
  URLs redirect to `…/#<trail>` anchors. Zone `summary` lists the trails as a placeholder.
- **Trips vs. spots** (2026-10-20): entries in Henry Coe, South Bay (and sub-regions), Santa Cruz,
  North Bay and Monterey moved from `trips/` to `spots/` (54 spots, 14 trips).

(The importer config still has the original structure. Another reason not to re-run it.)

## Needs human review

- **Activities** were assigned by page defaults, so check them: Henry Coe trails default to `mtb`, except
  for the hiking-only trails. Los Gatos, San Jose, Saratoga and Palo Alto default to `mtb`. North Bay and
  Ohio default to `hike`. Big Sur and 17-Mile Drive are `scenic`.
- **Dates and stats**: none in the source (photos had no EXIF), so they're all empty for now.
- **Alt text**: every image's alt is its section heading. Improve it gradually.
- **Possible typos in the source**: "Henry CoeState Park" (fixed in the region title).
- **Trips with no text** (photos only): Grand Canyon, Rodeo Pond, 17-Mile Drive, Mt Tam, Pt Reyes,
  Monte Bello, Russian Ridge, Henry Cowell, Wilder Ranch, John Nicholas Trail, Skyline Trail, Arches.
- **Trips with no photos**: Grapevine Trail.
- **Slug collision**: Mt Umunhum appears under both Los Gatos and San Jose, so the second became
  `mt-umunhum-san-jose`. Consider merging them.
- Several Sky Pond and Lake Trails photos are screenshots of maps or elevation profiles. A GPX file
  would replace them with a live map.
