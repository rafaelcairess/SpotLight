/**
 * Componente da feature profile.
 */

import { useMemo } from "react";
import { Trophy, Star, Zap, Heart, Users, BookOpen, Clock, Award, Shield } from "lucide-react";
import { UserGame } from "@/hooks/useUserGames";
import { useTranslation } from "react-i18next";

interface AchievementsBadgesProps {
  games: UserGame[];
  reviewsCount: number;
  followersCount: number;
  followingCount: number;
}

interface Achievement {
  key: string;
  label: string;
  description: string;
  icon: typeof Trophy;
  color: string;
  unlocked: boolean;
}

function computeAchievements(
  games: UserGame[],
  reviewsCount: number,
  followersCount: number,
  followingCount: number
): Achievement[] {
  const totalGames = games.length;
  const platinumGames = games.filter((g) => g.is_platinumed).length;
  const maxHours = games.reduce((max, g) => Math.max(max, g.hours_played ?? 0), 0);
  const completedGames = games.filter((g) => g.status === "completed").length;

  return [
    {
      key: "first_game",
      label: "Iniciante",
      description: "Adicione seu primeiro jogo",
      icon: Zap,
      color: "text-blue-400",
      unlocked: totalGames >= 1,
    },
    {
      key: "collector",
      label: "Colecionador",
      description: "50 jogos na biblioteca",
      icon: Shield,
      color: "text-purple-400",
      unlocked: totalGames >= 50,
    },
    {
      key: "marathoner",
      label: "Maratonista",
      description: "100h em um único jogo",
      icon: Clock,
      color: "text-orange-400",
      unlocked: maxHours >= 100,
    },
    {
      key: "critic",
      label: "Crítico",
      description: "5 reviews escritas",
      icon: BookOpen,
      color: "text-yellow-400",
      unlocked: reviewsCount >= 5,
    },
    {
      key: "veteran_critic",
      label: "Crítico Veterano",
      description: "25 reviews escritas",
      icon: Star,
      color: "text-amber-400",
      unlocked: reviewsCount >= 25,
    },
    {
      key: "platinumed",
      label: "Platinador",
      description: "Primeiro jogo platinado",
      icon: Trophy,
      color: "text-cyan-400",
      unlocked: platinumGames >= 1,
    },
    {
      key: "elite_platinumed",
      label: "Platinador Elite",
      description: "10 jogos platinados",
      icon: Award,
      color: "text-indigo-400",
      unlocked: platinumGames >= 10,
    },
    {
      key: "social",
      label: "Social",
      description: "Seguir 10 pessoas",
      icon: Heart,
      color: "text-pink-400",
      unlocked: followingCount >= 10,
    },
    {
      key: "influencer",
      label: "Influencer",
      description: "10 seguidores",
      icon: Users,
      color: "text-green-400",
      unlocked: followersCount >= 10,
    },
    {
      key: "completionist",
      label: "Completista",
      description: "25 jogos completados",
      icon: Star,
      color: "text-teal-400",
      unlocked: completedGames >= 25,
    },
  ];
}

export function AchievementsBadges({
  games,
  reviewsCount,
  followersCount,
  followingCount,
}: AchievementsBadgesProps) {
  const { t: _t } = useTranslation();

  const achievements = useMemo(
    () => computeAchievements(games, reviewsCount, followersCount, followingCount),
    [games, reviewsCount, followersCount, followingCount]
  );

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Conquistas SpotLight</h3>
        <span className="text-xs text-muted-foreground">
          {unlocked.length}/{achievements.length} desbloqueadas
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {unlocked.map((achievement) => {
          const Icon = achievement.icon;
          return (
            <div
              key={achievement.key}
              title={achievement.description}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-border/40 bg-secondary/20 p-3 text-center hover:bg-secondary/40 transition-colors"
            >
              <div className={`p-2 rounded-full bg-secondary/50 ${achievement.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium leading-tight">{achievement.label}</p>
            </div>
          );
        })}

        {locked.map((achievement) => {
          const Icon = achievement.icon;
          return (
            <div
              key={achievement.key}
              title={achievement.description}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-border/30 bg-secondary/10 p-3 text-center opacity-40 cursor-not-allowed"
            >
              <div className="p-2 rounded-full bg-secondary/30 text-muted-foreground">
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium leading-tight text-muted-foreground">
                {achievement.label}
              </p>
            </div>
          );
        })}
      </div>

      {unlocked.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Adicione jogos, escreva reviews e conecte-se com outros jogadores para desbloquear conquistas.
        </p>
      )}
    </div>
  );
}
