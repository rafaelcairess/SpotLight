/**
 * Página pública de uma lista personalizada (/lists/:listId).
 */

import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useUserListById, useUserListGames } from "@/hooks/useUserLists";
import { useGamesByIds } from "@/hooks/useGames";
import GameCard from "@/features/games/components/GameCard";
import { useState } from "react";
import GameModal from "@/features/games/components/GameModal";
import { GameData } from "@/types/game";

export default function ListPage() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { data: list, isLoading: listLoading } = useUserListById(listId);
  const { data: listGames = [], isLoading: gamesLoading } = useUserListGames(listId);
  const appIds = listGames.map((g) => g.app_id);
  const { data: catalogGames = [], isLoading: catalogLoading } = useGamesByIds(appIds);

  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);

  const isLoading = listLoading || gamesLoading || catalogLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-secondary rounded" />
            <div className="h-4 w-64 bg-secondary rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-secondary rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 container mx-auto px-4 max-w-4xl text-center">
          <p className="text-muted-foreground">Lista não encontrada ou privada.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12 container mx-auto px-4 max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{list.name}</h1>
            {list.is_public ? (
              <Globe className="w-4 h-4 text-green-500" />
            ) : (
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          {list.description && <p className="text-muted-foreground">{list.description}</p>}
          <p className="text-sm text-muted-foreground">{catalogGames.length} jogos</p>
        </div>

        {catalogGames.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 p-12 text-center">
            <p className="text-muted-foreground">Esta lista não tem jogos ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {catalogGames.map((game) => (
              <GameCard key={game.app_id} game={game} onClick={() => setSelectedGame(game)} />
            ))}
          </div>
        )}
      </main>

      <GameModal
        game={selectedGame}
        isOpen={!!selectedGame}
        onClose={() => setSelectedGame(null)}
      />
    </div>
  );
}
