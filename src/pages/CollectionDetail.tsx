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
  terror: ["horror", "terror"],
  rpg: ["rpg", "role-playing"],
  "story-rich": ["story rich", "narrative", "adventure"],
  action: ["action", "ação"],
  indie: ["indie"],
  survival: ["survival", "sobrevivência"],
  strategy: ["strategy", "estratégia", "rts", "turn-based"],
};

const CATEGORY_GAME_IDS: Record<string, number[]> = {
  "coop-2-couch": [
    1426210, // It Takes Two
    268910, // Cuphead
    413150, // Stardew Valley
    105600, // Terraria
    477160, // Human Fall Flat
    291550, // Brawlhalla
    1794680, // Vampire Survivors
  ],
  "coop-2-online": [
    1426210, // It Takes Two
    239140, // Dying Light
    534380, // Dying Light 2
    49520, // Borderlands 2
    397540, // Borderlands 3
    582010, // Monster Hunter: World
    1446780, // MONSTER HUNTER RISE
    1623730, // Palworld
    1604030, // V Rising
    346110, // ARK: Survival Evolved
    244850, // Space Engineers
    108600, // Project Zomboid
    962130, // Grounded
    275850, // No Man's Sky
    251570, // 7 Days to Die
    815370, // Green Hell
    291550, // Brawlhalla
  ],
  "coop-4-online": [
    550, // Left 4 Dead 2
    218620, // PAYDAY 2
    322330, // Don't Starve Together
    548430, // Deep Rock Galactic
    892970, // Valheim
    1172620, // Sea of Thieves
    632360, // Risk of Rain 2
    648800, // Raft
    552500, // Warhammer: Vermintide 2
    346110, // ARK: Survival Evolved
    244850, // Space Engineers
    108600, // Project Zomboid
    251570, // 7 Days to Die
    815370, // Green Hell
    1623730, // Palworld
    4000, // Garry's Mod
    248820, // Risk of Rain (2013)
  ],
  terror: [
    381210, // Dead by Daylight
    739630, // Phasmophobia
    550, // Left 4 Dead 2
    239140, // Dying Light
    534380, // Dying Light 2
    251570, // 7 Days to Die
    376210, // The Isle
    1326470, // Sons Of The Forest
    815370, // Green Hell
    108600, // Project Zomboid
  ],
  rpg: [
    292030, // The Witcher 3
    1086940, // Baldur's Gate 3
    1091500, // Cyberpunk 2077
    1245620, // Elden Ring
    1593500, // God of War
    990080, // Hogwarts Legacy
    1174180, // Red Dead Redemption 2
    239140, // Dying Light
  ],
  "story-rich": [
    1174180, // Red Dead Redemption 2
    292030, // The Witcher 3
    1172380, // STAR WARS Jedi: Fallen Order
    1091500, // Cyberpunk 2077
    1245620, // Elden Ring
    239140, // Dying Light
  ],
  action: [
    730, // Counter-Strike 2
    1172470, // Apex Legends
    578080, // PUBG
    271590, // GTA V
    359550, // Rainbow Six Siege
    782330, // DOOM Eternal
    553850, // Destiny 2
    440, // Team Fortress 2
  ],
  indie: [
    413150, // Stardew Valley
    367520, // Hollow Knight
    268910, // Cuphead
    391540, // Undertale
    294100, // RimWorld
    477160, // Human Fall Flat
    632360, // Risk of Rain 2
  ],
  survival: [
    252490, // Rust
    346110, // ARK: Survival Evolved
    892970, // Valheim
    648800, // Raft
    108600, // Project Zomboid
    815370, // Green Hell
    1326470, // Sons Of The Forest
    251570, // 7 Days to Die
    304930, // Unturned
  ],
  strategy: [
    289070, // Civilization VI
    8930, // Civilization V
    221380, // Age of Empires II (Retired)
    813780, // Age of Empires II: DE
    1466860, // Age of Empires IV
    236850, // Europa Universalis IV
    294100, // RimWorld
  ],
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
  const { categoryId } = useParams<{ categoryId: string }>();
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: allGames = [], isLoading } = useAllGames(200);
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

  const games = manualIds && manualIds.length > 0 ? manualSorted : keywordGames;
  const isPageLoading = manualIds && manualIds.length > 0 ? manualLoading : isLoading;

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
