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
    id: "coop-4-couch",
    name: "Grupo no Sofá",
    icon: "Sofa",
    description: "Co-op local para grupos no mesmo sofá",
    gradient: "from-lime-900/50 to-black",
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
    id: "casual",
    name: "Casuais",
    icon: "GamepadIcon",
    description: "Partidas leves e relaxantes",
    gradient: "from-sky-900/50 to-black",
  },
  {
    id: "action",
    name: "Ação",
    icon: "Zap",
    description: "Adrenalina e gameplay frenético",
    gradient: "from-orange-900/50 to-black",
  },
  {
    id: "sports",
    name: "Esportes",
    icon: "Trophy",
    description: "Competições, times e adrenalina",
    gradient: "from-yellow-900/40 to-black",
  },
  {
    id: "sci-fi-cyberpunk",
    name: "Ficção Científica e Cyberpunk",
    icon: "Cpu",
    description: "Futuro distópico, neon e tecnologia",
    gradient: "from-indigo-900/50 to-black",
  },
  {
    id: "terror",
    name: "Terror",
    icon: "Skull",
    description: "Experiências arrepiantes e atmosferas sombrias",
    gradient: "from-red-900/50 to-black",
  },
  {
    id: "puzzle",
    name: "Quebra-Cabeça",
    icon: "Puzzle",
    description: "Desafios mentais e lógica",
    gradient: "from-cyan-900/50 to-black",
  },
  {
    id: "roguelike",
    name: "Roguelike",
    icon: "Repeat",
    description: "Runs intensos e evolução constante",
    gradient: "from-fuchsia-900/50 to-black",
  },
  {
    id: "racing",
    name: "Corrida",
    icon: "Gauge",
    description: "Velocidade máxima nas pistas",
    gradient: "from-slate-900/50 to-black",
  },
  {
    id: "free-to-play",
    name: "Gratuitos para Jogar",
    icon: "DollarSign",
    description: "Jogos free-to-play populares",
    gradient: "from-emerald-900/30 to-black",
  },
  {
    id: "anime",
    name: "Anime",
    icon: "Sparkles",
    description: "Estética e narrativas inspiradas em anime",
    gradient: "from-pink-900/50 to-black",
  },
  {
    id: "vr",
    name: "Títulos de RV",
    icon: "Headset",
    description: "Imersão total em realidade virtual",
    gradient: "from-violet-900/50 to-black",
  },
  {
    id: "open-world",
    name: "Mundo Aberto",
    icon: "Map",
    description: "Exploração livre e vastos mapas",
    gradient: "from-emerald-900/40 to-black",
  },
  {
    id: "city-building",
    name: "Cidades e Colonização",
    icon: "Building2",
    description: "Construa e administre sua colônia",
    gradient: "from-blue-900/40 to-black",
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
    name: "Boa Trama",
    icon: "BookOpen",
    description: "Narrativas profundas e envolventes",
    gradient: "from-amber-900/50 to-black",
  },
  {
    id: "simulation",
    name: "Simulação",
    icon: "SlidersHorizontal",
    description: "Simuladores e experiências realistas",
    gradient: "from-teal-900/40 to-black",
  },
  {
    id: "adventure",
    name: "Aventura",
    icon: "Compass",
    description: "Exploração e histórias épicas",
    gradient: "from-amber-900/40 to-black",
  },
  {
    id: "fighting",
    name: "Luta",
    icon: "Sword",
    description: "Combates intensos e precisão",
    gradient: "from-red-900/40 to-black",
  },
  {
    id: "survival",
    name: "Sobrevivência",
    icon: "Flame",
    description: "Lute para sobreviver em ambientes hostis",
    gradient: "from-emerald-900/50 to-black",
  },
  {
    id: "cooperative",
    name: "Cooperativo",
    icon: "Users",
    description: "Jogos para jogar em equipe",
    gradient: "from-green-900/40 to-black",
  },
  {
    id: "indie",
    name: "Indie",
    icon: "Sparkles",
    description: "Jogos únicos de desenvolvedores independentes",
    gradient: "from-pink-900/50 to-black",
  },
];
