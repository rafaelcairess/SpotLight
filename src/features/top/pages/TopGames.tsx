import { Loader2, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import LayoutToggle from "@/components/LayoutToggle";
import { PageContainer, PageShell } from "@/components/PageShell";
import SectionHeader from "@/components/SectionHeader";
import { GameGrid } from "@/features/games/components/GameGrid";
import GameModal from "@/features/games/components/GameModal";
import { RankedGameList } from "@/features/games/components/RankedGameList";
import { useGameSelection } from "@/features/games/hooks/useGameSelection";
import { STORAGE_KEYS } from "@/config/storageKeys";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEnsureGameDetails } from "@/hooks/useGames";
import { useLayoutPreference } from "@/hooks/useLayoutPreference";
import { useToast } from "@/hooks/use-toast";
import { useTopGamesRanking } from "@/hooks/useTopGamesRanking";
import type { GameData } from "@/types/game";

type TopGame = GameData & { hasDetails?: boolean };

export default function TopGames() {
  const { selectedGame, isGameOpen, openGame, closeGame } = useGameSelection<TopGame>();
  const [layoutMode, setLayoutMode] = useLayoutPreference(
    STORAGE_KEYS.layoutMode.topGames,
    "compact",
  );
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const numberFormatter = new Intl.NumberFormat(locale);
  const { toast } = useToast();
  const ensureDetails = useEnsureGameDetails();
  const { data: ranking = [], isLoading, isFetching } = useTopGamesRanking("", "", 10);

  const handleOpenGame = async (game: TopGame) => {
    openGame(game);
    if (game.hasDetails !== false) return;

    try {
      await ensureDetails.mutateAsync(game.app_id);
    } catch {
      toast({ title: t("search.loadError"), variant: "destructive" });
    }
  };

  return (
    <PageShell>
      <PageContainer className="pb-12">
        <SectionHeader
          title={t("topGames.title")}
          subtitle={t("topGames.subtitle")}
          icon={Trophy}
          actions={<LayoutToggle value={layoutMode} onChange={setLayoutMode} />}
        />

        {isFetching && (
          <div className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("common.status.updating")}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-xl border border-border/40 bg-card/50"
              />
            ))}
          </div>
        ) : ranking.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/50 p-8 text-center text-muted-foreground">
            {t("common.status.noResults")}
          </div>
        ) : layoutMode === "compact" ? (
          <GameGrid games={ranking} layout="posters" ranked onGameSelect={handleOpenGame} />
        ) : (
          <RankedGameList
            games={ranking}
            onGameSelect={handleOpenGame}
            emptyGenreLabel={t("common.status.noneFound")}
            formatPlayers={(game) =>
              `${numberFormatter.format(game.activePlayers || 0)} ${t("common.time.playingNow").toLowerCase()}`
            }
          />
        )}
      </PageContainer>

      <GameModal game={selectedGame} isOpen={isGameOpen} onClose={closeGame} />
    </PageShell>
  );
}
