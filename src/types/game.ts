export interface GameData {
  app_id: number;
  title: string;
  image: string;
  short_description?: string;
  genre?: string;
  tags?: string[];
  activePlayers?: number;
  communityRating?: number;
  price?: string;
  priceOriginal?: string;
  discountPercent?: number;
  releaseDate?: string;
  developer?: string;
  publisher?: string;
  platforms?: string[];
}

export interface CategoryData {
  id: string;
  name: string;
  icon: string;
  description: string;
  gradient: string;
  featured?: boolean;
}

export const CATEGORIES: CategoryData[] = [
  {
    id: "coop-2-couch",
    name: "Dupla no Sofá",
    icon: "Sofa",
    description: "Jogos para duas pessoas no mesmo sofá",
    gradient: "from-green-900/50 to-black",
    featured: true,
  },
  {
    id: "coop-2-online",
    name: "Dupla Online",
    icon: "Users",
    description: "Duas pessoas jogando online",
    gradient: "from-emerald-900/50 to-black",
    featured: true,
  },
  {
    id: "coop-4-online",
    name: "Grupo Online",
    icon: "UsersRound",
    description: "Partidas online para quatro pessoas",
    gradient: "from-teal-900/50 to-black",
    featured: true,
  },
  {
    id: "terror",
    name: "Terror",
    icon: "Skull",
    description: "Experiências arrepiantes e atmosferas sombrias",
    gradient: "from-red-900/50 to-black",
  },
  {
    id: "rpg",
    name: "RPG",
    icon: "Sword",
    description: "Mundos épicos e histórias imersivas",
    gradient: "from-purple-900/50 to-black",
  },
  {
    id: "story-rich",
    name: "História Rica",
    icon: "BookOpen",
    description: "Narrativas profundas e envolventes",
    gradient: "from-amber-900/50 to-black",
  },
  {
    id: "action",
    name: "Ação",
    icon: "Zap",
    description: "Adrenalina e gameplay frenético",
    gradient: "from-orange-900/50 to-black",
  },
  {
    id: "indie",
    name: "Indie",
    icon: "Sparkles",
    description: "Jogos únicos de desenvolvedores independentes",
    gradient: "from-pink-900/50 to-black",
  },
  {
    id: "survival",
    name: "Sobrevivência",
    icon: "Flame",
    description: "Lute para sobreviver em ambientes hostis",
    gradient: "from-emerald-900/50 to-black",
  },
  {
    id: "strategy",
    name: "Estratégia",
    icon: "Target",
    description: "Planeje, conquiste e domine",
    gradient: "from-blue-900/50 to-black",
  },
];
