import { Flame, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import LayoutToggle from "@/components/LayoutToggle";
import { PageContainer, PageShell } from "@/components/PageShell";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { GameGrid } from "@/features/games/components/GameGrid";
import GameModal from "@/features/games/components/GameModal";
import { RankedGameList } from "@/features/games/components/RankedGameList";
import { useGameSelection } from "@/features/games/hooks/useGameSelection";
import { STORAGE_KEYS } from "@/config/storageKeys";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLayoutPreference } from "@/hooks/useLayoutPreference";
import { useMostPlayedGames } from "@/hooks/useMostPlayedGames";

export default function MostPlayed() {
  const { selectedGame, isGameOpen, openGame, closeGame } = useGameSelection();
  const [layoutMode, setLayoutMode] = useLayoutPreference(
    STORAGE_KEYS.layoutMode.mostPlayed,
    "standard",
  );
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const numberFormatter = new Intl.NumberFormat(locale);
  const { data: games = [], isLoading, isFetching, isError, refetch } = useMostPlayedGames(50);

  return (
    <PageShell>
      <PageContainer className="pb-12">
        <SectionHeader
          title={t("mostPlayed.title")}
          subtitle={t("mostPlayed.subtitle")}
          icon={Flame}
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
        ) : isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="mb-4 text-muted-foreground">{t("common.status.error")}</p>
            <Button type="button" variant="outline" onClick={() => refetch()}>
              {t("common.actions.update")}
            </Button>
          </div>
        ) : games.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/50 p-8 text-center text-muted-foreground">
            {t("common.status.noneFound")}
          </div>
        ) : layoutMode === "compact" ? (
          <GameGrid games={games} layout="posters" ranked onGameSelect={openGame} />
        ) : (
          <RankedGameList
            games={games}
            onGameSelect={openGame}
            emptyGenreLabel={t("common.status.noneFound")}
            formatPlayers={(game) =>
              `${numberFormatter.format(game.activePlayers || 0)} ${t("mostPlayed.playingSuffix")}`
            }
          />
        )}
      </PageContainer>

      <GameModal game={selectedGame} isOpen={isGameOpen} onClose={closeGame} />
    </PageShell>
  );
}
