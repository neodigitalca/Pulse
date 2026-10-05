# Article style: Standard vs ASAP

Prompt-only length policy for Overview optimize, Generator bulk, and blog/SAP bodies. Caps live in `src/lib/content-generation/article-length-policy.ts`. The model is instructed; the app does not hard-truncate published HTML.

## Values

`ArticleStyle` is `"standard"` | `"asap"`. Legacy stored value `"quick"` reads as `"asap"`.

| | Standard | ASAP |
| --- | --- | --- |
| Word cap | 2000 | 1200 ceiling, 350 floor. If the URL already has body copy, cap is `clamp(existingWords * 0.75)` |
| Blog checklist items | 5–6 (max 6) | 2–3 (max 3) |
| SAP checklist items | 6–7 (max 7) | 3–4 (max 4) |
| H3s per H2 | max 2 | max 1 |
| Tables | at most 2 | at most 1 |
| Paragraphs per H2 | 1–2 | 1 |
| Blueprint agent tokens | ~800–1000 | ~400–600 |

ASAP also injects a tone block: no filler, no "comprehensive / complete guide" padding, merge overlapping H2s.

## Surfaces

| Surface | Control | Persistence |
| --- | --- | --- |
| Overview Content toolbar | **Standard / ASAP** pills plus AISEO → Content → **Polish → Short** | Per site: `optimization_mode_{siteId}` via `saveArticleStyle` |
| Bulk CSV / Prompt Generator | `ArticleStylePills` | `generator_article_style` |
| Optimization settings popover | Same pills | Per-site `optimization_mode_{siteId}` |
| Content optimizer / blog template | Reads `optimizationOptions.articleStyle` or per-site stored style | Same keys |
| Recipe `seo-autopilot-flywheel` | `optimizationOptions.articleStyle: "asap"` in JSON | Recipe file |

## Polish → Short

`overview-bulk-action-clusters.ts` submenu `content-polish` / child `polish-short`:

1. Sets style to `asap` (`onArticleStyleChange`).
2. On **Posts** and **SAP**, also runs `handleOptimizeAll({ articleStyle: "asap" })`.
3. On **Pages**, it only switches the style. It does not start a bulk optimize.

Polish is shown on Pages, Posts, and SAP (`overview-bulk-polish-menu.test.ts`).

## Wiring

- Resolve once per run: `resolveArticleLengthPromptContext`.
- Overview batch: `use-overview-tab-research-pipelines.ts` `handleOptimizeAll`.
- Bulk rows: `src/lib/bulk-auto-generate.ts`.
- Task payload field: `articleStyle?: "standard" | "asap"` in `src/lib/tasks-types.ts`.

## Pitfall

Changing the pill does not rewrite already-generated drafts. Re-run optimize / generate after switching style.
