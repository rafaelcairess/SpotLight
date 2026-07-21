/**
 * Página da feature alerts.
 */

import { useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bell, Trash2, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import SectionHeader from "@/components/SectionHeader";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { useGamesByIds } from "@/hooks/useGames";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Alerts() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { alerts, removeAlert, isLoading } = usePriceAlerts();
  const gameIds = alerts.map((alert) => alert.game_id);
  const { data: games = [], isLoading: gamesLoading } = useGamesByIds(gameIds);
  const { t } = useTranslation();
  const { locale } = useLanguage();

  const formatCurrency = (value: number | null, currency = "BRL") => {
    if (value === null || Number.isNaN(value)) return t("alerts.anyPromo");
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(value);
  };

  const gameMap = useMemo(
    () => new Map(games.map((game) => [game.app_id, game])),
    [games]
  );

  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 md:pt-28 pb-12">
        <div className="container mx-auto px-4">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("alerts.backProfile")}
          </Link>

          <SectionHeader title={t("alerts.title")} subtitle={t("alerts.subtitle")} icon={Bell} />

          {isLoading || gamesLoading ? (
            <LoadingSkeleton variant="card" count={3} />
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{t("alerts.empty")}</div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => {
                const game = gameMap.get(alert.game_id);
                const targetValue =
                  alert.target_price !== null ? Number(alert.target_price) : null;

                return (
                  <div
                    key={alert.id}
                    className="rounded-2xl border border-border/40 bg-card/50 p-4 flex flex-col sm:flex-row gap-4"
                  >
                    <div className="w-full sm:w-40 h-24 rounded-lg overflow-hidden bg-secondary/40">
                      {game?.image && (
                        <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-semibold">{game?.title || `App ${alert.game_id}`}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t("alerts.target")}: {formatCurrency(targetValue)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("alerts.activeSince", {
                          date: new Date(alert.created_at).toLocaleDateString(locale),
                        })}
                      </p>
                    </div>
                    <div className="flex items-start justify-end">
                      <Button
                        variant="outline"
                        className="gap-2"
                        disabled={removeAlert.isPending}
                        onClick={() => removeAlert.mutate(alert.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        {t("alerts.remove")}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
