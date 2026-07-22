import { BookOpen, Gamepad2, Heart, List, MessageSquare, Trophy, Users } from "lucide-react";

interface ProfileSidePanelProps {
  games: number;
  favorites: number;
  platinums: number;
  reviews: number;
  friends: number;
  lists?: boolean;
  onSelect: (tab: string) => void;
}

export function ProfileSidePanel({ games, favorites, platinums, reviews, friends, lists, onSelect }: ProfileSidePanelProps) {
  const links = [
    { tab: "library", label: "Jogos", value: games, icon: Gamepad2 },
    { tab: "favorites", label: "Favoritos", value: favorites, icon: Heart },
    { tab: "platinum", label: "Platinados", value: platinums, icon: Trophy },
    { tab: "reviews", label: "Avaliações", value: reviews, icon: BookOpen },
    ...(lists ? [{ tab: "lists", label: "Listas", value: undefined, icon: List }] : []),
    { tab: "friends", label: "Amigos", value: friends, icon: Users },
    { tab: "comments", label: "Comentários", value: undefined, icon: MessageSquare },
  ];

  return (
    <aside className="overflow-hidden rounded-lg bg-black/20 p-4 backdrop-blur-sm">
      <nav aria-label="Conteúdo do perfil" className="space-y-1">
        {links.map(({ tab, label, value, icon: Icon }) => (
          <button
            key={tab}
            type="button"
            onClick={() => onSelect(tab)}
            className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <Icon className="h-4 w-4 text-primary/80" />
            <span className="flex-1">{label}</span>
            {value !== undefined && <span className="text-xl font-light text-foreground/70">{value}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
