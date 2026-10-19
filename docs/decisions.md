# Decision log

Newest first. Add an entry whenever a choice would be non-obvious to someone picking up the project.

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
