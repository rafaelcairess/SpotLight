import { GameData } from "@/types/game";

const MATURE_KEYWORDS = [
  "nudity",
  "nudez",
  "conteudo sexual",
  "sexual content",
  "sexual",
  "hentai",
  "adult",
  "adulto",
  "mature",
  "erotico",
  "erotic",
  "explicit",
  "nsfw",
  "porn",
  "sexo",
];

export function isMatureGame(game: GameData): boolean {
  const values = [game.title, game.short_description ?? "", game.genre ?? "", ...(game.tags ?? [])].join(" ").toLowerCase();
  return MATURE_KEYWORDS.some((keyword) => values.includes(keyword));
}
