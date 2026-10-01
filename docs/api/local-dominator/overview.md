---
title: Local Dominator export
slug: local-dominator/overview
section: Local Dominator
order: 0
---

<!-- manual -->

Forge **Research** exports a Local Dominator grid scan as CSV. The browser harness POSTs `/api/local-dominator/export-grid`. Puppeteer runs on the **Vite dev host**, not inside WordPress.

GitHub Actions and PHP `proc_open` export paths were removed. Production PHP is a stub until a remote worker (Render) is wired.

## Request

`POST /api/local-dominator/export-grid`

```json
{
  "businessName": "Advance Blinds & Drapery",
  "keyword": "blinds near me"
}
```

Both fields are required (trimmed strings).

Success shape from the host exporter:

| Field | Description |
| --- | --- |
| `ok` | `true` |
| `fileName` | CSV name |
| `csvBase64` | UTF-8 CSV as base64 |
| `businessName` / `keyword` | Echoed inputs |

## Who handles the POST

| Environment | Handler | Result |
| --- | --- | --- |
| `npm run dev:local` (Vite on `localhost:8080`) | `scripts/vite-local-dominator-export-plugin.mjs` | Spawns `scripts/research/local-dominator/export-grid.mjs --json` on the **host** |
| Direct hit to WordPress (`https://neopulse.local/api/...` or production) | `Neo_Pulse_App_Local_Dominator_Export::export_grid` | `{ ok: false, code: "LD_EXPORT_WORKER_NOT_CONFIGURED" }` |

The PHP plugin no longer reads `NEO_PULSE_APP_NODE_BINARY` or `NEO_PULSE_APP_LOCAL_DOMINATOR_EXPORT_SCRIPT`. `generate-local-app-secrets.mjs` may still write those constants. They are unused.

Local Vite also installs `scripts/vite-local-wp-api-proxy-plugin.mjs` for every other `/api` path. That plugin has `enforce: "pre"` and proxies the full `/api` prefix to `neopulse.local` (follows redirects, rewrites `Set-Cookie` to `Domain=localhost`). If export-grid returns `LD_EXPORT_WORKER_NOT_CONFIGURED` from `localhost:8080`, the request reached PHP instead of the host interceptor.

## Task and workflow execution

1. Task preflight (`executionKind: local_dominator_export`) returns `status: awaiting_client` plus `clientRunContract` (`businessName`, `keyword`, `saveToDisk`, `saveLocalArchive`).
2. The SPA harness `runLocalDominatorExportClientHarness` (or `runLocalDominatorExportDirectHarness` for workflow/direct runs) calls `exportLocalDominatorGrid`.
3. On success it decodes the CSV, writes the hosted file, optionally downloads it, and completes the task execution when an `executionId` exists.

Destination for this kind is **local archive only**. `saveLocalArchive` defaults true.

Recipe keyword: `research-local-dominator-grid-export`. Agent recipe key: `local_dominator_export`.

## Local setup

```powershell
npm run setup:local-dominator
```

Creates `.env.localdominator` from the example, checks the Research recipe and Puppeteer, and regenerates app secrets.

1. Put Local Dominator login values in `.env.localdominator`.
2. `npm run sync:local-wp` so the recipe is in the WP container.
3. `npm run dev:local` and open Pulse Forge → Agents → Research.
4. Install **Local Dominator grid export**, set business + keyword, Execute.
5. Confirm the CSV on the automation **Archive** tab.

CLI (host, no Forge):

```powershell
npm run localdominator:export:json
```

Optional smoke: `npm run setup:local-dominator:smoke` (Advance Blinds / `blinds near me`).

## Error codes

| Code | Meaning |
| --- | --- |
| `LD_EXPORT_WORKER_NOT_CONFIGURED` | PHP stub. Request did not hit the Vite host plugin. Use `localhost:8080` with `dev:local`, or wait for the production worker. |
| `LD_EXPORT_EXEC_BLOCKED` | Host plugin ran but the export script is missing or Puppeteer failed. |

## Constraints

- Do not call export-grid against production or `neopulse.local` and expect a CSV. Those hosts only return the stub.
- The exporter logs into `app.localdominator.co` with `.env.localdominator`. Keep that file uncommitted.
- Recipe JSON notes still mention Node on the WordPress host. That path is gone. Follow this page.

## Source code

| Area | Path |
| --- | --- |
| PHP stub | `wordpress-plugins/neo-pulse-app/includes/local-dominator/` |
| Task runner | `includes/task-execution/runners/class-task-execution-runner-local-dominator-export.php` |
| Vite intercept | `scripts/vite-local-dominator-export-plugin.mjs` |
| Puppeteer CLI | `scripts/research/local-dominator/export-grid.mjs` |
| Browser harness | `src/lib/agent-runs/run-local-dominator-export-client-harness.ts` |
| Fetch helper | `src/lib/local-dominator-export-api.ts` |
