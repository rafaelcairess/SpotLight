/**
 * Página pública de uma lista personalizada (/lists/:listId).
 */

import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer, PageShell } from "@/components/PageShell";
import { useUserListById, useUserListGames } from "@/hooks/useUserLists";
import { useGamesByIds } from "@/hooks/useGames";
import { GameGrid } from "@/features/games/components/GameGrid";
import GameModal from "@/features/games/components/GameModal";
import { useGameSelection } from "@/features/games/hooks/useGameSelection";

export default function ListPage() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { data: list, isLoading: listLoading } = useUserListById(listId);
  const { data: listGames = [], isLoading: gamesLoading } = useUserListGames(listId);
  const appIds = listGames.map((g) => g.app_id);
  const { data: catalogGames = [], isLoading: catalogLoading } = useGamesByIds(appIds);

  const { selectedGame, isGameOpen, openGame, closeGame } = useGameSelection();

  const isLoading = listLoading || gamesLoading || catalogLoading;

  if (isLoading) {
    return (
      <PageShell>
        <PageContainer width="narrow">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-secondary rounded" />
            <div className="h-4 w-64 bg-secondary rounded" />
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-secondary rounded-lg" />
              ))}
            </div>
          </div>
        </PageContainer>
      </PageShell>
    );
  }

  if (!list) {
    return (
      <PageShell>
        <PageContainer width="narrow" className="text-center">
          <p className="text-muted-foreground">Lista não encontrada ou privada.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </PageContainer>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageContainer width="narrow" className="space-y-6 pb-12">
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
          <GameGrid
            games={catalogGames}
            layout="posters"
            posterColumns={5}
            onGameSelect={openGame}
          />
        )}
      </PageContainer>

      <GameModal game={selectedGame} isOpen={isGameOpen} onClose={closeGame} />
    </PageShell>
  );
}
