import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import GameCard from "@/components/GameCard";
import GameModal from "@/components/GameModal";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { GameData, CATEGORIES } from "@/types/game";
import { useGamesByIds } from "@/hooks/useGames";

const uniqueIds = (ids: number[]) => Array.from(new Set(ids));

const CATEGORY_GAME_IDS: Record<string, number[]> = {
  "coop-2-couch": uniqueIds([
    1426210, 268910, 413150, 105600, 477160,
    291550, 620, 960090, 1276390, 945360,
    1097150, 1794680, 1942280, 322330, 550,
    218620, 548430, 552500, 632360, 4000,
  ]),
  "coop-2-online": uniqueIds([
    1426210, 239140, 534380, 49520, 397540,
    582010, 1446780, 1623730, 1604030, 346110,
    244850, 108600, 962130, 275850, 251570,
    815370, 548430, 218620, 1172620, 892970,
  ]),
  "coop-4-couch": uniqueIds([
    291550, 477160, 105600, 413150, 268910,
    1794680, 1942280, 620, 960090, 1276390,
    945360, 1097150, 322330, 550, 218620,
    548430, 552500, 632360, 248820, 4000,
  ]),
  "coop-4-online": uniqueIds([
    550, 218620, 322330, 548430, 892970,
    1172620, 632360, 648800, 552500, 346110,
    244850, 108600, 251570, 815370, 1623730,
    4000, 248820, 49520, 397540, 239140,
  ]),
  cooperative: uniqueIds([
    1426210, 268910, 413150, 105600, 477160,
    291550, 322330, 548430, 550, 218620,
    892970, 1172620, 632360, 648800, 552500,
    239140, 534380, 582010, 1446780, 1623730,
  ]),
  casual: uniqueIds([
    413150, 1794680, 1942280, 960090, 1276390,
    477160, 1097150, 945360, 620, 400,
    391540, 646570, 268910, 433340, 504230,
    1222670, 291550, 431960, 264710, 632470,
  ]),
  action: uniqueIds([
    730, 1172470, 578080, 252490, 782330,
    271590, 359550, 230410, 440, 553850,
    1240440, 976730, 397540, 218620, 239140,
    534380, 374320, 1203220, 1144200, 686810,
  ]),
  sports: uniqueIds([
    1551360, 805550, 244210, 270880, 227300,
    236390, 730, 578080, 1172470, 570,
    230410, 440, 553850, 218230, 444090,
    291550, 359550, 1203220, 8500, 271590,
  ]),
  "sci-fi-cyberpunk": uniqueIds([
    1091500, 275850, 359320, 553850, 1240440,
    976730, 1172380, 220200, 244850, 8500,
    230410, 281990, 264710, 848450, 870780,
    1190460, 1063730, 218230, 239140, 534380,
  ]),
  terror: uniqueIds([
    381210, 739630, 550, 239140, 534380,
    251570, 376210, 1326470, 815370, 108600,
    883710, 952060, 418370, 1196590, 254700,
    242760, 282140, 594650, 322330, 700330,
  ]),
  puzzle: uniqueIds([
    400, 620, 477160, 391540, 632470,
    504230, 646570, 264710, 433340, 268910,
    945360, 1097150, 960090, 1276390, 1794680,
    1942280, 291550, 413150, 105600, 500,
  ]),
  roguelike: uniqueIds([
    1145360, 646570, 588650, 632360, 248820,
    250900, 311690, 1794680, 1942280, 367520,
    504230, 261570, 1057090, 268910, 291550,
    433340, 264710, 632470, 391540, 105600,
  ]),
  racing: uniqueIds([
    1551360, 805550, 244210, 270880, 227300,
    271590, 12210, 236390, 359550, 730,
    578080, 1172470, 1240440, 218620, 550,
    49520, 397540, 239140, 534380, 686810,
  ]),
  "free-to-play": uniqueIds([
    570, 730, 578080, 1172470, 230410,
    440, 553850, 304930, 291550, 444090,
    218230, 1599340, 236390, 8500, 238960,
    1203220, 700330, 393380, 581320, 107410,
  ]),
  anime: uniqueIds([
    638970, 582010, 1446780, 524220, 1113560,
    814380, 1245620, 990080, 1172380, 1203220,
    268910, 812140, 870780, 1091500, 275850,
    359320, 391540, 367520, 261570, 1057090,
  ]),
  vr: uniqueIds([
    739630, 275850, 359320, 242760, 264710,
    848450, 236390, 244210, 805550, 620,
    400, 632360, 248820, 550, 218620,
    271590, 108600, 1172470, 730, 578080,
  ]),
  "open-world": uniqueIds([
    271590, 1174180, 292030, 1091500, 1245620,
    72850, 377160, 812140, 275850, 1593500,
    1151640, 1817070, 1817190, 1259420, 1888930,
    1659420, 990080, 239140, 534380, 1623730,
  ]),
  "city-building": uniqueIds([
    255710, 294100, 427520, 526870, 703080,
    493340, 535930, 281990, 1158310, 289070,
    8930, 236850, 203770, 394360, 594570,
    364360, 779340, 214950, 201270, 268500,
  ]),
  rpg: uniqueIds([
    292030, 1086940, 1091500, 1245620, 72850,
    377160, 20920, 20900, 435150, 524220,
    1113560, 1593500, 990080, 1172380, 814380,
    812140, 233860, 391540, 268910, 1142710,
  ]),
  "story-rich": uniqueIds([
    1174180, 292030, 1091500, 1593500, 1151640,
    1659420, 1888930, 1259420, 1190460, 1172380,
    990080, 638970, 524220, 1113560, 870780,
    72850, 377160, 20920, 20900, 812140,
  ]),
  simulation: uniqueIds([
    227300, 270880, 220200, 1222670, 255710,
    703080, 493340, 535930, 526870, 427520,
    431960, 244850, 294100, 236390, 582660,
    1046930, 805550, 244210, 281990, 359320,
  ]),
  adventure: uniqueIds([
    1593500, 1151640, 1659420, 1888930, 1259420,
    1172380, 1190460, 990080, 638970, 524220,
    1113560, 870780, 632470, 1174180, 292030,
    1091500, 72850, 377160, 812140, 268910,
  ]),
  fighting: uniqueIds([
    291550, 1203220, 374320, 1245620, 814380,
    268910, 550, 359550, 782330, 686810,
    1144200, 581320, 393380, 107410, 221100,
    252490, 239140, 534380, 397540, 49520,
  ]),
  survival: uniqueIds([
    252490, 346110, 892970, 648800, 108600,
    815370, 1326470, 251570, 242760, 221100,
    244850, 275850, 304930, 1623730, 1604030,
    962130, 376210, 440900, 239140, 534380,
  ]),
  indie: uniqueIds([
    413150, 367520, 1145360, 588650, 504230,
    261570, 1057090, 632470, 268910, 391540,
    646570, 250900, 311690, 1794680, 1942280,
    433340, 264710, 291550, 248820, 632360,
  ]),
};

const CollectionDetail = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const manualIds = categoryId ? CATEGORY_GAME_IDS[categoryId] ?? [] : [];
  const { data: manualGames = [], isLoading } = useGamesByIds(manualIds || []);

  const category = CATEGORIES.find((c) => c.id === categoryId);

  const manualOrder = new Map((manualIds || []).map((id, idx) => [id, idx]));
  const manualSorted = [...manualGames].sort(
    (a, b) => (manualOrder.get(a.app_id) ?? 0) - (manualOrder.get(b.app_id) ?? 0)
  );

  const games = manualSorted;
  const isPageLoading = isLoading;

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
