---
title: Agent run recipes
slug: agent-runs/recipes
section: Agent runs
order: 10
---

<!-- manual -->

Recipes map to existing client harnesses. Registration happens in the SPA (`registerAgentRunHarness`).

| `recipeKey` | Title | Harness |
| --- | --- | --- |
| `overview_pages_meta_batch` | Pages bucket meta batch | Overview AI all-meta harness (pages sitemap). Default registry is a stub that tells you to open Overview. |
| `content_optimizer_bulk` | Content optimization batch | Content Optimizer bulk or task `clientRunContract`. Default registry is a stub. |
| `gsc_reporting` | GSC reporting | `runGscReportingDirectHarness` |
| `post_creator` | Post creator | `runPostCreatorDirectHarness` (server worker for task executions) |
| `local_dominator_export` | Local Dominator grid export | `runLocalDominatorExportDirectHarness` / client harness. See [Local Dominator](../local-dominator/overview). |

Task executions with `executionKind: content_optimizer` dispatch `content_optimizer_bulk` with `plan.clientRunContract` from `POST /api/teams/{id}/tasks/tasks/{taskId}/execute`.

Meta-only task runs (`content_optimizer_meta`) may complete on the server during preflight; the agent run is marked done without a client harness.
