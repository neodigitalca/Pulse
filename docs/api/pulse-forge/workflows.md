---
title: Pulse Forge workflows
slug: pulse-forge/workflows
section: Pulse Forge
order: 10
---

<!-- manual -->

Team-scoped graph automations. PHP stores definitions and run rows; the **browser** walks the graph.

## Auth

All routes sit under `/api/teams/{teamId}/workflows/*`. Caller must be signed in and an **active** team member (`Neo_Pulse_App_Tasks_Store::is_active_member`). No extra write-role check in the workflow handler.

## Routes

Base: `/api/teams/{teamId}/workflows`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | List workflows |
| POST | `/` | Create (`name`, `description`, `wordpressSiteId`, `nodes`, `edges`, `ragVariables`) |
| GET | `/{id}` | One workflow |
| PATCH | `/{id}` | Patch payload, or `{ "clearRuns": true }` |
| DELETE | `/{id}` | Delete |
| POST | `/{id}/publish` | Set `status: published` |
| GET | `/{id}/runs` | List runs |
| POST | `/{id}/runs` | Manual enqueue (`trigger_manual`; optional `simulated`, `triggerPayload`) |
| GET | `/{id}/runs/{runId}` | One run |
| PATCH | `/{id}/runs/{runId}` | Client progress (`currentNodeId`, status, error) |
| DELETE | `/{id}/runs/{runId}` | Delete one run |
| POST | `/{id}/runs/clear` | Delete all runs for the workflow |
| GET | `/{id}/runs/{runId}/outputs` | Step outputs |
| POST | `/{id}/runs/{runId}/outputs` | Save a step output |
| GET | `/library` | Shared RAG library |
| POST | `/library/{key}` | Promote a step output into the library (`runId`, `outputId`) |
| GET | `/trigger-pending` | Pending runs for the browser poller |
| POST | `/trigger-pending/{workflowId}/ack` | Dequeue after the client starts walking |

Handler: `Neo_Pulse_App_Workflows_Route_Handlers`. Client: `src/lib/workflow/workflow-api.ts`.

## Graph model

Workflow `status`: `draft` | `published`. New rows are `draft`.

Run `status`: `queued` → `running` → `done` | `failed` | `cancelled`.

Node/edge contract (`src/lib/workflow/workflow-types.ts`):

| Field | Shape |
| --- | --- |
| `WorkflowNode` | `id`, `kind`, `label`, `config`, `position: { x, y }` |
| `WorkflowEdge` | `id`, `source`, `target`, optional `sourceHandle` |
| `WorkflowRagVariable` | `key`, `nodeId`, `scope` (`run` \| `agent` \| `shared`), `label` |

`kind` values: `workflow_client`, `trigger_calendar`, `trigger_gsc`, `trigger_document`, `trigger_manual`, `trigger_agent_done`, `action_agent`, `path_rules`, `rag_archive`.

PHP stores `nodes` / `edges` as JSON arrays. It does not validate node schema.

## Who starts a run

| Trigger | Server entry |
| --- | --- |
| Hourly cron | `Neo_Pulse_App_Workflow_Trigger_Cron` → `evaluate_team` |
| Calendar / GSC on **published** graphs | `Workflow_Trigger_Evaluator::evaluate_workflow` |
| Task file upload | `on_document_received` |
| Agent run reaches `done` | `Workflow_Trigger_Agent_Done::on_agent_run_terminal` |
| Editor Test / Run | `POST …/runs` with `trigger_manual` |

`enqueue` writes a run row, then `workflow-trigger-pending.json` under the team data dir.

## Browser execution

`useWorkflowTriggerRunner` (mounted from `agent-runs-context.tsx`) polls `GET …/trigger-pending` every 15s, calls `executeWorkflowRun` (`src/lib/workflow/workflow-runner.ts`), then acks.

The walker handles `path_rules`, `action_agent` (starts an agent run with `source: "workflow"`), and `rag_archive`. There is no PHP graph executor.

A test run from the editor (`simulated: true`) still depends on this poller.

## Pitfalls

- Closing the tab stops client-mode graph walks. Pending rows stay until another signed-in session polls.
- Unpublished (`draft`) graphs are ignored by cron / GSC / calendar evaluators.
- Recipe automations and workflow graphs are different tables. Installing a recipe does not create a `neo_pulse_workflows` row unless the UI uses **install as workflow**.
