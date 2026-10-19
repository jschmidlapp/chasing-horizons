# Deployment

## GitHub Pages (current)

- Workflow: `.github/workflows/deploy.yml` runs on every push to `main` (or manually). It runs
  `npm ci`, then `npm run build` (type-check plus build), and publishes `dist/` to Pages.
- URL: https://jschmidlapp.github.io/chasing-horizons/ (project site, so base path `/chasing-horizons`).
- One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

### Repository variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Value | Needed |
| --- | --- | --- |
| `MEDIA_BASE_URL` | e.g. `https://pub-xxxx.r2.dev/w` | yes. Without it the deployed site has no images |
| `SITE_URL` | e.g. `https://example.com` | only once a custom domain is set up |
| `BASE_PATH` | `/` | only once a custom domain is set up |

These are public values (variables, not secrets). R2 write credentials are never needed in CI.

## Adding a custom domain later

1. Buy or transfer the domain to Cloudflare DNS (needed for an R2 custom domain anyway).
2. R2 bucket → Settings → Custom Domains → add `img.example.com`. Set the `MEDIA_BASE_URL` variable to
   `https://img.example.com/w` and disable the r2.dev URL (r2.dev is rate-limited and not meant for production).
3. GitHub Pages → Custom domain `example.com` (or `www.`). Add the DNS records GitHub lists, with the
   Cloudflare proxy off (DNS only) for the Pages records. Enable "Enforce HTTPS".
4. Set the `SITE_URL=https://example.com` and `BASE_PATH=/` variables and re-run the workflow.

Links are all generated through `url()`, so nothing else changes.

## Local production preview

```sh
PUBLIC_MEDIA_BASE_URL=https://pub-xxxx.r2.dev/w npm run build && npm run preview
```

(Without `PUBLIC_MEDIA_BASE_URL` the build warns and images only work under `npm run dev`.)

## Credentials and access for automation (Claude Code)

- **Git push**: uses the SSH key in `~/.ssh`. Already works.
- **GitHub settings and variables**: the `gh` CLI, authenticated with `gh auth login`, lets an agent
  set Pages, variables and watch runs (`gh run watch`).
- **R2**: `.env` as described in [media.md](media.md). Bucket creation and public-URL toggles are done in
  the Cloudflare dashboard, or with `wrangler` if a Cloudflare API token with R2 edit rights is provided.
