---
title: Pulse Forge overview
slug: pulse-forge/overview
section: Pulse Forge
order: 0
---

<!-- manual -->

**Pulse Forge** is the Teams workspace for recipe install, installed automations, and the **workflow graph** editor. It is not Task Manager. Tasks keeps manual projects and My Tasks only.

## UI routes

Hash parser: [`src/lib/pulse-forge/pulse-forge-hash.ts`](../../../src/lib/pulse-forge/pulse-forge-hash.ts).

| Hash | Section |
|------|---------|
| `#pulse-forge` or `#pulse-forge/forge` | Forge dashboard |
| `#pulse-forge/recipes` | Recipe library |
| `#pulse-forge/recipes/{keyword}` | Recipe builder |
| `#pulse-forge/workflows` | Workflow list |
| `#pulse-forge/workflows/new` | New graph |
| `#pulse-forge/workflows/{id}` | Edit graph (`id` is a positive integer) |

Legacy `#pulse-forge/automations` is rewritten to `#pulse-forge/workflows`.

## Two automation models

| Model | What it is | Docs |
|-------|------------|------|
| **Recipes** | WHEN/THEN JSON templates installed as `isAutomation: true` task projects | [Automation recipes](../automation-recipes/overview.md) |
| **Workflows** | Team-owned node/edge graphs (`draft` / `published`) with runs and step outputs | [Workflows API](workflows.md) |

Recipes install through `POST /api/teams/{teamId}/tasks/projects`. Workflows use `/api/teams/{teamId}/workflows/*`.

## Related UI

- Shell: `src/components/manager/pulse-forge/`
- Recipe catalog on disk: `wordpress-plugins/neo-pulse-app/recipes/`
- Agent jobs spawned from Task Manager / Pulse Assist: [Agent runs](../agent-runs/overview.md)

## Auth

Workflow routes require an **active team member**. Others get `403 { "ok": false, "error": "Forbidden" }`.
