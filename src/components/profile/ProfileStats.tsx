import { GamepadIcon, Heart, Trophy, BookOpen, Users, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const stats = [
    { key: "games", label: t("profile.library"), value: totalGames, icon: GamepadIcon, color: "text-primary" },
    { key: "favorites", label: t("profile.favorites"), value: favorites, icon: Heart, color: "text-rose-500" },
    { key: "platinums", label: t("profile.platinums"), value: platinums, icon: Trophy, color: "text-amber-500" },
    { key: "reviews", label: t("profile.reviews"), value: reviews, icon: BookOpen, color: "text-blue-500" },
    { key: "followers", label: t("profile.followers"), value: followers, icon: Users, color: "text-emerald-500" },
    { key: "following", label: t("profile.following"), value: following, icon: UserPlus, color: "text-indigo-500" },
  ];

  return (
    <div className="flex flex-wrap gap-6 mt-4">
      {stats.map((stat) => {
        const handleClick =
          stat.key === "followers"
            ? onFollowersClick
            : stat.key === "following"
            ? onFollowingClick
            : undefined;

        const isDisabled =
          (stat.key === "followers" && !onFollowersClick) ||
          (stat.key === "following" && !onFollowingClick) ||
          (stat.key !== "followers" && stat.key !== "following");

        return (
          <button
            key={stat.key}
            type="button"
            onClick={handleClick}
            className="flex items-center gap-2 text-left disabled:cursor-default disabled:opacity-100"
            disabled={isDisabled}
          >
            <div className="p-2 rounded-lg bg-secondary/50">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
