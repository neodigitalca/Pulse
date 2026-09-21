---
title: Pulse Forge overview
slug: pulse-forge/overview
section: Pulse Forge
order: 0
---

<!-- manual -->

**Pulse Forge** is the team automation workspace. It installs recipe templates, edits WHEN/THEN plans, and runs graph workflows that dispatch **AgentRun** jobs.

Open it from **Manager → Pulse Forge** (hash `#pulse-forge/forge`). Tasks stays on manual projects and My Tasks.

## Sections

| Nav label | Hash | Purpose |
| --- | --- | --- |
| **My Forge** | `#pulse-forge/forge` | Installed automations, live/demo usage |
| **Agents** | `#pulse-forge/recipes` | Recipe catalog and planner |
| **Workflows** | `#pulse-forge/workflows` | Graph editor, runs, pending triggers |

Bare `#pulse-forge` rewrites to `#pulse-forge/forge`. Legacy `#pulse-forge/automations` rewrites to `#pulse-forge/workflows`.

### Recipe and workflow hashes

| Hash | View |
| --- | --- |
| `#pulse-forge/recipes/{keyword}` | Recipe planner (`TaskBuilderView` mode `recipe`) |
| `#pulse-forge/workflows/new` | New workflow |
| `#pulse-forge/workflows/{id}` | Edit saved workflow |

## Recipes vs workflows vs automations

| Object | Storage | How you create it |
| --- | --- | --- |
| **Recipe** | JSON under `wordpress-plugins/neo-pulse-app/recipes/` | Catalog only. See [Automation recipes](../automation-recipes/overview). |
| **Automation project** | Task project with `isAutomation: true` | Install a recipe via `POST /api/teams/{teamId}/tasks/projects`. |
| **Workflow** | `{prefix}neo_pulse_workflows` via `/api/teams/{teamId}/workflows` | New graph, or **Install as workflow** from a recipe. |

Installing a recipe as a workflow compiles the WHEN/THEN plan through `recipeToPlan` then `automationPlanToWorkflowGraph`. That creates a workflow record, not a task project.

Private automations (`automationVisibility: private`) show only to the creating user. Public automations show to the team. See `src/lib/pulse-forge/forge-automation-visibility.ts`.

## Schedule panel

`PulseForgePostSchedulePanel` writes `executionPayload` schedule fields used by post creator, GSC reporting, and Local Dominator export.

| Field | Constraint |
| --- | --- |
| `scheduleCustomStartDate` | Local calendar date `YYYY-MM-DD` |
| `scheduleStartTime` | `HH:MM` (default `09:00`) |
| `scheduleFrequency` | Same frequencies as Generator bulk schedule |
| Destination | Depends on `executionKind` |

Destination modes (`src/lib/schedule-output-destination.ts`):

| `executionKind` | Destinations |
| --- | --- |
| `post_creator` | scheduled, draft, local, email |
| `gsc_reporting` | local, scheduled (label **WordPress**), email |
| `local_dominator_export` | local only (`saveLocalArchive` defaults true) |

Email destination also sets `saveLocalArchive: true`.

## Dispatch

Forge actions become **AgentRun** records:

| Source | `source` field | Executor |
| --- | --- | --- |
| Pulse Assist Build | `pulse_assist` | Client or server harness |
| Task **Execute** | `task_manager` | Client harness + `clientRunContract` |
| Workflow graph | `workflow` | Browser runner, then harness |

See [Agent runs](../agent-runs/overview) and [Workflows](workflows).

## Source code

| Area | Path |
| --- | --- |
| Shell and hash | `src/components/manager/pulse-forge/`, `src/lib/pulse-forge/pulse-forge-hash.ts` |
| Recipe planner | `src/components/manager/tasks/planner/` |
| Workflow UI | `src/components/manager/workflow/` |
| Workflow API + runner | `src/lib/workflow/` |
| PHP routes | `wordpress-plugins/neo-pulse-app/includes/workflows/` |
