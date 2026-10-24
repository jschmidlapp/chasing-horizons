# Chasing Horizons

Personal site documenting hikes, mountain bike rides, and interesting places. Built with
[Astro](https://astro.build), hosted on GitHub Pages, with photos served from Cloudflare R2.

## Quick start

```sh
npm install
npm run dev          # http://localhost:4321/chasing-horizons/
```

Images aren't in git. Local dev serves them from `.media/variants/`. On a fresh machine, fill that
folder first with `npm run media:pull && npm run media:process` (needs R2 credentials in `.env`).

## Common tasks

| Task | How |
| --- | --- |
| Add a trip (one-off) or spot (regular haunt) | Create `src/content/trips/<slug>/index.md` or `src/content/spots/<slug>/index.md` ([content model](docs/content-model.md)) |
| Add photos | `npm run media:add -- spots/<slug> ~/photos/*.jpg`, paste the printed Markdown, then `npm run media:process && npm run media:upload` ([media](docs/media.md)) |
| Add a route map | Drop `track.gpx` in the entry folder and set `gpx: "track.gpx"` |
| See what content needs attention | `npm run content:check` (missing, long, or draft descriptions) |
| Publish | Push to `main`. GitHub Actions builds and deploys ([deployment](docs/deployment.md)) |
| Change the look | Everything visual is in `src/theme/starter/` ([theming](docs/theming.md)) |

## Documentation

Start at [docs/README.md](docs/README.md).
