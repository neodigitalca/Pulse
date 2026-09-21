import { WorkspacePill } from "@/components/shared/WorkspacePill";
import type { ArticleStyle } from "@/lib/content-generation/article-length-policy";

export type ArticleStylePillsProps = {
  value: ArticleStyle;
  onChange: (style: ArticleStyle) => void;
  disabled?: boolean;
  square?: boolean;
};

export function ArticleStylePills({
  value,
  onChange,
  disabled = false,
  square = true,
}: ArticleStylePillsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Article style">
      <WorkspacePill
        label="Standard"
        active={value === "standard"}
        disabled={disabled}
        square={square}
        onClick={() => onChange("standard")}
      />
      <WorkspacePill
        label="ASAP"
        active={value === "asap"}
        disabled={disabled}
        square={square}
        onClick={() => onChange("asap")}
      />
    </div>
  );
}
