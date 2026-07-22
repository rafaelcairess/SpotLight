import { GameLibrary } from "@/features/profile/components/GameLibrary";
import { UserGame } from "@/hooks/useUserGames";
import { GameData } from "@/types/game";

interface ProfileLibrarySectionsProps {
  games: UserGame[];
  isLoading: boolean;
  readOnly?: boolean;
  onGameSelect?: (game: GameData) => void;
}

export function ProfileLibrarySections({ games, isLoading, readOnly = false, onGameSelect }: ProfileLibrarySectionsProps) {
  const orderedGames = [...games].sort((a, b) => {
    const recent = (b.last_played_at ? new Date(b.last_played_at).getTime() : 0) - (a.last_played_at ? new Date(a.last_played_at).getTime() : 0);
    if (recent !== 0) return recent;
    return Number(b.hours_played || 0) - Number(a.hours_played || 0);
  });

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Biblioteca</h2>
      </div>
      <GameLibrary games={orderedGames} isLoading={isLoading} emptyMessage="Nenhum jogo para mostrar." readOnly={readOnly} onGameSelect={onGameSelect} />
    </section>
  );
}
