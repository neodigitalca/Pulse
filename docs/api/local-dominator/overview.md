---
title: Local Dominator overview
slug: local-dominator/overview
section: Local Dominator
order: 0
---

<!-- manual -->

Local Dominator grid CSV export is a **research** automation (`executionKind: local_dominator_export`). The SPA calls `POST /api/local-dominator/export-grid` from `src/lib/local-dominator-export-api.ts`.

## HTTP contract

```json
{ "businessName": "Advance Blinds & Drapery", "keyword": "blinds near me" }
```

Success shape expected by the harness: `{ ok, fileName, csvBase64, businessName, keyword }`.

| Environment | What answers | Result |
| --- | --- | --- |
| Production / any PHP host | `Neo_Pulse_App_Local_Dominator_Export::export_grid` | `{ ok: false, code: "LD_EXPORT_WORKER_NOT_CONFIGURED" }` |
| Vite + local WP proxy | Same PHP stub (proxy wins) | Same stub error |
| Vite host plugin (intended) | Puppeteer via `scripts/research/local-dominator/export-grid.mjs` | CSV JSON, or `LD_EXPORT_EXEC_BLOCKED` |

The PHP worker that used `proc_open` on the WordPress host is gone. Do not document Node-on-WP as a live path.

## Vite interceptor (does not run today)

`scripts/vite-local-dominator-export-plugin.mjs` registers `POST /api/local-dominator/export-grid` on the Vite server and spawns host Node + Puppeteer.

`vite.config.ts` also loads `localWpApiProxyPlugin()` with `enforce: "pre"`. That plugin consumes **every** `/api` path and never calls `next()`. Middleware order means the Local Dominator plugin never sees the request while local WP proxy is active.

When the API target is production, Vite uses `server.proxy` to neodigital.ca. The host plugin is not loaded (`isLocalWpProxy` is false), so the stub still wins.

## Working CLI

```powershell
npm run setup:local-dominator
npm run localdominator:export:json
```

Requires `.env.localdominator` login fields. Optional headed run: `npm run localdominator:export`.

Recipe `research-local-dominator-grid-export` still appears in Pulse Forge. Execute-from-UI hits the stub until a worker is wired (planned as a remote worker, not PHP `proc_open`).

## Agent harness

| Piece | Path |
| --- | --- |
| Recipe key | `local_dominator_export` (`use-default-agent-run-harnesses.ts`) |
| Direct / task harness | `src/lib/agent-runs/run-local-dominator-export-client-harness.ts` |
| Required payload | `businessName`, `keyword`; site id on the run context |
| Archive | Hosted file + optional disk download (`saveToDisk` / `saveLocalArchive`) |

`generate:local-app-secrets` still emits `NEO_PULSE_APP_NODE_BINARY` and `NEO_PULSE_APP_LOCAL_DOMINATOR_*`. The stub does not read them.

## Related

- [Local WP staging](../../local-wp-staging-dev.md)
- [Agent run recipes](../agent-runs/recipes.md)
- [Pulse Forge](../pulse-forge/overview.md)
