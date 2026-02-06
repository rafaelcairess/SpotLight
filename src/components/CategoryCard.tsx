import { Link } from "react-router-dom";
import {
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
  LucideIcon,
} from "lucide-react";
import { CategoryData } from "@/types/game";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: CategoryData;
  index?: number;
}

const iconMap: Record<string, LucideIcon> = {
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
  const Icon = iconMap[category.icon] || Sparkles;

  return (
    <Link
      to={`/collections/${category.id}`}
      className={cn(
        "group relative block aspect-[4/3] sm:aspect-[16/10] rounded-xl overflow-hidden",
        "bg-gradient-to-br",
        category.gradient,
        "border border-border/30 hover:border-primary/50",
        "transition-all duration-300 hover:-translate-y-1",
        category.featured &&
          "ring-2 ring-primary/40 shadow-[0_0_30px_rgba(34,197,94,0.25)] hover:scale-[1.02]",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute -inset-2 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-2xl" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
        {/* Icon */}
        <div className="mb-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all duration-300">
          <Icon className="w-8 h-8 md:w-10 md:h-10 text-foreground group-hover:text-primary transition-colors" />
        </div>

        {/* Title */}
        <h3 className="text-lg md:text-xl font-bold mb-2 group-hover:text-primary transition-colors">
          {category.name}
        </h3>

        {/* Description */}
        <p className="text-xs md:text-sm text-muted-foreground max-w-[200px]">
          {category.description}
        </p>
      </div>

      {/* Corner Accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
    </Link>
  );
};

export default CategoryCard;
