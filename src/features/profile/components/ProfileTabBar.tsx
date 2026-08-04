import { BookOpen, EyeOff, GamepadIcon, LayoutDashboard, List, Trophy, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProfileTabBarProps {
  games: number;
  platinums: number;
  reviews: number;
  friends: number;
  hidden?: number;
  owner?: boolean;
}

export function ProfileTabBar({
  games,
  platinums,
  reviews,
  friends,
  hidden = 0,
  owner = false,
}: ProfileTabBarProps) {
  const { t } = useTranslation();
  const tabs = [
    { value: "overview", label: t("profile.overview"), icon: LayoutDashboard },
    { value: "library", label: `${t("profile.library")} (${games})`, icon: GamepadIcon },
    { value: "platinum", label: `${t("profile.platinums")} (${platinums})`, icon: Trophy },
    { value: "reviews", label: `${t("profile.reviews")} (${reviews})`, icon: BookOpen },
    ...(owner ? [{ value: "lists", label: t("profile.lists"), icon: List }] : []),
    ...(owner
      ? [{ value: "hidden", label: `${t("profile.hiddenTab")} (${hidden})`, icon: EyeOff }]
      : []),
    { value: "friends", label: `${t("profile.friends")} (${friends})`, icon: Users },
  ];

  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:-mx-7 md:px-7 [&::-webkit-scrollbar]:hidden">
      <TabsList className="h-auto w-max min-w-full justify-start">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}
