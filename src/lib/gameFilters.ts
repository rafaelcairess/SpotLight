/**
 * Helpers utilitários (gameFilters).
 */

import { normalizeText } from "@/lib/text";

const NON_GAME_TITLE_PATTERNS = [
  /\bdlc\b/i,
  /\bsoundtrack\b/i,
  /\bost\b/i,
  /\bdemo\b/i,
  /\bbeta\b/i,
  /\bprologue\b/i,
  /\bdedicated server\b/i,
  /\bserver\b/i,
  /\btool\b/i,
  /\beditor\b/i,
  /\bsdk\b/i,
  /\bmod\b/i,
  /\bartbook\b/i,
  /\bseason pass\b/i,
  /\bexpansion\b/i,
  /\badd-?on\b/i,
  /\bpack\b/i,
  /\bskin\b/i,
  /\bcosmetic\b/i,
  /\btrilha sonora\b/i,
  /\bpacote\b/i,
  /\bpasse\b/i,
  /\bexpansao\b/i,
];

const NON_GAME_TAG_MARKERS = ["dlc", "soundtrack", "demo", "expansion", "season pass", "artbook"];

type GameLike = {
  title?: string;
  tags?: string[];
  genre?: string;
};

export const isLikelyGame = (game: GameLike) => {
  const title = normalizeText(game.title ?? "");
  if (NON_GAME_TITLE_PATTERNS.some((pattern) => pattern.test(title))) {
    return false;
  }

  const tagBlob = normalizeText([game.genre ?? "", ...(game.tags ?? [])].join(" "));
  if (NON_GAME_TAG_MARKERS.some((marker) => tagBlob.includes(marker))) {
    return false;
  }

  return true;
};
