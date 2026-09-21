---
title: Task Manager execute
slug: agent-runs/task-manager-execute
section: Agent runs
order: 20
---

<!-- manual -->

## Execute with agent

Shown on task detail when the task is assigned to Pulse AI and has a supported `executionKind`. Payload rules:

- `content_optimizer` / `content_optimizer_meta`: `targetBucket` or `targetUrls` (or `targetUrl` of `ALL`)
- `gsc_reporting`: `comparePreset` `mom` or `yoy`
- `post_creator`: `postCount` ≥ 1
- `local_dominator_export`: `businessName` and `keyword`

Clicking **Execute with agent**:

1. Calls `POST /api/teams/{teamId}/tasks/tasks/{taskId}/execute`
2. Creates an AgentRun with `source: task_manager` and `taskId`
3. Opens the **Agents** tab in the right sidebar
4. The matching harness runs. Optimizer/reporting/export kinds use `clientRunContract` when preflight returns `awaiting_client`. Post creator uses server mode.

Pulse execution updates the linked task to `in_progress` during preflight. It does **not** auto-mark the task `done` when the agent run finishes; mark the task complete manually in Task Manager.

## Payload fields

```json
{
  "executionKind": "content_optimizer",
  "executionPayload": {
    "targetUrl": "https://example.com/page/",
    "updateMode": "update",
    "optimizationOptions": {
      "optimizeContent": true,
      "optimizeMeta": true,
      "useAcfKeyword": true
    }
  }
}
```

## Tool layer (planned)

Future work will classify task title/description/templates into `executionKind` + `executionPayload` automatically. v1 requires explicit payload on the task.
