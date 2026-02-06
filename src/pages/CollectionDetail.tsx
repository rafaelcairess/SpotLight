import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import GameCard from "@/components/GameCard";
import GameModal from "@/components/GameModal";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { GameData, CATEGORIES } from "@/types/game";
import { useAllGames, useGamesByIds } from "@/hooks/useGames";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "coop-2-couch": ["local co-op", "shared/split screen", "split screen"],
  "coop-2-online": ["online co-op", "co-op", "multiplayer"],
  "coop-4-couch": ["local co-op", "shared/split screen", "split screen"],
  "coop-4-online": ["online co-op", "co-op", "multiplayer"],
  cooperative: ["co-op", "coop", "multiplayer", "online co-op", "local co-op"],
  casual: ["casual", "relaxing", "family friendly"],
  terror: ["horror", "terror"],
  rpg: ["rpg", "role-playing"],
  "story-rich": ["story rich", "narrative", "adventure"],
  action: ["action", "ação"],
  sports: ["sports", "sport", "futebol", "football", "soccer", "basketball"],
  "sci-fi-cyberpunk": ["sci-fi", "science fiction", "cyberpunk", "futuristic", "space"],
  puzzle: ["puzzle", "quebra-cabeça", "logic"],
  roguelike: ["roguelike", "rogue-lite", "roguelite"],
  racing: ["racing", "corrida", "driving"],
  "free-to-play": ["free to play", "gratuito", "free"],
  anime: ["anime", "jrpg", "visual novel"],
  vr: ["vr", "virtual reality"],
  "open-world": ["open world", "mundo aberto", "sandbox"],
  "city-building": ["city builder", "city-building", "colony", "colony sim", "management", "base building"],
  simulation: ["simulation", "simulação", "simulator"],
  adventure: ["adventure", "aventura"],
  fighting: ["fighting", "luta", "beat 'em up"],
  indie: ["indie"],
  survival: ["survival", "sobrevivência"],
};

const BASE_POPULAR_IDS = [
  730, 570, 578080, 1172470, 252490, 1245620, 413150, 892970, 1174180, 1151340,
  1091500, 814380, 367520, 1145360, 782330, 105600, 1599340, 271590, 1086940,
  381210, 359550, 230410, 440, 304930, 553850, 431960, 550, 620, 1085660,
  570940,
];

const fillIds = (ids: number[], fallback = BASE_POPULAR_IDS, limit = 20) => {
  const unique = Array.from(new Set([...ids, ...fallback]));
  return unique.slice(0, limit);
};

const CATEGORY_GAME_IDS: Record<string, number[]> = {
  "coop-2-couch": fillIds([
    1426210, 268910, 413150, 105600, 477160, 291550, 1794680, 1942280, 620, 400, 960090,
  ]),
  "coop-2-online": fillIds([
    1426210, 239140, 534380, 49520, 397540, 582010, 1446780, 1623730, 1604030, 346110,
    244850, 108600, 962130, 275850, 251570, 815370, 548430, 218620, 1172620, 892970,
  ]),
  "coop-4-couch": fillIds([
    291550, 477160, 105600, 413150, 268910, 1794680, 1942280, 620, 400, 960090,
    1276390, 945360, 1097150,
  ]),
  "coop-4-online": fillIds([
    550, 218620, 322330, 548430, 892970, 1172620, 632360, 648800, 552500, 346110,
    244850, 108600, 251570, 815370, 1623730, 4000, 248820, 49520, 397540, 239140,
  ]),
  cooperative: fillIds([
    1426210, 268910, 413150, 105600, 477160, 291550, 322330, 548430, 550, 218620,
    892970, 1172620, 632360, 648800, 552500, 239140, 534380, 582010, 1446780, 1623730,
  ]),
  casual: fillIds([
    413150, 1794680, 1942280, 960090, 1276390, 477160, 1097150, 945360, 620, 400,
    391540, 646570, 268910, 433340, 504230, 1222670, 291550, 431960,
  ]),
  action: fillIds([
    730, 1172470, 578080, 252490, 782330, 271590, 359550, 553850, 230410, 440,
    1240440, 976730, 397540, 218620, 239140, 534380, 374320, 1203220, 1144200, 686810,
  ]),
  sports: fillIds([
    1551360, 805550, 236390, 1172470, 730, 578080, 271590, 359550,
  ]),
  "sci-fi-cyberpunk": fillIds([
    1091500, 275850, 359320, 553850, 1240440, 976730, 1172380, 220200, 244850, 8500,
    230410, 281990, 264710, 848450, 870780, 1190460,
  ]),
  terror: fillIds([
    381210, 739630, 550, 239140, 534380, 251570, 376210, 1326470, 815370, 108600,
    883710, 952060, 418370, 1196590, 254700, 242760, 282140, 594650,
  ]),
  puzzle: fillIds([
    400, 620, 477160, 391540, 632470, 504230, 646570, 264710,
  ]),
  roguelike: fillIds([
    1145360, 646570, 588650, 632360, 248820, 250900, 311690, 1794680, 1942280,
  ]),
  racing: fillIds([
    1551360, 805550, 270880, 227300, 271590,
  ]),
  "free-to-play": fillIds([
    570, 730, 578080, 1172470, 230410, 440, 553850, 304930, 291550, 444090,
    218230, 1599340, 236390, 8500, 238960,
  ]),
  anime: fillIds([
    638970, 582010, 1446780, 524220, 1113560, 814380, 1245620, 374320, 1203220, 990080,
    1172380,
  ]),
  vr: fillIds([
    739630, 275850, 359320, 236390, 242760, 264710, 848450, 620, 400,
  ]),
  "open-world": fillIds([
    271590, 1174180, 292030, 1091500, 1245620, 72850, 377160, 275850, 1593500, 1151640,
    1817070, 1817190, 1259420, 1888930, 1659420, 1517290, 990080, 239140,
  ]),
  "city-building": fillIds([
    255710, 294100, 427520, 526870, 703080, 493340, 535930, 281990, 1158310, 289070,
    8930,
  ]),
  rpg: fillIds([
    292030, 1086940, 1091500, 1245620, 72850, 377160, 20920, 20900, 435150, 524220,
    1113560, 1593500, 990080, 1172380, 814380,
  ]),
  "story-rich": fillIds([
    1174180, 292030, 1091500, 1593500, 1151640, 1659420, 1888930, 1259420, 1190460,
    1172380, 990080, 638970, 524220, 1113560, 870780,
  ]),
  simulation: fillIds([
    227300, 270880, 220200, 1222670, 255710, 703080, 493340, 535930, 526870, 427520,
    431960, 244850,
  ]),
  adventure: fillIds([
    1593500, 1151640, 1659420, 1888930, 1259420, 1172380, 1190460, 990080, 638970,
    524220, 1113560, 870780, 632470,
  ]),
  fighting: fillIds([
    291550, 1203220, 374320, 1245620, 814380, 268910, 550, 359550,
  ]),
  survival: fillIds([
    252490, 346110, 892970, 648800, 108600, 815370, 1326470, 251570, 242760, 221100,
    244850, 275850, 304930,
  ]),
  indie: fillIds([
    413150, 367520, 1145360, 588650, 504230, 261570, 1057090, 632470, 268910, 391540,
    646570, 250900, 311690, 1794680, 1942280, 433340,
  ]),
};

const matchesCategory = (game: GameData, categoryId: string) => {
  const keywords = CATEGORY_KEYWORDS[categoryId];
  if (!keywords || keywords.length === 0) return true;
  const haystack = [game.genre || "", ...(game.tags || [])]
    .map((value) => value.toLowerCase());

  return keywords.some((keyword) =>
    haystack.some((value) => value.includes(keyword.toLowerCase()))
  );
};

const CollectionDetail = () => {
  const AUTO_LIMIT = 30;
  const MIN_RESULTS = 20;
  const { categoryId } = useParams<{ categoryId: string }>();
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: allGames = [], isLoading } = useAllGames(400);
  const manualIds = categoryId ? CATEGORY_GAME_IDS[categoryId] : [];
  const { data: manualGames = [], isLoading: manualLoading } = useGamesByIds(manualIds || []);

  const category = CATEGORIES.find((c) => c.id === categoryId);

  const manualOrder = new Map((manualIds || []).map((id, idx) => [id, idx]));
  const manualSorted = [...manualGames].sort(
    (a, b) => (manualOrder.get(a.app_id) ?? 0) - (manualOrder.get(b.app_id) ?? 0)
  );

  const keywordGames = categoryId
    ? allGames.filter((game) => matchesCategory(game, categoryId))
    : allGames;

  const manualSet = new Set(manualIds || []);
  const autoSorted = [...keywordGames]
    .filter((game) => !manualSet.has(game.app_id))
    .sort((a, b) => {
      const ratingDiff = (b.communityRating ?? 0) - (a.communityRating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.activePlayers ?? 0) - (a.activePlayers ?? 0);
    });

  let autoLimited = autoSorted.slice(0, AUTO_LIMIT);

  if (manualSorted.length + autoLimited.length < MIN_RESULTS) {
    const missing = MIN_RESULTS - (manualSorted.length + autoLimited.length);
    const autoIds = new Set(autoLimited.map((game) => game.app_id));
    const fallback = [...allGames]
      .filter((game) => !manualSet.has(game.app_id) && !autoIds.has(game.app_id))
      .sort((a, b) => {
        const ratingDiff = (b.communityRating ?? 0) - (a.communityRating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.activePlayers ?? 0) - (a.activePlayers ?? 0);
      })
      .slice(0, missing);
    autoLimited = [...autoLimited, ...fallback];
  }

  const games =
    manualIds && manualIds.length > 0
      ? [...manualSorted, ...autoLimited]
      : autoLimited;

  const isPageLoading =
    isLoading || (manualIds && manualIds.length > 0 ? manualLoading : false);

  const handleGameClick = (game: GameData) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Categoria não encontrada</h1>
          <Link to="/collections">
            <Button>Voltar às Coleções</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 md:pt-28 pb-12">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link
            to="/collections"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar às Coleções
          </Link>

          {/* Category Header */}
          <div
            className={`relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br ${category.gradient} border border-border/30`}
          >
            <div className="absolute inset-0 hero-gradient opacity-30" />
            <div className="relative p-8 md:p-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {category.name}
              </h1>
              <p className="text-muted-foreground max-w-lg">
                {category.description}
              </p>
            </div>
          </div>

          {/* Games Grid */}
          {isPageLoading ? (
            <LoadingSkeleton variant="card" count={6} />
          ) : games.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum jogo encontrado nesta categoria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {games.map((game, idx) => (
                <GameCard
                  key={game.app_id}
                  game={game}
                  index={idx}
                  onClick={() => handleGameClick(game)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <GameModal
        game={selectedGame}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default CollectionDetail;
