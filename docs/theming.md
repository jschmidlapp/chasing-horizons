# Theming

The site separates **content and logic** (theme-agnostic) from **presentation** (swappable):

| Layer | Location | Changes when swapping themes? |
| --- | --- | --- |
| Content | `src/content/**` | no |
| Schema | `src/content.config.ts` | rarely (only if the new theme needs new fields) |
| Data and URL helpers | `src/lib/*` | no |
| Routes | `src/pages/*` | no, or minimal |
| View contract | `src/theme/types.ts` | no |
| Presentation | `src/theme/starter/**` | **replaced** |

The active theme is selected by the `@theme/*` path alias in `tsconfig.json`:

```jsonc
"@theme/*": ["./src/theme/starter/*"]
```

## View contract

Each theme provides these files in `views/`, accepting the props defined in `src/theme/types.ts`:

| View | Used by | Slot |
| --- | --- | --- |
| `HomeView.astro` | `/` | none |
| `PlacesView.astro` | `/places/` | none |
| `RegionView.astro` | `/places/<region>/` | region intro (rendered Markdown) |
| `TripView.astro` | `/trips/<slug>/` | trip body (rendered Markdown) |
| `TripListView.astro` | `/activities/<a>/`, 404 | none |
| `GearView.astro` | `/gear/` | none |

Themes must render images with `imageAttrs()` / `imageUrl()` from `src/lib/media-core.mjs` (see the
starter's `components/Img.astro`). Rendered Markdown contains `.gallery[data-count]` wrappers and images
with a `data-full` attribute. A theme should style `.gallery` and may attach a lightbox to `[data-full]`.

## Adopting a paid Astro theme

Most commercial Astro themes ship as a whole project with their own `src/content` and pages. To adopt one:

1. Copy the theme's layouts, components and styles into `src/theme/<name>/`. Don't copy its content or routes.
2. Write the six views in `src/theme/<name>/views/` by composing the theme's components with our props.
   Map our fields onto theirs (e.g. their "post" card → our `Trip`).
3. Replace its image components with `Img.astro`-style rendering via `imageAttrs()`. Theme image
   components often assume Astro's `<Image>` and local files, but ours live on R2.
4. If the theme uses Tailwind, add `@tailwindcss/vite` in `astro.config.mjs`. The starter uses plain CSS,
   so there's no conflict.
5. Point the `@theme/*` alias at the new folder, run `npm run build`, and fix type errors (the contract
   catches mismatches).
6. Once happy, delete `src/theme/starter`, or keep it as a reference.

## Starter theme notes

- Plain CSS with custom properties in `styles/global.css`. Light and dark mode follow the OS.
- Fonts: Fraunces (headings) and Inter (body) from Google Fonts.
- Map: Leaflet with OpenTopoMap tiles (free, attribution required, fair-use limits).
