import { GamepadIcon, CheckCircle2, XCircle } from "lucide-react";
import { GameLibrary } from "@/components/profile/GameLibrary";
import { UserGame } from "@/hooks/useUserGames";
import { GameData } from "@/types/game";

interface ProfileLibrarySectionsProps {
  games: UserGame[];
  isLoading: boolean;
  readOnly?: boolean;
  onGameSelect?: (game: GameData) => void;
}

export function ProfileLibrarySections({
  games,
  isLoading,
  readOnly = false,
  onGameSelect,
}: ProfileLibrarySectionsProps) {
  const completedGames = games.filter((g) => g.status === "completed");
  const droppedGames = games.filter((g) => g.status === "dropped");
  const activeGames = games.filter(
    (g) => g.status === "playing" || g.status === "wishlist"
  );

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Completados</h3>
            <p className="text-xs text-muted-foreground">Jogos que você finalizou</p>
          </div>
        </div>
        <GameLibrary
          games={completedGames}
          isLoading={isLoading}
          emptyMessage="Nenhum jogo completado ainda."
          readOnly={readOnly}
          highlightPlatinum
          cardTone="completed"
          onGameSelect={onGameSelect}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-rose-500/10">
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Abandonados</h3>
            <p className="text-xs text-muted-foreground">Jogos que você deixou de lado</p>
          </div>
        </div>
        <GameLibrary
          games={droppedGames}
          isLoading={isLoading}
          emptyMessage="Nenhum jogo abandonado."
          readOnly={readOnly}
          cardTone="dropped"
          onGameSelect={onGameSelect}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <GamepadIcon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Em progresso</h3>
            <p className="text-xs text-muted-foreground">Jogando agora ou na lista de desejos</p>
          </div>
        </div>
        <GameLibrary
          games={activeGames}
          isLoading={isLoading}
          emptyMessage="Nada por aqui no momento."
          readOnly={readOnly}
          highlightPlatinum
          onGameSelect={onGameSelect}
        />
      </section>
    </div>
  );
}
