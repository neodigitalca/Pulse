---
title: Pulse Forge workflows
slug: pulse-forge/workflows
section: Pulse Forge
order: 10
---

<!-- manual -->

A workflow is a directed graph: one trigger, optional path rules, agent actions, and RAG archive nodes. The PHP API stores the graph. The **browser** walks it and starts AgentRuns.

## Node kinds

| `kind` | Role |
| --- | --- |
| `workflow_client` | Site list (`config.siteIds`). First id becomes the run `siteId` when the workflow row has no `wordpressSiteId`. |
| `trigger_calendar` | Schedule (frequency, `startDate`, `time`, optional recurrence) |
| `trigger_gsc` | GSC signal + `targetBucket` |
| `trigger_document` | File / KB / email match |
| `trigger_manual` | Run from the editor |
| `trigger_agent_done` | After another agent recipe finishes |
| `action_agent` | `executionKind` + `executionPayload` |
| `path_rules` | Branch on GSC signal, agent field, document, time window, or variable |
| `rag_archive` | Copy the last step output into a named variable |

Statuses: `draft` or `published`. Runs: `queued` → `running` → `done` | `failed` | `cancelled`.

## How a run starts

1. `POST /api/teams/{teamId}/workflows/{id}/runs` with optional `{ "simulated": true, "triggerPayload": {} }`.
2. PHP `Neo_Pulse_App_Workflow_Trigger_Evaluator::enqueue` writes a pending row.
3. `useWorkflowTriggerRunner` polls `GET .../workflows/trigger-pending` every 15 seconds while the app is open.
4. `executeWorkflowRun` walks from the trigger along outgoing edges.
5. Each `action_agent` starts an AgentRun with `source: "workflow"`.
6. The runner waits until that AgentRun is terminal (up to 120 polls at 2 seconds), then stores a step output.
7. `POST .../trigger-pending/{workflowId}/ack` dequeues the pending item.

The poller only runs in an open browser tab. Calendar and GSC triggers that enqueue while nobody is logged in stay pending until the next poll.

`path_rules` picks the first matching branch (`match: all` or `any`). If none match, it uses handle `default`, then any outgoing edge.

## Action payload

```json
{
  "teamId": 1,
  "source": "workflow",
  "recipeKey": "local_dominator_export",
  "title": "Export Local Dominator grid CSV",
  "context": {
    "siteId": "site-uuid",
    "workflowId": 12,
    "workflowRunId": 44,
    "workflowNodeId": "action-1"
  },
  "plan": {
    "executionKind": "local_dominator_export",
    "executionPayload": {
      "businessName": "Advance Blinds & Drapery",
      "keyword": "blinds near me",
      "saveLocalArchive": true
    },
    "workflowRunId": 44,
    "workflowNodeId": "action-1"
  }
}
```

`recipeKey` comes from `taskExecutionKindToRecipe`. Unknown kinds are skipped (`buildActionPayload` returns null and the run fails with `Invalid action node`).

If the action has `compiledTaskId` **and** the caller passed `startRunFromTask`, the runner loads that task and merges payloads. The default poller does not pass `startRunFromTask`, so it uses `startRun` from the node config.

## Compile to tasks (optional)

`compileWorkflowTasks` creates a private automation project titled `{name} (workflow runtime)` and one task per `action_agent`. It stores `compiledTaskId` on the node. Publish does not compile automatically. The editor must call compile if you want Task Manager rows.

## Routes

All routes require a signed-in team member. Prefix: `/api/teams/{teamId}/workflows`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | List workflows |
| POST | `/` | Create (`name` required) |
| GET | `/{id}` | One workflow |
| PATCH | `/{id}` | Update graph, or `{ "clearRuns": true }` |
| DELETE | `/{id}` | Delete |
| POST | `/{id}/publish` | Set `published` |
| GET | `/{id}/runs` | List runs |
| POST | `/{id}/runs` | Enqueue a run |
| GET | `/{id}/runs/{runId}` | One run |
| PATCH | `/{id}/runs/{runId}` | Status / `{ "delete": true }` |
| DELETE | `/{id}/runs/{runId}` | Delete one run |
| POST | `/{id}/runs/clear` | Delete all runs |
| GET / POST | `/{id}/runs/{runId}/outputs` | Step outputs |
| GET | `/library` | Shared library entries |
| POST | `/library/{key}` | Promote an output (`runId`, `outputId`) |
| GET | `/trigger-pending` | Pending dispatches |
| POST | `/trigger-pending/{workflowId}/ack` | Dequeue |

Create body:

```json
{
  "name": "Monthly grid export",
  "description": "Export LD grid then archive CSV",
  "wordpressSiteId": "site-uuid",
  "nodes": [],
  "edges": [],
  "ragVariables": []
}
```

## Constraints

- A workflow with no trigger node fails at execute (`Workflow has no trigger`).
- A trigger with no outgoing edge marks the run `done` immediately.
- Cycles are ignored (`visited` set). The walker does not re-enter a node.
- Step outputs are run-scoped. `rag_archive` copies the last output text and file refs.
- Agent files come from `getAgentRunHostedFiles` at complete time.

## Source code

| Area | Path |
| --- | --- |
| Types | `src/lib/workflow/workflow-types.ts` |
| Client API | `src/lib/workflow/workflow-api.ts` |
| Browser walker | `src/lib/workflow/workflow-runner.ts` |
| Poller | `src/hooks/use-workflow-trigger-runner.ts` |
| PHP handlers | `wordpress-plugins/neo-pulse-app/includes/workflows/class-workflows-route-handlers.php` |
