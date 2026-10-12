# Article style: Standard vs ASAP

Pulse content generation has two prompt styles: **`standard`** and **`asap`**. Style only changes length and tone instructions. It does not change which URLs run or which WordPress site is selected.

Source of truth: [`src/lib/content-generation/article-length-policy.ts`](../src/lib/content-generation/article-length-policy.ts).

## Intent

| Style | Word cap | Checklist items (blog / SAP) | Tone |
|-------|----------|------------------------------|------|
| `standard` | 2000 | 5-6 / 6-7 (hard cap 6 / 7) | Focused guide |
| `asap` | 1200 ceiling (min 350) | 2-3 / 3-4 (hard cap 3 / 4) | Short, direct, no filler |

ASAP also tightens structure: max 1 H3 per H2, 1 paragraph per H2, at most 1 table, 400-600 tokens per blueprint agent (standard uses 800-1000).

When ASAP runs against existing HTML, the cap is `clamp(existingWordCount * 0.75, 350, 1200)`. Empty or new copy uses 1200.

## Where it is set

| Surface | Control | Storage |
|---------|---------|---------|
| Generator → Opt (Content) | AISEO → Content → **Polish → Short** | Per-site `localStorage` key `optimization_mode_{siteId}` |
| Generator CSV / Prompt headers | **Standard** / **ASAP** pills | Global `localStorage` key `generator_article_style` |
| Optimization settings popover | Same pills | Per-site `optimization_mode_{siteId}` |

Legacy stored values: `quick` → `asap`, `full` → `standard` ([`optimization-settings-storage.ts`](../src/lib/optimization-settings-storage.ts)).

Default is `standard` when nothing is stored.

## Polish → Short (Overview / Opt)

[`buildOverviewBulkActionClusters`](../src/lib/overview/overview-bulk-action-clusters.ts):

- Polish is on **Pages, Posts, and SAP**.
- **Short** writes `asap` into site options and `localStorage`.
- On **Posts and SAP**, Short also calls `handleOptimizeAll({ articleStyle: "asap" })`.
- On **Pages**, Short only stores the style. The Content optimize action is hidden for the Pages sitemap source.

`handleOptimizeAll` resolves style as: run option → in-memory site options → `getArticleStyle(siteId)` ([`use-overview-tab-research-pipelines.ts`](../src/hooks/overview/use-overview-tab-research-pipelines.ts)).

The Vite starter prints: `Opt → AISEO → Content → Polish → Short`.

## Prompt injection

Style is resolved once per run/row (`resolveArticleLengthPromptContext`) and injected into:

- Checklist / length block (`buildArticleLengthChecklistBlock`)
- Blueprint length block (`buildBlueprintArticleLengthBlock`)
- Per-section harness budget (`buildHarnessArticleBudgetBlock`)
- Article purpose line (`buildFocusedArticlePurpose`)

ASAP adds the `ASAP COPY (NON-NEGOTIABLE)` tone block. Task payloads may include `articleStyle` ([`src/lib/tasks-types.ts`](../src/lib/tasks-types.ts)).

## Constraints

- Style is prompt-only. It does not post-truncate published HTML.
- Bulk Content on Pages is not started from Polish → Short.
- Generator pills and Opt site style are separate keys. Changing one does not rewrite the other.
- Recipes that run content optimize inherit whatever style the executor reads from storage or the task payload.

## Related tests

- [`src/lib/content-generation/__tests__/article-length-policy-asap.test.ts`](../src/lib/content-generation/__tests__/article-length-policy-asap.test.ts)
- [`src/lib/overview/__tests__/overview-bulk-polish-menu.test.ts`](../src/lib/overview/__tests__/overview-bulk-polish-menu.test.ts)
