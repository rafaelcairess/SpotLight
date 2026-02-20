import { Info, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameData } from "@/types/game";
import { cn } from "@/lib/utils";
import steamIcon from "../../assets/steam.png";

interface FeaturedBannerProps {
  game: GameData;
  onExplore: () => void;
}

const FeaturedBanner = ({ game, onExplore }: FeaturedBannerProps) => {
  const formatPlayers = (count?: number) => {
    if (!count) return null;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return "text-muted-foreground";
    if (rating >= 80) return "rating-positive";
    if (rating >= 50) return "rating-mixed";
    return "rating-negative";
  };

  const handleOpenSteam = () => {
    window.open(
      `https://store.steampowered.com/app/${game.app_id}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="relative w-full min-h-[360px] aspect-[4/3] sm:min-h-0 sm:aspect-[16/9] lg:aspect-[21/9] xl:aspect-[21/8] rounded-2xl overflow-hidden group">
      {/* Background Image */}
      <img
        src={game.image}
        alt={game.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        fetchpriority="high"
        loading="eager"
        decoding="async"
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      <div className="absolute inset-0 hero-gradient opacity-50" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-5 pb-6 sm:p-8 sm:pb-10 md:p-10 md:pb-12 max-w-2xl">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-4 animate-fade-in">
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary rounded-full border border-primary/30">
            Em Destaque
          </span>
          {game.genre && (
            <span className="px-3 py-1 text-xs font-medium bg-secondary/80 rounded-full">
              {game.genre}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 leading-tight break-words line-clamp-3 animate-fade-in-up">
          {game.title}
        </h1>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-4 text-sm animate-fade-in">
          {game.activePlayers && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                <span className="text-foreground font-semibold">
                  {formatPlayers(game.activePlayers)}
                </span>{" "}
                jogando
              </span>
            </div>
          )}
          {game.communityRating && (
            <div className="flex items-center gap-2">
              <Star
                className={cn(
                  "w-4 h-4 fill-current",
                  getRatingColor(game.communityRating)
                )}
              />
              <span className={getRatingColor(game.communityRating)}>
                {game.communityRating}% positivas
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {game.short_description && (
          <p className="text-muted-foreground mb-6 line-clamp-2 md:line-clamp-3 max-w-lg animate-fade-in">
            {game.short_description}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 animate-fade-in-up">
          <Button
            size="lg"
            className="gap-2 glow-primary"
            onClick={handleOpenSteam}
          >
            <img src={steamIcon} alt="Steam" className="w-4 h-4" />
            Ver na Steam
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="gap-2"
            onClick={onExplore}
          >
            <Info className="w-4 h-4" />
            Mais Detalhes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedBanner;
