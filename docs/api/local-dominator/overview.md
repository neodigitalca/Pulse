---
title: Local Dominator export
slug: local-dominator/overview
section: Local Dominator
order: 0
---

<!-- manual -->

`POST /api/local-dominator/export-grid` is the Research automation hook for Local Dominator grid CSV export.

## Current PHP behavior

[`class-local-dominator-export.php`](../../../wordpress-plugins/neo-pulse-app/includes/local-dominator/class-local-dominator-export.php) is a stub. Every POST returns HTTP 200 JSON:

```json
{
  "ok": false,
  "error": "Local Dominator export worker is not configured.",
  "code": "LD_EXPORT_WORKER_NOT_CONFIGURED"
}
```

Unknown subpaths return 404 `{ "error": "Not found" }`.

The request body is ignored. There is no Node spawn on the WordPress host.

## Vite host interceptor (does not run)

[`scripts/vite-local-dominator-export-plugin.mjs`](../../../scripts/vite-local-dominator-export-plugin.mjs) is meant to intercept `POST /api/local-dominator/export-grid` on the Vite dev server and run Puppeteer on the host (`scripts/research/local-dominator/export-grid.mjs`). It expects `businessName` and `keyword` in the JSON body.

[`scripts/vite-local-wp-api-proxy-plugin.mjs`](../../../scripts/vite-local-wp-api-proxy-plugin.mjs) uses `enforce: "pre"` and proxies **all** `/api` paths to local WP first. While that plugin is active, the interceptor never sees the request. The PHP stub wins.

`vite.config.ts` only registers both plugins when the resolved API target is a local host.

## CLI (works today)

```powershell
npm run setup:local-dominator
# edit .env.localdominator
npm run localdominator:export:json
```

Smoke: `npm run setup:local-dominator:smoke` (Advance Blinds grid). Headed login: `npm run localdominator:login:headed`.

## Secrets that are unused

`generate-local-app-secrets.mjs` still defines:

- `NEO_PULSE_APP_NODE_BINARY`
- `NEO_PULSE_APP_LOCAL_DOMINATOR_EXPORT_SCRIPT`
- `NEO_PULSE_APP_LOCAL_DOMINATOR_ENV_FILE`

The PHP stub does not read them. A future worker would.

## Recipe

Forge recipe keyword: `research-local-dominator-grid-export`. Installing and executing it hits the stub until a worker is wired.

Local setup notes: [local-wp-staging-dev.md](../../local-wp-staging-dev.md).
