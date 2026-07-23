import { cn } from "@/lib/utils";
import { resolvePresence, type VisiblePresence } from "@/hooks/usePresence";

const styles: Record<VisiblePresence, string> = {
  online: "bg-emerald-400",
  away: "bg-amber-400",
  busy: "bg-rose-500",
  offline: "bg-slate-500",
};
const labels: Record<VisiblePresence, string> = {
  online: "On-line",
  away: "Ausente",
  busy: "Ocupado",
  offline: "Off-line",
};

export function PresenceBadge({
  status,
  lastSeenAt,
  compact = false,
}: {
  status?: string | null;
  lastSeenAt?: string | null;
  compact?: boolean;
}) {
  const visible = resolvePresence(status, lastSeenAt);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-full", styles[visible])} />
      {!compact && labels[visible]}
    </span>
  );
}
