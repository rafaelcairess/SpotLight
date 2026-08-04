import { BookOpen, Gamepad2, List, Trophy, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProfileSidePanelProps {
  games: number;
  platinums: number;
  reviews: number;
  friends: number;
  lists?: boolean;
  onSelect: (tab: string) => void;
}

export function ProfileSidePanel({
  games,
  platinums,
  reviews,
  friends,
  lists,
  onSelect,
}: ProfileSidePanelProps) {
  const { t } = useTranslation();
  const links = [
    { tab: "library", label: t("profile.games"), value: games, icon: Gamepad2 },
    { tab: "platinum", label: t("profile.platinums"), value: platinums, icon: Trophy },
    { tab: "reviews", label: t("profile.reviews"), value: reviews, icon: BookOpen },
    ...(lists ? [{ tab: "lists", label: t("profile.lists"), value: undefined, icon: List }] : []),
    { tab: "friends", label: t("profile.friends"), value: friends, icon: Users },
  ];

  return (
    <aside className="overflow-hidden rounded-2xl border border-white/[0.07] bg-black/20 p-3 backdrop-blur-sm">
      <nav aria-label={t("profile.contentNavigation")} className="space-y-1">
        {links.map(({ tab, label, value, icon: Icon }) => (
          <button
            key={tab}
            type="button"
            onClick={() => onSelect(tab)}
            className="group flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-primary/[0.08] hover:text-foreground"
          >
            <Icon className="h-4 w-4 text-primary/80" />
            <span className="flex-1">{label}</span>
            {value !== undefined && (
              <span className="font-logo text-lg font-bold text-foreground/80">{value}</span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
