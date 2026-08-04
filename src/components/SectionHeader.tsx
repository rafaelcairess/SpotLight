/**
 * Componente compartilhado (SectionHeader).
 */

import { Link } from "react-router-dom";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
  actions?: ReactNode;
}

const SectionHeader = ({
  title,
  subtitle,
  icon: Icon,
  actionLabel,
  actionHref,
  className,
  actions,
}: SectionHeaderProps) => {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col items-start justify-between gap-3 sm:mb-6 sm:flex-row sm:items-end sm:gap-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-3.5">
        {Icon && (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/10 shadow-[0_0_24px_hsl(var(--primary)/0.08)] sm:h-10 sm:w-10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        <div>
          <h2 className="font-logo text-lg font-bold leading-tight tracking-[-0.03em] sm:text-xl md:text-2xl">
            {title}
          </h2>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : (
        actionLabel &&
        actionHref && (
          <Link
            to={actionHref}
            className="group flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-primary"
          >
            {actionLabel}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )
      )}
    </div>
  );
};

export default SectionHeader;
