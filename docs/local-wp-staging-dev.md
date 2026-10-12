# Local WP Staging dev (neopulse.local)

**Full branching runbook (local → Git → neodigital.ca → clients):** [deploy-local-branching-pathway.md](deploy-local-branching-pathway.md)

Use WP Staging Desktop as an **offline demo stack** while editing Pulse. When updates are ready, push to production with the existing neodigital deploy pipeline.

## Architecture

| Layer | Default local UI | Optional local WP | Production |
|-------|------------------|-------------------|------------|
| React UI | Vite `http://localhost:8080` | same | `https://neodigital.ca/app/` |
| API (`/api/*`) | `https://neodigital.ca` (Vite proxy) | `https://neopulse.local` when opted in and alive | `https://neodigital.ca` |
| WordPress plugins | not used | Junctioned from repo into WP Staging | SFTP via `deploy:neodigital-app` |

`npm run dev`, `dev:local`, `pulse:local`, and `start` all run [`scripts/start-pulse-local.cjs`](../scripts/start-pulse-local.cjs). They are the same command.

Default API target is **neodigital.ca**. Local WordPress is opt-in: `PULSE_LOCAL_WP=1` plus `scripts/local-wp-staging.config.json`, then a live `GET /api/auth/me` probe.

## Prerequisites

1. Repo root **`.env`** with API keys (OpenRouter, DataForSEO, Semrush, etc.)
2. **SFTP config** for production deploy only: `wordpress-plugins/flowbie-wpengine.config.json` (not needed for local UI)
3. **Optional local WP:** Docker Desktop + WP Staging Desktop site `neopulse.local`

## One-time local WP setup

From repo root (Windows):

```powershell
npm run setup:local-wp
```

This will:

1. Fix Windows hosts (`127.3.2.1 neopulse.local`) via UAC prompt
2. Write `neo-pulse-wp/.env` and `neo-pulse-app-secrets.php` from repo `.env`
3. Junction repo plugins into WP Staging `www/wp-content/plugins/`

If paths differ on your machine, copy and edit:

```powershell
copy scripts\local-wp-staging.config.example.json scripts\local-wp-staging.config.json
```

Then activate plugins:

1. Open **https://neopulse.local/wp-admin/**
2. Plugins → activate **NEO Pulse WP** and **NEO Pulse App**

Bootstrap the API (first run only):

```powershell
curl.exe -k -X POST https://neopulse.local/api/auth/setup-admin `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"admin@neopulse.local\",\"password\":\"your-local-password\",\"displayName\":\"Local Admin\",\"teamName\":\"Local Demo\"}"
```

## Daily UI loop

```powershell
npm run pulse:local
```

Same as `npm run dev` / `dev:local` / `start`. Open **http://localhost:8080**. Do **not** use WP Admin → **NEO Pulse App** for the UI (that iframe targets `/neo-pulse/` on local WP, which has no built SPA).

| You changed | Action | Reload |
|-------------|--------|--------|
| `src/**` | Save file | Vite HMR |
| `wordpress-plugins/**` (local WP opted in) | Save (junction) or re-`docker cp` | Refresh browser |
| Repo root `.env` (local WP) | `npm run sync:local-wp` | Refresh browser |

### How `/api` is chosen

[`scripts/resolve-pulse-dev-api.cjs`](../scripts/resolve-pulse-dev-api.cjs) + [`scripts/resolve-dev-api-target.cjs`](../scripts/resolve-dev-api-target.cjs):

1. `VITE_LOCAL_API_TARGET` if already set
2. Else if `PULSE_LOCAL_WP` is `1` / `true` / `yes` and `scripts/local-wp-staging.config.json` exists, use `apiProxyTarget` or `siteUrl` from that file
3. Else `https://neodigital.ca`

When the configured target is a local host, start-up probes `GET /api/auth/me`. A non-404 response uses local WP. A failed probe falls back to neodigital.ca (console: `production-fallback`). Sign in with your neodigital.ca account in that case.

Force local WP without resetting git:

```powershell
docker start wpstg-neopulse-local-php
$env:PULSE_LOCAL_WP = "1"
npm run pulse:local
```

`scripts/start-local-docker.ps1` starts the container, then calls `scripts/start-pulse-local.ps1`, which `git fetch`es `origin/main`, checks out `main`, and `git reset --hard origin/main`. Do **not** use either `.ps1` as a daily starter if you have local commits. The npm scripts do **not** reset git.

Force production API without the probe:

```powershell
npm run dev:remote
```

The starter also requires the Polish menu in `src/lib/overview/overview-bulk-action-clusters.ts`. If that file is missing Polish, it exits and tells you to update `main`.

## Push to production

Follow [deploy-local-branching-pathway.md](deploy-local-branching-pathway.md) and [deploy-neo-pulse.md](deploy-neo-pulse.md):

```powershell
git add -A
git reset -- wordpress-plugins/.deploy/*.zip wordpress-plugins/*.zip
git commit -m "Deploy: short summary"
git push origin main

npm run deploy:neodigital-app
npm run smoke:neo-pulse
```

Client-site plugin deploy (`neo-pulse-wp` to WP Engine clients) stays separate:

```powershell
npm run deploy:wp-staging
npm run deploy:wp-clients
```

## npm scripts

| Script | Purpose |
|--------|---------|
| `pulse:local` / `dev` / `dev:local` / `start` | Vite on `:8080`. API = neodigital.ca unless `PULSE_LOCAL_WP` + live local probe |
| `dev:remote` | Vite with `/api` forced to neodigital.ca |
| `setup:local-wp` | One-time hosts + secrets + plugin sync |
| `sync:local-wp` | Re-sync plugins and regenerate secrets |
| `generate:local-app-secrets` | Regenerate app plugin secrets only |
| `setup:local-dominator` | Local Dominator env + secrets paths + recipe check |
| `setup:local-dominator:smoke` | Same plus Advance Blinds grid export smoke test (CLI) |
| `deploy:neodigital-app` | Ship SPA + app plugin to neodigital.ca |

## Local Dominator grid export

`POST /api/local-dominator/export-grid` is implemented in PHP as a stub. It always returns:

```json
{ "ok": false, "error": "Local Dominator export worker is not configured.", "code": "LD_EXPORT_WORKER_NOT_CONFIGURED" }
```

See [Local Dominator API](api/local-dominator/overview.md).

`generate-local-app-secrets.mjs` still writes `NEO_PULSE_APP_NODE_BINARY` and `NEO_PULSE_APP_LOCAL_DOMINATOR_*`. The PHP stub does not read those constants.

Vite registers [`scripts/vite-local-dominator-export-plugin.mjs`](../scripts/vite-local-dominator-export-plugin.mjs) to run Puppeteer on the host, but [`local-wp-api-proxy-plugin.mjs`](../scripts/vite-local-wp-api-proxy-plugin.mjs) uses `enforce: "pre"` and proxies every `/api` path first. The host interceptor does not run while the local WP proxy is active.

CLI still works on the developer machine:

1. `npm run setup:local-dominator` (creates `.env.localdominator`)
2. Edit `.env.localdominator` with the Local Dominator login
3. `npm run localdominator:export:json` or `npm run setup:local-dominator:smoke`

## Troubleshooting

### HTTPS Endpoint red in WP Staging Desktop

Often a false alarm. Nginx rejects TLS without the correct hostname. Test in a browser: **https://neopulse.local/** should load.

### Connection refused on neopulse.local

Check hosts file has:

```
127.3.2.1 neopulse.local
127.3.2.1 adminer.neopulse.local
```

Re-run `npm run setup:local-wp` or `scripts/fix-wp-staging-hosts.ps1` as Administrator.

### Plugin folder exists but is not a junction

Remove the copied folder under `wp-content/plugins/neo-pulse-wp` (or `-app`), then:

```powershell
npm run sync:local-wp
```

Or force robocopy mirror:

```powershell
powershell -File scripts/sync-local-wp-plugins.ps1 -ForceRobocopy
```

### API 401 / session cookies

Local UI is `http://localhost:8080`. When the proxy target is local WP, Vite rewrites cookie domain to `localhost`. Clear site cookies and log in again via the app. If login throws "Something went wrong", clear Local Storage key `neo-pulse_device_auth` for `localhost:8080`.

### Login uses the live backend (unexpected)

Default. You did not set `PULSE_LOCAL_WP=1`, or the `/api/auth/me` probe failed (Docker down, plugin inactive, or 404). Start WP Staging, then `docker start wpstg-neopulse-local-php`, set `PULSE_LOCAL_WP=1`, and run `npm run pulse:local`. Use `npm run dev:remote` only when you want production on purpose.

### Polish menu missing at start

`start-pulse-local.cjs` exits if `overview-bulk-action-clusters.ts` does not contain `content-polish`. Update `main`. Do **not** run `start-pulse-local.ps1` if you have uncommitted work (hard reset).

### Self-signed certificate warnings

Expected for `neopulse.local`. Accept once in the browser or use `-k` with curl.

## Related files

- [deploy-local-branching-pathway.md](deploy-local-branching-pathway.md)
- [deploy-neo-pulse.md](deploy-neo-pulse.md)
- [`scripts/start-pulse-local.cjs`](../scripts/start-pulse-local.cjs)
- [`scripts/resolve-pulse-dev-api.cjs`](../scripts/resolve-pulse-dev-api.cjs)
- [`scripts/resolve-dev-api-target.cjs`](../scripts/resolve-dev-api-target.cjs)
- [`scripts/start-local-docker.ps1`](../scripts/start-local-docker.ps1)
- [`scripts/local-wp-staging.config.example.json`](../scripts/local-wp-staging.config.example.json)
- [`vite.config.ts`](../vite.config.ts)
