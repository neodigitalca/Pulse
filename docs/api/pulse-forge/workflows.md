---
title: Pulse Forge workflows
slug: pulse-forge/workflows
section: Pulse Forge
order: 10
---

<!-- manual -->

Team-scoped workflow graph API. Handler: [`class-workflows-route-handlers.php`](../../../wordpress-plugins/neo-pulse-app/includes/workflows/class-workflows-route-handlers.php). Store: [`class-workflows-store.php`](../../../wordpress-plugins/neo-pulse-app/includes/workflows/class-workflows-store.php).

Base: `/api/teams/{teamId}/workflows`

All routes require an active team member.

## Workflow record

Statuses: `draft` | `published`.

```json
{
  "id": 12,
  "teamId": 1,
  "name": "Weekly GSC sweep",
  "description": "",
  "status": "draft",
  "wordpressSiteId": "wp-123",
  "nodes": [],
  "edges": [],
  "ragVariables": [],
  "createdAt": "2026-10-12 16:00:00",
  "updatedAt": "2026-10-12 16:00:00",
  "publishedAt": null
}
```

Create body fields: `name` (default `Untitled workflow`), `description`, `wordpressSiteId`, `nodes`, `edges`, `ragVariables`.

## Run record

Statuses: `queued` | `running` | `done` | `failed` | `cancelled`.

```json
{
  "id": 40,
  "workflowId": 12,
  "teamId": 1,
  "status": "queued",
  "triggerKind": "trigger_manual",
  "triggerPayload": {},
  "currentNodeId": "",
  "errorMessage": null,
  "createdAt": "2026-10-12 16:01:00",
  "updatedAt": "2026-10-12 16:01:00",
  "finishedAt": null
}
```

## Step output

`variableKey` is required on create. `scope` is `run` | `agent` | `shared` (unknown values become `run`).

## Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | List workflows for the team |
| POST | `/` | Create draft |
| GET | `/{id}` | Get one |
| PATCH | `/{id}` | Patch payload. `{ "clearRuns": true }` clears runs instead |
| DELETE | `/{id}` | Delete workflow |
| POST | `/{id}/publish` | Set `published` + `publishedAt` |
| GET | `/{id}/runs` | List runs |
| POST | `/{id}/runs` | Enqueue a run (`trigger_manual`). Body: `{ "simulated"?: bool, "triggerPayload"?: object }` |
| GET | `/{id}/runs/{runId}` | Get one run (must belong to `{id}`) |
| PATCH | `/{id}/runs/{runId}` | Patch run. `{ "delete": true }` deletes the run |
| DELETE | `/{id}/runs/{runId}` | Delete one run |
| DELETE | `/{id}/runs` | Clear all runs for the workflow |
| POST | `/{id}/runs/clear` | Same as DELETE runs |
| POST | `/{id}/runs/{runId}/delete` | Same as DELETE one run |
| GET | `/{id}/runs/{runId}/outputs` | List step outputs |
| POST | `/{id}/runs/{runId}/outputs` | Add output (`variableKey` required) |
| GET | `/library` | Shared library entries (`workflow-library.json`) |
| POST | `/library/{key}` | Promote a step output into the library. Body: `{ "runId", "outputId", "label"? }` |
| GET | `/trigger-pending` | Pending trigger queue |
| POST | `/trigger-pending/{workflowId}/ack` | Dequeue pending for that workflow |

Missing ids return `{ "ok": false, "error": "Not found" }` with 404.

## Triggers (published graphs only)

Evaluator: [`class-workflow-trigger-evaluator.php`](../../../wordpress-plugins/neo-pulse-app/includes/workflows/class-workflow-trigger-evaluator.php).

| Node `kind` | When it fires |
|-------------|---------------|
| `trigger_calendar` | Cron expression, or `frequency` `once` / `daily` / `weekly` / `monthly` / `yearly` with `startDate` + `time`. Default timezone `America/Edmonton`. `once` matches within 3600s after due. |
| `trigger_gsc` | GSC signal on the workflow's site |
| `trigger_manual` | `POST /{id}/runs` |

Agent-done triggers are evaluated separately ([`class-workflow-trigger-agent-done.php`](../../../wordpress-plugins/neo-pulse-app/includes/workflows/class-workflow-trigger-agent-done.php)).

## Example: create and run

```bash
curl -sS -X POST "https://neodigital.ca/api/teams/1/workflows" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Manual smoke","nodes":[],"edges":[]}'

curl -sS -X POST "https://neodigital.ca/api/teams/1/workflows/12/publish" \
  -b cookies.txt

curl -sS -X POST "https://neodigital.ca/api/teams/1/workflows/12/runs" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"simulated":true,"triggerPayload":{}}'
```

Browser clients must send `credentials: "include"`.

## UI

`#pulse-forge/workflows` and `#pulse-forge/workflows/{id}`. See [Pulse Forge overview](overview.md).
