---
title: Pulse Forge overview
slug: pulse-forge/overview
section: Pulse Forge
order: 0
---

<!-- manual -->

**Pulse Forge** is the Teams workspace for SEO automations. Nav label is **Forge → Task Builder** (`managerTab: pulse-forge`). Hash routes live in `src/lib/pulse-forge/pulse-forge-hash.ts`.

## Modes

| Hash | UI | Backing data |
| --- | --- | --- |
| `#pulse-forge/forge` | My Forge dashboard (default; bare `#pulse-forge` rewrites here) | Installed automations + recent runs |
| `#pulse-forge/recipes` | Recipe library / planner | JSON catalog under `wordpress-plugins/neo-pulse-app/recipes/` |
| `#pulse-forge/workflows` | Graph editor | Team rows in `wp_neo_pulse_workflows` |
| `#pulse-forge/automations` | Legacy | Redirects to workflows |

Shell: `src/components/manager/pulse-forge/PulseForgeShell.tsx`. Workflow canvas: `src/components/manager/workflow/`.

## Two automation models

| | Recipes | Workflows |
| --- | --- | --- |
| Source | Recipe JSON + `POST /api/teams/{teamId}/tasks/projects` with `isAutomation: true` | `POST /api/teams/{teamId}/workflows` |
| Runtime | Task Manager projects (`executionKind` on tasks) | Graph walk in the **browser** after PHP enqueues a run |
| Docs | [Automation recipes](../automation-recipes/overview.md) | [Workflows](workflows.md) |

`PulseForgeShell.handleRecipeInstallAsWorkflow` can convert a recipe plan into a workflow graph (`automationPlanToWorkflowGraph`). Publishing a workflow compiles nodes back to automation tasks (`compileWorkflowTasks`).

## Related

- [Workflows API](workflows.md)
- [Agent runs](../agent-runs/overview.md) (right-sidebar Agents panel)
- [Local Dominator export](../local-dominator/overview.md)
