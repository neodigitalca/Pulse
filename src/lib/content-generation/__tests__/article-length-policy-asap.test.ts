import { describe, expect, it } from "vitest";
import {
  ASAP_ARTICLE_MAX_CEILING,
  ARTICLE_MAX_WORDS,
  buildArticleLengthChecklistBlock,
  resolveArticleMaxWords,
} from "@/lib/content-generation/article-length-policy";

describe("article-length-policy ASAP", () => {
  it("resolveArticleMaxWords keeps standard at 2000", () => {
    expect(resolveArticleMaxWords("standard")).toBe(ARTICLE_MAX_WORDS);
  });

  it("resolveArticleMaxWords scales down from existing body for asap", () => {
    const html = `<p>${Array.from({ length: 800 }, () => "word").join(" ")}</p>`;
    const cap = resolveArticleMaxWords("asap", { existingContent: html });
    expect(cap).toBeLessThan(ARTICLE_MAX_WORDS);
    expect(cap).toBeGreaterThan(300);
  });

  it("resolveArticleMaxWords uses ceiling for new posts", () => {
    expect(resolveArticleMaxWords("asap", {})).toBe(ASAP_ARTICLE_MAX_CEILING);
  });

  it("ASAP checklist block uses lower caps", () => {
    const asap = buildArticleLengthChecklistBlock(false, "asap", 900);
    expect(asap).toContain("900");
    expect(asap).toContain("2-3");
    expect(asap).toContain("ASAP COPY");
    expect(asap).toContain("at most 1");
  });
});
