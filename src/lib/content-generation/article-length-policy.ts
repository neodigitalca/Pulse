/** Prompt-only article length policy for blog, SAP, and bulk CSV generation. */

import { stripHtmlToPlainText } from "@/lib/sitemap-optimizer/build-cluster-catalog-payload";

export const ARTICLE_MAX_WORDS = 2000 as const;

export const MAX_CHECKLIST_ITEMS_BLOG = 6 as const;

export const MAX_CHECKLIST_ITEMS_SAP = 7 as const;

export const ASAP_ARTICLE_MAX_CEILING = 1200 as const;

export const ASAP_ARTICLE_MIN = 350 as const;

export const MAX_CHECKLIST_ITEMS_BLOG_ASAP = 3 as const;

export const MAX_CHECKLIST_ITEMS_SAP_ASAP = 4 as const;

export type ArticleStyle = "standard" | "asap";

export type ResolveArticleMaxWordsInput = {
  existingContent?: string;
  isServiceArea?: boolean;
};

function clampWordCap(n: number): number {
  if (!Number.isFinite(n)) return ASAP_ARTICLE_MAX_CEILING;
  return Math.min(ASAP_ARTICLE_MAX_CEILING, Math.max(ASAP_ARTICLE_MIN, Math.round(n)));
}

export function estimatePlainWordCount(htmlOrText: string): number {
  const plain = stripHtmlToPlainText(htmlOrText);
  if (!plain.trim()) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

export function resolveArticleMaxWords(
  style: ArticleStyle,
  input: ResolveArticleMaxWordsInput = {},
): number {
  if (style !== "asap") return ARTICLE_MAX_WORDS;
  const existingWords = estimatePlainWordCount(input.existingContent ?? "");
  if (existingWords > 0) {
    return clampWordCap(existingWords * 0.75);
  }
  return ASAP_ARTICLE_MAX_CEILING;
}

export function buildAsapToneBlock(): string {
  return `--- ASAP COPY (NON-NEGOTIABLE) ---
- Straightforward, direct answers. No filler, throat-clearing, or marketing fluff.
- No restating the thesis in every section. Say it once, then move on.
- Merge overlapping topics. One H2 per distinct idea. **Max 1 H3** per H2 unless a list/table block requires it.
- Prefer **one short paragraph** per H2 when possible. No "In this section we will…" intros.
- Do not use "comprehensive", "exhaustive", "complete guide", or similar padding language.
--- END ASAP COPY ---`;
}

export function perSectionWordBudget(totalSections: number, articleMax = ARTICLE_MAX_WORDS): number {
  const n = Math.max(1, Math.floor(totalSections));
  return Math.floor(articleMax / n);
}

function checklistItemRange(isServiceArea: boolean, style: ArticleStyle): { label: string; maxItems: number } {
  if (style === "asap") {
    const maxItems = isServiceArea ? MAX_CHECKLIST_ITEMS_SAP_ASAP : MAX_CHECKLIST_ITEMS_BLOG_ASAP;
    const label = isServiceArea ? "3-4" : "2-3";
    return { label, maxItems };
  }
  const maxItems = isServiceArea ? MAX_CHECKLIST_ITEMS_SAP : MAX_CHECKLIST_ITEMS_BLOG;
  const label = isServiceArea ? "6-7" : "5-6";
  return { label, maxItems };
}

export function buildArticleLengthChecklistBlock(
  isServiceArea: boolean,
  style: ArticleStyle = "standard",
  articleMaxWords: number = ARTICLE_MAX_WORDS,
): string {
  const { label, maxItems } = checklistItemRange(isServiceArea, style);
  const modeLabel = isServiceArea ? "service area (SAP)" : "blog";
  const maxH3 = style === "asap" ? "1" : "2";
  const tableBudget = style === "asap" ? 1 : 2;
  const paragraphsPerH2 = style === "asap" ? "**1 paragraph**" : "**1-2 paragraphs**";

  return `--- ARTICLE LENGTH (NON-NEGOTIABLE) ---
**[ARTICLE LENGTH]**: Entire published article MUST NOT exceed ${articleMaxWords} words.
- Create **${label}** checklist items maximum for this ${modeLabel} (hard cap **${maxItems}** items including intro and conclusion).
- **DEPTH IN FEWER H2s**: Cover topics in fewer, tighter sections. One H2 per major topic. **MAX ${maxH3} H3s** per H2 (never 3-5). ${paragraphsPerH2} per H2; do not stack 2-3 paragraphs under every H3.
- **TABLE BUDGET**: Entire article gets **at most ${tableBudget}** [TABLE] section(s). Do not assign [TABLE] to every H2.
- **NO DUPLICATE TOPICS**: Never create two H2s for the same topic (e.g. "Dental Services Offered" and "Complete Dental Services"). Merge overlapping topics into one H2.
- Meet Rank Math, exact-primary-per-H2, and link requirements with **concise copy**, not extra sections or long walls of text.
${isServiceArea ? `- SAP mandatory blocks (What We Offer, We Care About, Next Steps) **count toward** the same ${articleMaxWords}-word budget. Merge overlapping topic H2s; keep the service table compact (top offerings only, short descriptions).` : ""}
${style === "asap" ? buildAsapToneBlock() : ""}
--- END ARTICLE LENGTH ---`;
}

export function buildFocusedArticlePurpose(
  keyword: string,
  style: ArticleStyle = "standard",
  articleMaxWords: number = ARTICLE_MAX_WORDS,
): string {
  const topic = keyword.trim() || "this topic";
  if (style === "asap") {
    return `Short, direct guide (max ${articleMaxWords} words) about ${topic}`;
  }
  return `Focused guide (max ${articleMaxWords} words) about ${topic}`;
}

export function buildBlueprintArticleLengthBlock(
  style: ArticleStyle = "standard",
  articleMaxWords: number = ARTICLE_MAX_WORDS,
): string {
  const perAgentTokens = style === "asap" ? "400-600" : "800-1000";
  return `--- ARTICLE LENGTH (BLUEPRINT) ---
- Total article cap: **${articleMaxWords} words**. Blueprint structure must fit this budget.
- Create **one agent per checklist item**; never exceed the checklist item count. Prefer **fewer agents with combined subtopics** over splitting into extra sections.
- Purpose field: frame as a **focused guide (max ${articleMaxWords} words)** only. Never use "comprehensive", "exhaustive", or "complete guide" wording.
- Each agent.title becomes the exact <h2> text. One agent = one H2 = one harness call. Never duplicate agent titles.
- Per-agent prose: keep descriptions and features oriented to **short sections** (instructional maxTokens ~${perAgentTokens} per agent).
- Do not inflate depth with extra H3 agents; main topics stay H2 (headingLevel: 1).
${style === "asap" ? buildAsapToneBlock() : ""}
--- END ARTICLE LENGTH ---`;
}

export function buildHarnessArticleBudgetBlock(
  sectionIndex: number,
  totalSections: number,
  articleMaxWords: number = ARTICLE_MAX_WORDS,
): string {
  const total = Math.max(1, Math.floor(totalSections));
  const base = perSectionWordBudget(total, articleMaxWords);
  const isFirst = sectionIndex === 0;
  const isLast = sectionIndex === total - 1;
  const minSection = articleMaxWords <= ASAP_ARTICLE_MAX_CEILING ? 120 : 180;
  const target =
    isFirst || isLast ? Math.max(minSection, Math.floor(base * 0.85)) : base;

  return `**ARTICLE WORD BUDGET**: Full article cap is **${articleMaxWords} words** (${total} section(s)). Target **~${target} words** for this section. Stay within budget; do not compensate with length in other sections.`;
}

export function buildHarnessArticleCapLine(
  totalSections: number,
  articleMaxWords: number = ARTICLE_MAX_WORDS,
): string {
  const total = Math.max(1, Math.floor(totalSections));
  const perSection = perSectionWordBudget(total, articleMaxWords);
  return `**FULL ARTICLE CAP**: ${articleMaxWords} words across ${total} section(s) (~${perSection} words per section on average). Write concisely.`;
}

export type ArticleLengthPromptContext = {
  style?: ArticleStyle;
  articleMaxWords?: number;
  existingContent?: string;
  isServiceArea?: boolean;
};

/** Resolve style + word cap once per run/row for prompt builders. */
export function resolveArticleLengthPromptContext(
  style: ArticleStyle | undefined,
  input: ResolveArticleMaxWordsInput = {},
): { style: ArticleStyle; articleMaxWords: number } {
  const effectiveStyle: ArticleStyle = style === "asap" ? "asap" : "standard";
  const articleMaxWords = resolveArticleMaxWords(effectiveStyle, input);
  return { style: effectiveStyle, articleMaxWords };
}
