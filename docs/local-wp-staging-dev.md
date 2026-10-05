# Local WP Staging dev (neopulse.local)

**Full branching runbook (local → Git → neodigital.ca → clients):** [deploy-local-branching-pathway.md](deploy-local-branching-pathway.md)

Use WP Staging Desktop as an **offline demo stack** while editing Flowbie One. When updates are ready, push to production with the existing neodigital deploy pipeline.

## Architecture

| Layer | Default local UI | Opt-in local WP | Production |
|-------|------------------|-----------------|------------|
| React UI | Vite `http://localhost:8080` | same | `https://neodigital.ca/app/` |
| API (`/api/*`) | Vite → `https://neodigital.ca` | Vite → `https://neopulse.local` when `PULSE_LOCAL_WP=1` and probe succeeds | `https://neodigital.ca` |
| WordPress plugins | not required | Junctioned from repo into WP Staging | SFTP via `deploy:neodigital-app` |

Repo edits under `wordpress-plugins/neo-pulse-wp` and `wordpress-plugins/neo-pulse-app` sync into the local site via directory junctions.

## Prerequisites

Local UI against the **live neodigital API** needs only Node and repo `.env`. Offline WordPress is optional.

For the **neopulse.local** stack:

1. **Docker Desktop** running
2. **WP Staging Desktop** site `neopulse.local` created and containers up
3. Repo root **`.env`** with API keys (OpenRouter, DataForSEO, Semrush, etc.)
4. **`PULSE_LOCAL_WP=1`** when you start Vite (see Daily loop)
5. **SFTP config** for production deploy only: `wordpress-plugins/flowbie-wpengine.config.json` (not needed for local UI)

## One-time setup

From repo root:

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

## Daily dev loop

`npm run dev`, `npm run dev:local`, `npm run pulse:local`, and `npm start` all run `scripts/start-pulse-local.cjs`. That script is the canonical local UI start.

**Default API is production** (`https://neodigital.ca`). Local WordPress is opt-in.

```powershell
npm run pulse:local
```

Open **http://localhost:8080**. Sign in with your neodigital.ca account when the resolver prints `API: production` or `API: Docker/WP offline`.

### Target selection (`resolvePulseDevApiTarget`)

| Condition | Mode | `/api` target |
|-----------|------|----------------|
| `VITE_LOCAL_API_TARGET` set | uses that URL | env override |
| No `scripts/local-wp-staging.config.json` | `production` | `https://neodigital.ca` |
| Config exists, but `PULSE_LOCAL_WP` is unset | `production` | `https://neodigital.ca` |
| `PULSE_LOCAL_WP=1` (or `true`/`yes`) + config + `/api/auth/me` probe succeeds | `local-wp` | `neopulse.local` from config |
| `PULSE_LOCAL_WP=1` + config, but probe fails (404 or down) | `production-fallback` | `https://neodigital.ca` |

`PULSE_LOCAL_WP` is read in `scripts/resolve-dev-api-target.cjs`. The start script then **probes** local WP (`GET /api/auth/me`; 401/403 count as alive, 404 does not).

Force local WP (Docker must already be up):

```powershell
$env:PULSE_LOCAL_WP = "1"
npm run pulse:local
```

Or start the container then Vite:

```powershell
powershell -File scripts/start-local-docker.ps1
```

`start-local-docker.ps1` sets `PULSE_LOCAL_WP=1`. It then calls `start-pulse-local.ps1`, which **hard-resets the checkout to `origin/main`**. Prefer the npm script for day-to-day work.

`npm run dev:remote` always pins `VITE_LOCAL_API_TARGET` to `https://neodigital.ca` (no probe, no `PULSE_LOCAL_WP`).

Do **not** use WP Admin → **NEO Pulse App** for the UI (that iframe targets `/neo-pulse/` on local WP, which has no built SPA).

When the target is local WP, Vite does **not** use `server.proxy`. It loads `scripts/vite-local-wp-api-proxy-plugin.mjs` (`enforce: "pre"`, all `/api`) so cross-origin redirects stay on the host and session cookies rewrite to `localhost`. Production target uses Vite `server.proxy` `/api` → neodigital.ca.

Edit React in `src/` or PHP in `wordpress-plugins/` and refresh. Plugin changes apply immediately when junctions reach the Docker webroot (see [deploy-local-branching-pathway.md](deploy-local-branching-pathway.md) if plugins are missing in the container).

To re-sync secrets or plugins after `.env` changes:

```powershell
npm run sync:local-wp
```

## Push to production

Follow the production section in [deploy-local-branching-pathway.md](deploy-local-branching-pathway.md) and [deploy-neo-pulse.md](deploy-neo-pulse.md):

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
| `pulse:local` / `dev` / `dev:local` / `start` | Vite on `:8080`; API via `start-pulse-local.cjs` (production unless `PULSE_LOCAL_WP` + live local WP) |
| `dev:remote` | Vite with `/api` pinned to neodigital.ca |
| `setup:local-wp` | One-time hosts + secrets + plugin sync |
| `sync:local-wp` | Re-sync plugins and regenerate secrets |
| `generate:local-app-secrets` | Regenerate app plugin secrets only |
| `setup:local-dominator` | Local Dominator env, secrets paths, recipe check |
| `setup:local-dominator:smoke` | Same plus Advance Blinds grid export smoke test |
| `localdominator:export:json` | Host-side Puppeteer grid export (CLI) |
| `deploy:neodigital-app` | Ship SPA + app plugin to neodigital.ca |

## Local Dominator grid export (Research automation)

See [Local Dominator overview](api/local-dominator/overview.md) for the full path.

**PHP on WordPress is a stub.** `POST /api/local-dominator/export-grid` returns `LD_EXPORT_WORKER_NOT_CONFIGURED`. It does not spawn Node or Puppeteer on the WP host.

The browser harness (`exportLocalDominatorGrid` → `/api/local-dominator/export-grid`) therefore fails against both production PHP and proxied local WP.

A Vite plugin (`scripts/vite-local-dominator-export-plugin.mjs`) can run Puppeteer on the **dev host**, but it is registered after `local-wp-api-proxy` (`enforce: "pre"`), which handles every `/api` path and never calls `next()`. The interceptor does not run while local WP proxy is active.

Working path today:

1. Run `npm run setup:local-dominator` (creates `.env.localdominator`).
2. Edit `.env.localdominator` with your Local Dominator login.
3. Smoke on the host: `npm run localdominator:export:json` (or `setup:local-dominator:smoke`).
4. `generate:local-app-secrets` still writes `NEO_PULSE_APP_NODE_BINARY` and `NEO_PULSE_APP_LOCAL_DOMINATOR_*`. The PHP export stub does not read those constants.

`LD_EXPORT_EXEC_BLOCKED` is only returned by the Vite host plugin (missing script or Puppeteer failure), not by PHP.

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

Local dev uses `http://localhost:8080` proxying to HTTPS WordPress. Vite rewrites cookie domain to `localhost`. Clear site cookies and log in again via the app. If login throws "Something went wrong", clear Local Storage key `neo-pulse_device_auth` for `localhost:8080`.

### Login uses wrong backend

Default `npm run pulse:local` (and `dev` / `dev:local`) talks to **neodigital.ca**. Use `PULSE_LOCAL_WP=1` only when Docker/WP is up and you want `neopulse.local`. Use `npm run dev:remote` to skip the local probe and pin production.

If the start banner says `production-fallback`, local WP did not answer `/api/auth/me`. Start the WP Staging site, then restart Vite with `PULSE_LOCAL_WP=1`.

### Self-signed certificate warnings

Expected for `neopulse.local`. Accept once in the browser or use `-k` with curl.

## Related files

- [deploy-local-branching-pathway.md](deploy-local-branching-pathway.md)
- [deploy-neo-pulse.md](deploy-neo-pulse.md)
- [`scripts/local-wp-staging.config.example.json`](../scripts/local-wp-staging.config.example.json)
- [`scripts/sync-local-wp-plugins.ps1`](../scripts/sync-local-wp-plugins.ps1)
- [`scripts/setup-local-wp.ps1`](../scripts/setup-local-wp.ps1)
- [`scripts/start-pulse-local.cjs`](../scripts/start-pulse-local.cjs)
- [`scripts/resolve-pulse-dev-api.cjs`](../scripts/resolve-pulse-dev-api.cjs)
- [`scripts/resolve-dev-api-target.cjs`](../scripts/resolve-dev-api-target.cjs)
- [`scripts/generate-local-app-secrets.mjs`](../scripts/generate-local-app-secrets.mjs)
- [`vite.config.ts`](../vite.config.ts) (reads `VITE_LOCAL_API_TARGET`)
- [article-style-asap.md](article-style-asap.md)
- [api/pulse-forge/overview.md](api/pulse-forge/overview.md)
