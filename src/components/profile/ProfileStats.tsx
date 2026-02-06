import { GamepadIcon, Heart, Trophy, BookOpen, Users, UserPlus } from "lucide-react";

interface ProfileStatsProps {
  totalGames: number;
  favorites: number;
  platinums: number;
  reviews: number;
  followers: number;
  following: number;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

export function ProfileStats({
  totalGames,
  favorites,
  platinums,
  reviews,
  followers,
  following,
  onFollowersClick,
  onFollowingClick,
}: ProfileStatsProps) {
  const stats = [
    { label: "Jogos", value: totalGames, icon: GamepadIcon, color: "text-primary" },
    { label: "Favoritos", value: favorites, icon: Heart, color: "text-rose-500" },
    { label: "Platinas", value: platinums, icon: Trophy, color: "text-amber-500" },
    { label: "Reviews", value: reviews, icon: BookOpen, color: "text-blue-500" },
    { label: "Seguidores", value: followers, icon: Users, color: "text-emerald-500" },
    { label: "Seguindo", value: following, icon: UserPlus, color: "text-indigo-500" },
  ];

  return (
    <div className="flex flex-wrap gap-6 mt-4">
      {stats.map((stat) => (
        <button
          key={stat.label}
          type="button"
          onClick={
            stat.label === "Seguidores"
              ? onFollowersClick
              : stat.label === "Seguindo"
              ? onFollowingClick
              : undefined
          }
          className="flex items-center gap-2 text-left disabled:cursor-default disabled:opacity-100"
          disabled={
            (stat.label === "Seguidores" && !onFollowersClick) ||
            (stat.label === "Seguindo" && !onFollowingClick) ||
            (stat.label !== "Seguidores" && stat.label !== "Seguindo")
          }
        >
          <div className="p-2 rounded-lg bg-secondary/50">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>
          <div>
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
