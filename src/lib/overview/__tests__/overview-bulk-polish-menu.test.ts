import { describe, expect, it, vi } from "vitest";
import { buildOverviewBulkActionClusters } from "@/lib/overview/overview-bulk-action-clusters";
import type { OverviewTabController } from "@/hooks/overview/use-overview-tab-controller";

function stubController(sitemapSource: "pages" | "posts" | "sap"): OverviewTabController {
  return {
    sitemapSource,
    site: { id: "site-1" } as OverviewTabController["site"],
    displayRows: [{ url: "https://example.com/a" }],
    bulkActionProgress: {},
    opt: { isOptimizingContent: {}, bulkOptimizationState: {} },
    handleOptimizeAll: vi.fn(),
  } as unknown as OverviewTabController;
}

function findPolish(items: ReturnType<typeof buildOverviewBulkActionClusters>[0]["items"]) {
  return items.find((i) => i.kind === "submenu" && i.id === "content-polish");
}

describe("buildOverviewBulkActionClusters Polish menu", () => {
  it("includes Polish on Pages, Posts, and SAP", () => {
    for (const source of ["pages", "posts", "sap"] as const) {
      const clusters = buildOverviewBulkActionClusters(stubController(source), {
        hasDetectedSitemaps: true,
        bulkWorkspaceBusy: false,
        articleStyle: "standard",
        onArticleStyleChange: vi.fn(),
      });
      const aiseo = clusters.find((c) => c.id === "aiseo");
      const polish = findPolish(aiseo!.items);
      expect(polish, source).toBeDefined();
      expect(polish?.kind === "submenu" && polish.children[0]?.label).toBe("Short");
    }
  });
});
