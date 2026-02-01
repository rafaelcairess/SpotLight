import { Link } from "react-router-dom";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

const SectionHeader = ({
  title,
  subtitle,
  icon: Icon,
  actionLabel,
  actionHref,
  className,
}: SectionHeaderProps) => {
  return (
    <div className={cn("flex items-end justify-between mb-6", className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
        <div>
          <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors group"
        >
          {actionLabel}
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
