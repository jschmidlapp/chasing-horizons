# Notes for Claude / AI agents

Personal hiking and MTB site (Astro 7 → GitHub Pages, photos on Cloudflare R2).
Read `docs/README.md` first. It indexes the architecture, content model, media pipeline, deployment and theming docs.

## Rules of the road

- Two kinds of write-up: **trips** (happened once) and **spots** (visited regularly, evergreen). Both are
  "entries" in `src/lib/content.ts`; see docs/content-model.md before adding fields.
- Keep `src/content`, `src/lib` and `src/pages` theme-agnostic. Visual work goes in `src/theme/<theme>/`.
  If a view needs new data, add it to `src/theme/types.ts` and compute it in the page.
- Images: never commit image files. Reference them as `/media/<key>`, add new photos with `npm run media:add`,
  then run `media:process` (commit `src/data/media.json`) and `media:upload` (needs `.env`).
- Don't re-run `npm run import:google-sites`. It wipes `src/content` (see docs/migration.md).
- `npm run build` must pass (it runs `astro check`, which validates content frontmatter and types).
- Update the relevant doc in `docs/` in the same change, and log notable choices in `docs/decisions.md`.
- Internal links must go through `url()` / `entryUrl()` / `regionUrl()` / `listUrl()` (base path `/chasing-horizons`).

## Handy commands

```sh
npm run dev                 # http://localhost:4321/chasing-horizons/ (serves .media/variants at /_media)
npm run build               # astro check + static build to dist/
npm run media:process       # originals → WebP variants + manifest
npm run media:upload        # push new media to R2
```

## Local screenshots (WSL)

Headless Chromium needs `libnss3`, `libnspr4` and `libasound2`. If they're not installed system-wide
(`sudo npx playwright install-deps chromium`), extract them with `apt-get download` + `dpkg -x` into a
temporary folder and set `LD_LIBRARY_PATH`.
