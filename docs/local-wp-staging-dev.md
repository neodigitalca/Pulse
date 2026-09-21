# Local WP Staging dev (neopulse.local)

**Full branching runbook (local → Git → neodigital.ca → clients):** [deploy-local-branching-pathway.md](deploy-local-branching-pathway.md)

Use WP Staging Desktop as an **offline demo stack** while editing Flowbie One. When updates are ready, push to production with the existing neodigital deploy pipeline.

## Architecture

| Layer | Local | Production |
|-------|-------|------------|
| React UI | Vite dev `http://localhost:8080` | `https://neodigital.ca/app/` |
| API (`/api/*`) | `https://neopulse.local` (proxied by Vite) | `https://neodigital.ca` |
| WordPress plugins | Junctioned from repo into WP Staging | SFTP via `deploy:neodigital-app` |

Repo edits under `wordpress-plugins/neo-pulse-wp` and `wordpress-plugins/neo-pulse-app` sync into the local site via directory junctions.

## Prerequisites

1. **Docker Desktop** running
2. **WP Staging Desktop** site `neopulse.local` created and containers up
3. Repo root **`.env`** with API keys (OpenRouter, DataForSEO, Semrush, etc.)
4. **SFTP config** for production deploy only: `wordpress-plugins/flowbie-wpengine.config.json` (not needed for local dev)

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

```powershell
npm run dev
```

Open **http://localhost:8080**. Do **not** use WP Admin → **NEO Pulse App** for the UI (that iframe targets `/neo-pulse/` on local WP, which has no built SPA).

When `scripts/local-wp-staging.config.json` is present (or `VITE_LOCAL_API_TARGET` points at a `.local` / `localhost` / `127.*` host), Vite does **not** use the built-in `server.proxy`. It loads two custom plugins:

| Plugin | Path | Role |
| --- | --- | --- |
| Local WP API proxy | `scripts/vite-local-wp-api-proxy-plugin.mjs` | Forwards `/api` to `neopulse.local`, follows redirects, rewrites `Set-Cookie` to `Domain=localhost` and drops `Secure` |
| Local Dominator export | `scripts/vite-local-dominator-export-plugin.mjs` | Intended to run Puppeteer on the **host** for `POST /api/local-dominator/export-grid` |

The proxy exists because WordPress HTTPS redirects would otherwise leak to the browser as cross-origin. See [Local Dominator export](api/local-dominator/overview.md) if export-grid still hits the PHP stub.

Edit React in `src/` or PHP in `wordpress-plugins/` and refresh. Plugin changes apply immediately when junctions reach the Docker webroot (see [deploy-local-branching-pathway.md](deploy-local-branching-pathway.md) if plugins are missing in the container).

To re-sync secrets or plugins after `.env` changes:

```powershell
npm run sync:local-wp
```

Use `npm run dev:remote` when you intentionally want the live neodigital API instead.

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
| `setup:local-wp` | One-time hosts + secrets + plugin sync |
| `sync:local-wp` | Re-sync plugins and regenerate secrets |
| `dev` / `dev:local` | Same script. Vite + custom `/api` proxy → `neopulse.local` |
| `dev:remote` | Vite `server.proxy` → neodigital.ca |
| `generate:local-app-secrets` | Regenerate app plugin secrets only |
| `setup:local-dominator` | Local Dominator env, secrets paths, recipe check |
| `setup:local-dominator:smoke` | Same plus Advance Blinds grid export smoke test |
| `deploy:neodigital-app` | Ship SPA + app plugin to neodigital.ca |

## Local Dominator grid export (Research automation)

Forge **Research** calls `POST /api/local-dominator/export-grid`. Puppeteer runs on the **Vite host**, not inside the WordPress container. PHP `proc_open` and GitHub Actions export paths are gone. Hitting WordPress directly returns `LD_EXPORT_WORKER_NOT_CONFIGURED` until a remote worker is wired.

Full contract: [Local Dominator export](api/local-dominator/overview.md).

Local staging:

1. Run `npm run setup:local-dominator` (creates `.env.localdominator`, checks the Research recipe and Puppeteer).
2. Edit `.env.localdominator` with your Local Dominator login.
3. Run `npm run sync:local-wp` so the Research recipe is copied into the WP container.
4. Optional CLI smoke test: `npm run setup:local-dominator:smoke` or `npm run localdominator:export:json`.
5. `npm run dev:local`, install **Local Dominator grid export** in Pulse Forge → Agents, click **Execute**, then confirm the CSV on the automation **Archive** tab.

| Code | Meaning |
| --- | --- |
| `LD_EXPORT_WORKER_NOT_CONFIGURED` | Request reached the PHP stub (not the Vite host plugin) |
| `LD_EXPORT_EXEC_BLOCKED` | Host plugin ran; export script missing or Puppeteer failed |

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

Use `npm run dev` or `npm run dev:local` (same script) for WordPress on `neopulse.local`. Use `npm run dev:remote` when you intentionally want the live neodigital API instead.

### Local Dominator export returns worker-not-configured

The PHP route is a stub. Call export-grid through Vite on **http://localhost:8080** (`npm run dev:local`). Calling `https://neopulse.local/api/local-dominator/export-grid` always returns `LD_EXPORT_WORKER_NOT_CONFIGURED`. If localhost still returns that code, the custom `/api` proxy forwarded the POST to WordPress before the host interceptor. Use the CLI (`npm run localdominator:export:json`) to confirm credentials while that path is investigated.

### Self-signed certificate warnings

Expected for `neopulse.local`. Accept once in the browser or use `-k` with curl.

## Related files

- [deploy-local-branching-pathway.md](deploy-local-branching-pathway.md)
- [deploy-neo-pulse.md](deploy-neo-pulse.md)
- [`scripts/local-wp-staging.config.example.json`](../scripts/local-wp-staging.config.example.json)
- [`scripts/sync-local-wp-plugins.ps1`](../scripts/sync-local-wp-plugins.ps1)
- [`scripts/setup-local-wp.ps1`](../scripts/setup-local-wp.ps1)
- [`scripts/generate-local-app-secrets.mjs`](../scripts/generate-local-app-secrets.mjs)
- [`vite.config.ts`](../vite.config.ts) (local proxy plugins when the API target is `.local`)
- [`scripts/vite-local-wp-api-proxy-plugin.mjs`](../scripts/vite-local-wp-api-proxy-plugin.mjs)
- [`scripts/vite-local-dominator-export-plugin.mjs`](../scripts/vite-local-dominator-export-plugin.mjs)
- [Local Dominator export](api/local-dominator/overview.md)
- [Pulse Forge](api/pulse-forge/overview.md)
