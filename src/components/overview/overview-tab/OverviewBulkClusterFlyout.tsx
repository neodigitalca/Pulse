import React from "react";
import { ChevronRight } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BULK_HEADER_TOOL_BTN } from "@/components/keyword-research/bulk/bulk-workspace-header-styles";
import { cn } from "@/lib/utils";
import type {
  OverviewBulkActionCluster,
  OverviewBulkClusterItem,
} from "@/lib/overview/overview-bulk-action-clusters";
import { groupOverviewClusterItemsIntoColumns } from "@/lib/overview/overview-bulk-action-clusters";

/** Per-column neutral greys — edge-to-edge, 0% saturation. */
const MEGA_MENU_COLUMN_GREYS = [
  "bg-[hsl(0,0%,8%)]",
  "bg-[hsl(0,0%,13%)]",
  "bg-[hsl(0,0%,18%)]",
] as const;

function ClusterFlyoutSubmenuItem({
  item,
  onClose,
}: {
  item: Extract<OverviewBulkClusterItem, { kind: "submenu" }>;
  onClose: () => void;
}) {
  const [subOpen, setSubOpen] = React.useState(false);

  return (
    <HoverCard open={subOpen} onOpenChange={setSubOpen} openDelay={80} closeDelay={120}>
      <HoverCardTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          disabled={item.disabled}
          className={cn(
            "h-9 w-full justify-start rounded-none px-2.5 text-base font-normal hover:bg-black hover:text-white",
          )}
          aria-haspopup="menu"
          aria-expanded={subOpen}
        >
          <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        side="right"
        sideOffset={0}
        className="w-auto min-w-[9.5rem] overflow-hidden rounded-none border-0 bg-[hsl(0,0%,13%)] p-0 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <ul className="flex flex-col py-1.5" role="menu" aria-label={item.label}>
          {item.children.map((child) => (
            <li key={child.id} role="none">
              <Button
                type="button"
                variant="ghost"
                disabled={child.disabled}
                className={cn(
                  "h-9 w-full justify-start rounded-none px-2.5 text-base font-normal hover:bg-black hover:text-white",
                  child.emphasize &&
                    "bg-primary text-black hover:bg-black hover:text-white",
                )}
                onClick={() => {
                  if (child.disabled) return;
                  child.onSelect();
                  if (child.closeOnSelect !== false) {
                    setSubOpen(false);
                    onClose();
                  }
                }}
              >
                <span className="min-w-0 flex-1 truncate text-left">{child.label}</span>
              </Button>
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}

function ClusterFlyoutItem({
  item,
  onClose,
}: {
  item: OverviewBulkClusterItem;
  onClose: () => void;
}) {
  if (item.kind === "submenu") {
    return <ClusterFlyoutSubmenuItem item={item} onClose={onClose} />;
  }

  if (item.kind === "checkbox") {
    return (
      <label
        className={cn(
          "flex min-h-9 cursor-pointer items-center gap-2 rounded-none px-2 py-1.5 text-base",
          item.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-black hover:text-white",
        )}
      >
        <Checkbox
          checked={item.checked}
          disabled={item.disabled}
          onCheckedChange={(v) => item.onCheckedChange(v === true)}
          aria-label={item.label}
        />
        <span className="min-w-0 flex-1">{item.label}</span>
      </label>
    );
  }

  if (item.kind !== "action") {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={item.disabled}
      className={cn(
        "h-9 w-full justify-start rounded-none px-2.5 text-base font-normal hover:bg-black hover:text-white",
        item.emphasize &&
          "bg-primary text-black hover:bg-black hover:text-white",
      )}
      onClick={() => {
        if (item.disabled) return;
        item.onSelect();
        if (item.closeOnSelect !== false) onClose();
      }}
    >
      <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
      {item.trailing ? (
        <span className="shrink-0 tabular-nums text-sky-400">{item.trailing}</span>
      ) : null}
    </Button>
  );
}

export function OverviewBulkClusterFlyout({
  cluster,
  workspaceBusy,
}: {
  cluster: OverviewBulkActionCluster;
  workspaceBusy: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const columns = React.useMemo(
    () => groupOverviewClusterItemsIntoColumns(cluster.items),
    [cluster.items],
  );
  const uiGitSha = (import.meta.env.VITE_DEPLOY_GIT_SHA as string | undefined)?.trim() ?? "";

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          disabled={workspaceBusy}
          className={cn(
            BULK_HEADER_TOOL_BTN,
            workspaceBusy && "pointer-events-none opacity-50",
          )}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {cluster.label}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="w-auto max-w-[min(calc(100vw-2rem),42rem)] overflow-hidden rounded-none border-0 bg-transparent p-0 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex flex-row items-stretch"
          role="menu"
          aria-label={cluster.label}
        >
          {columns.map((column, columnIndex) => (
            <div
              key={column.id}
              className={cn(
                "flex min-w-[9.5rem] flex-1 flex-col self-stretch pb-1.5",
                MEGA_MENU_COLUMN_GREYS[columnIndex % MEGA_MENU_COLUMN_GREYS.length],
              )}
              role="group"
              aria-label={column.label}
            >
              {column.label ? (
                <div
                  className="mb-1 w-full bg-black px-2.5 py-1.5 text-base font-medium text-white"
                  role="presentation"
                >
                  {column.label}
                </div>
              ) : null}
              <ul className="flex flex-col">
                {column.items.map((item) => (
                  <li key={item.id} role="none">
                    <ClusterFlyoutItem item={item} onClose={() => setOpen(false)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {cluster.id === "aiseo" && uiGitSha ? (
          <div
            className="border-t border-white/10 bg-black px-2.5 py-1 font-mono text-base text-white/50"
            title="UI git commit (dev/build)"
          >
            ui {uiGitSha.length > 7 ? uiGitSha.slice(0, 7) : uiGitSha}
          </div>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  );
}
