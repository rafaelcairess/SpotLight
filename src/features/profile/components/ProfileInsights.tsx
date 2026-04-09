/**
 * Componente da feature profile.
 */

import { useMemo } from "react";
import { Clock3, Gamepad2, CheckCircle2, Flame, TrendingUp } from "lucide-react";
import { UserGame } from "@/hooks/useUserGames";
import { useGamesByIds } from "@/hooks/useGames";
import { useTranslation } from "react-i18next";
import { getEffectiveHours } from "@/lib/playtime";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProfileInsightsProps {
  games: UserGame[];
  isLoading: boolean;
}

const normalizeToken = (value: string) => value.trim().toLowerCase();

const GENRE_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a78bfa",
  "#c4b5fd",
  "#ddd6fe",
];

export function ProfileInsights({ games, isLoading }: ProfileInsightsProps) {
  const { t } = useTranslation();
  const appIds = games.map((game) => game.app_id);
  const { data: catalogGames = [], isLoading: catalogLoading } = useGamesByIds(appIds);

  const gameMap = useMemo(
    () => new Map(catalogGames.map((game) => [game.app_id, game])),
    [catalogGames]
  );

  const metrics = useMemo(() => {
    const totalGames = games.length;
    const totalHours = games.reduce(
      (acc, game) => acc + (getEffectiveHours(game) || 0),
      0
    );
    const completedCount = games.filter((game) => game.status === "completed").length;
    const completionRate = totalGames > 0 ? Math.round((completedCount / totalGames) * 100) : 0;

    const topPlayed = [...games]
      .filter((game) => (getEffectiveHours(game) || 0) > 0)
      .sort((a, b) => (getEffectiveHours(b) || 0) - (getEffectiveHours(a) || 0))
      .slice(0, 3)
      .map((game) => ({
        appId: game.app_id,
        hours: Math.round(getEffectiveHours(game) || 0),
      }));

    const genreCounter = new Map<string, number>();
    for (const userGame of games) {
      const catalogGame = gameMap.get(userGame.app_id);
      if (!catalogGame) continue;

      const tokens = [
        ...(catalogGame.genre ? [catalogGame.genre] : []),
        ...(catalogGame.tags || []),
      ]
        .map(normalizeToken)
        .filter(Boolean);

      const uniqueTokens = Array.from(new Set(tokens));
      for (const token of uniqueTokens) {
        genreCounter.set(token, (genreCounter.get(token) || 0) + 1);
      }
    }

    const sortedGenres = [...genreCounter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const favoriteGenre = sortedGenres[0]?.[0] || t("profileInsights.noData");

    const topGenresData = sortedGenres.map(([name, count]) => ({
      name: name.length > 14 ? name.slice(0, 12) + "…" : name,
      count,
    }));

    // Jogos adicionados por mês (últimos 6 meses)
    const now = new Date();
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i);
      const start = startOfMonth(month);
      const end = startOfMonth(subMonths(now, 4 - i));
      const count = games.filter((g) => {
        const added = new Date(g.added_at);
        return added >= start && added < end;
      }).length;
      return {
        month: format(month, "MMM", { locale: ptBR }),
        count,
      };
    });

    return {
      totalHours: Math.round(totalHours),
      completionRate,
      topPlayed,
      favoriteGenre,
      topGenresData,
      monthlyData,
    };
  }, [games, gameMap, t]);

  if (isLoading || catalogLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-4 animate-pulse">
        <div className="h-5 w-40 bg-secondary rounded mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-16 rounded-lg bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-6">
      <h3 className="text-sm font-semibold">{t("profileInsights.title")}</h3>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Clock3 className="w-3.5 h-3.5" />
            {t("profileInsights.totalHours")}
          </div>
          <p className="text-lg font-semibold">{metrics.totalHours}h</p>
        </div>

        <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t("profileInsights.completed")}
          </div>
          <p className="text-lg font-semibold">{metrics.completionRate}%</p>
        </div>

        <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Gamepad2 className="w-3.5 h-3.5" />
            {t("profileInsights.topPlayed")}
          </div>
          {metrics.topPlayed.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("profileInsights.noHours")}</p>
          ) : (
            <div className="space-y-1">
              {metrics.topPlayed.map((entry) => (
                <p key={entry.appId} className="text-xs text-foreground/90 truncate">
                  {(gameMap.get(entry.appId)?.title || `App ${entry.appId}`) + ` - ${entry.hours}h`}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border/40 bg-secondary/20 p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Flame className="w-3.5 h-3.5" />
            {t("profileInsights.favoriteGenre")}
          </div>
          <p className="text-sm font-semibold capitalize truncate">{metrics.favoriteGenre}</p>
        </div>
      </div>

      {/* Gráficos */}
      {games.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top gêneros */}
          {metrics.topGenresData.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Top Gêneros
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart
                  data={metrics.topGenresData}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    width={80}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--secondary))" }}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`${value} jogos`, ""]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {metrics.topGenresData.map((_, index) => (
                      <Cell key={index} fill={GENRE_COLORS[index % GENRE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Jogos por mês */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Jogos adicionados
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart
                data={metrics.monthlyData}
                margin={{ top: 0, right: 8, left: -16, bottom: 0 }}
              >
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--secondary))" }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value} jogos`, ""]}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
