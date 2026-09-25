import { describe, expect, it } from "vitest";
import { MANAGER_NAV_SECTIONS } from "@/components/manager/manager-nav-sections";

describe("social nav tabs", () => {
  it("exposes GBP, SMM Posts, and Creator under Social", () => {
    const social = MANAGER_NAV_SECTIONS.find((section) => section.id === "social");
    expect(social).toBeDefined();
    const values = social!.items.map((item) => item.value);
    expect(values).toEqual(["gbp-post", "content-calendar", "social-creator"]);
  });

  it("labels SMM Posts and Creator distinctly", () => {
    const social = MANAGER_NAV_SECTIONS.find((section) => section.id === "social");
    const labels = Object.fromEntries(social!.items.map((item) => [item.value, item.label]));
    expect(labels["content-calendar"]).toBe("SMM Posts");
    expect(labels["social-creator"]).toBe("Creator");
  });
});

function resolveLegacyContentCreatorHash(hashTab: string | null): string | null {
  if (hashTab === "content-creator") return "content-calendar";
  return hashTab;
}

describe("content-creator hash migration", () => {
  it("maps legacy content-creator hash to content-calendar", () => {
    expect(resolveLegacyContentCreatorHash("content-creator")).toBe("content-calendar");
    expect(resolveLegacyContentCreatorHash("social-creator")).toBe("social-creator");
    expect(resolveLegacyContentCreatorHash("content-calendar")).toBe("content-calendar");
  });
});
