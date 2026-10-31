# Deployment

## GitHub Pages (current)

- Workflow: `.github/workflows/deploy.yml` runs on every push to `main` (or manually). It runs
  `npm ci`, then `npm run build` (type-check plus build), and publishes `dist/` to Pages.
- URL: https://broadcastfrequency.net/ (custom domain, base path `/`). `www.` and the old
  `jschmidlapp.github.io/chasing-horizons/...` URLs redirect there.
- One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

### Repository variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Value | Needed |
| --- | --- | --- |
| `MEDIA_BASE_URL` | `https://img.broadcastfrequency.net/w` | yes. Without it the deployed site has no images |
| `SITE_URL` | `https://broadcastfrequency.net` | yes (defaults to the old github.io URL) |
| `BASE_PATH` | `/` | yes (defaults to `/chasing-horizons`) |

These are public values (variables, not secrets). R2 write credentials are never needed in CI.

## Custom domain (set up 2026-10-30)

`broadcastfrequency.net` is registered with Cloudflare, which also runs its DNS.

| Record | Value | Proxy |
| --- | --- | --- |
| `A @` ×4 | `185.199.108.153`, `.109.153`, `.110.153`, `.111.153` (GitHub Pages) | **DNS only**. GitHub can't issue its HTTPS certificate through the proxy |
| `CNAME www` | `jschmidlapp.github.io` | DNS only. GitHub redirects `www` to the bare domain |
| `img` | created by R2 → bucket → Settings → Custom Domains | proxied (managed by Cloudflare) |
| `TXT _github-pages-challenge-jschmidlapp` | GitHub domain verification (account Settings → Pages) | n/a |

GitHub side: repo Settings → Pages → custom domain `broadcastfrequency.net`, "Enforce HTTPS" on
(the certificate covers the bare domain and `www`). No `CNAME` file is needed because the site
deploys through Actions.

Links are all generated through `url()`, so switching domains only means changing the three variables.

## Local production preview

```sh
PUBLIC_MEDIA_BASE_URL=https://img.broadcastfrequency.net/w SITE_URL=https://broadcastfrequency.net BASE_PATH=/ npm run build && npm run preview
```

(Without `PUBLIC_MEDIA_BASE_URL` the build warns and images only work under `npm run dev`.)

## Credentials and access for automation (Claude Code)

- **Git push**: uses the SSH key in `~/.ssh`. Already works.
- **GitHub settings and variables**: the `gh` CLI, authenticated with `gh auth login`, lets an agent
  set Pages, variables and watch runs (`gh run watch`).
- **R2**: `.env` as described in [media.md](media.md). Bucket creation and public-URL toggles are done in
  the Cloudflare dashboard, or with `wrangler` if a Cloudflare API token with R2 edit rights is provided.
