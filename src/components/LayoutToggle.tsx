import { LayoutGrid, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LayoutMode = "standard" | "compact";

interface LayoutToggleProps {
  value: LayoutMode;
  onChange: (value: LayoutMode) => void;
}

const LayoutToggle = ({ value, onChange }: LayoutToggleProps) => {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-secondary/40 p-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onChange("standard")}
        className={cn(
          "h-8 w-8",
          value === "standard" && "bg-primary/10 text-primary"
        )}
        aria-label="Layout padrão"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onChange("compact")}
        className={cn(
          "h-8 w-8",
          value === "compact" && "bg-primary/10 text-primary"
        )}
        aria-label="Layout compacto"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default LayoutToggle;
