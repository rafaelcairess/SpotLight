/**
 * Componente da feature collections.
 */

import { Link } from "react-router-dom";
import {
  Building2,
  Compass,
  Cpu,
  DollarSign,
  GamepadIcon,
  Gauge,
  Headset,
  Map,
  Puzzle,
  Repeat,
  SlidersHorizontal,
  Trophy,
  Skull,
  Sword,
  Users,
  UsersRound,
  Sofa,
  BookOpen,
  Zap,
  Sparkles,
  Flame,
  Target,
  ArrowUpRight,
  LucideIcon,
} from "lucide-react";
import { CategoryData } from "@/types/game";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface CategoryCardProps {
  category: CategoryData;
  index?: number;
}

const iconMap: Record<string, LucideIcon> = {
  Building2,
  Compass,
  Cpu,
  DollarSign,
  GamepadIcon,
  Gauge,
  Headset,
  Map,
  Puzzle,
  Repeat,
  SlidersHorizontal,
  Trophy,
  Skull,
  Sword,
  Users,
  UsersRound,
  Sofa,
  BookOpen,
  Zap,
  Sparkles,
  Flame,
  Target,
};

const CategoryCard = ({ category, index = 0 }: CategoryCardProps) => {
  const { t } = useTranslation();
  const Icon = iconMap[category.icon] || Sparkles;
  const title = t(`categories.${category.id}.name`, { defaultValue: category.name });
  const description = t(`categories.${category.id}.description`, {
    defaultValue: category.description,
  });

  return (
    <Link
      to={`/collections/${category.id}`}
      className={cn(
        "group relative block aspect-[4/3] overflow-hidden rounded-2xl sm:aspect-[16/10]",
        "bg-gradient-to-br",
        category.gradient,
        "border border-white/[0.07] hover:border-primary/40",
        "transition-all duration-300 hover:-translate-y-1 shadow-[0_12px_35px_hsl(224_60%_2%/0.22)] hover:shadow-[0_22px_55px_hsl(224_60%_2%/0.48)]",
        category.featured &&
          "ring-2 ring-primary/40 shadow-[0_0_30px_rgba(34,197,94,0.25)] hover:scale-[1.02]",
        "animate-fade-in",
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute -inset-2 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-2xl" />
      </div>

      {/* Content */}
      <div className="relative flex h-full flex-col items-start justify-end p-5 text-left sm:p-6">
        {/* Icon */}
        <div className="mb-auto grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-black/15 backdrop-blur-sm transition-all duration-300 group-hover:border-primary/30 group-hover:bg-primary/10">
          <Icon className="h-5 w-5 text-foreground transition-colors group-hover:text-primary" />
        </div>

        {/* Title */}
        <h3 className="mb-1 flex w-full items-center justify-between gap-3 text-lg font-bold transition-colors group-hover:text-primary md:text-xl">
          {title}
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        </h3>

        {/* Description */}
        <p className="line-clamp-2 max-w-[230px] text-xs text-muted-foreground md:text-sm">
          {description}
        </p>
      </div>

      {/* Corner Accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
    </Link>
  );
};

export default CategoryCard;
