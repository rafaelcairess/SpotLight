import GameCard, { type GameCardVariant } from "@/features/games/components/GameCard";
import { cn } from "@/lib/utils";
import type { GameData } from "@/types/game";

type GridLayout = "cards" | "posters";
type PosterColumns = 4 | 5 | 6;

const posterGridClasses: Record<PosterColumns, string> = {
  4: "grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 md:gap-6",
  5: "grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5",
  6: "grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6",
};

interface GameGridProps<T extends GameData> {
  games: T[];
  onGameSelect: (game: NoInfer<T>) => void;
  layout?: GridLayout;
  posterColumns?: PosterColumns;
  cardVariant?: GameCardVariant;
  ranked?: boolean;
  className?: string;
  getContextLabel?: (game: T) => string | undefined;
}

/** Shared responsive catalog grid used by discovery, search, rankings and collections. */
export function GameGrid<T extends GameData>({
  games,
  onGameSelect,
  layout = "cards",
  posterColumns = 5,
  cardVariant,
  ranked = false,
  className,
  getContextLabel,
}: GameGridProps<T>) {
  const variant = cardVariant ?? (layout === "posters" ? "poster" : "default");

  return (
    <div
      className={cn(
        "grid",
        layout === "posters"
          ? posterGridClasses[posterColumns]
          : "grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6 lg:grid-cols-3",
        className,
      )}
    >
      {games.map((game, index) => (
        <GameCard
          key={game.app_id}
          game={game}
          index={index}
          rank={ranked ? index + 1 : undefined}
          variant={variant}
          contextLabel={getContextLabel?.(game)}
          onClick={() => onGameSelect(game)}
        />
      ))}
    </div>
  );
}
