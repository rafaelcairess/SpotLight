import { isLikelyGame } from "@/lib/gameFilters";
import { isMatureGame } from "@/lib/matureFilter";
import { getEffectiveHours } from "@/lib/playtime";
import type { GameData } from "@/types/game";

export type RecommendationStatus = "wishlist" | "playing" | "completed" | "dropped";

export type RecommendationProfileGame = Pick<GameData, "app_id" | "genre" | "tags"> & {
  status: RecommendationStatus;
  is_favorite: boolean;
  is_platinumed: boolean;
  hours_played: number | null;
  hours_played_manual: number | null;
  hours_override: boolean;
};

export type RecommendationReview = {
  app_id: number;
  is_positive: boolean;
  score: number | null;
};

export type RankedRecommendation<T extends GameData = GameData> = {
  game: T;
  recommendationScore: number;
  matchedTags: string[];
};

type RankRecommendationOptions<T extends GameData> = {
  candidates: T[];
  profileGames: RecommendationProfileGame[];
  reviews: RecommendationReview[];
  limit?: number;
  includeMature?: boolean;
};

const GENERIC_TOKENS = new Set([
  "action",
  "acao",
  "adventure",
  "aventura",
  "casual",
  "indie",
  "singleplayer",
  "single player",
  "um jogador",
  "multiplayer",
  "multijogador",
  "early access",
  "acesso antecipado",
  "2d",
  "3d",
  "controller",
  "controle",
  "steam achievements",
  "conquistas steam",
  "free to play",
  "gratuito para jogar",
]);

const normalizeToken = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const splitGenre = (genre?: string) =>
  (genre ?? "")
    .split(/[,;/|]/)
    .map((token) => token.trim())
    .filter(Boolean);

const displayTokens = (game: Pick<GameData, "genre" | "tags">) =>
  Array.from(new Set([...splitGenre(game.genre), ...(game.tags ?? [])].filter(Boolean)));

const normalizedTokens = (game: Pick<GameData, "genre" | "tags">) =>
  Array.from(new Set(displayTokens(game).map(normalizeToken).filter(Boolean)));

const isInformativeToken = (token: string) => !GENERIC_TOKENS.has(normalizeToken(token));

const hasReliableQuality = (game: GameData) => {
  const rating = game.communityRating ?? 0;
  const players = game.activePlayers ?? 0;

  return (
    (rating >= 88 && players >= 20) ||
    (rating >= 82 && players >= 75) ||
    (rating >= 78 && players >= 500)
  );
};

const qualityScore = (game: GameData) => {
  const rating = Math.max(0, Math.min(1, ((game.communityRating ?? 75) - 75) / 25));
  const popularity = Math.max(0, Math.min(1, Math.log10((game.activePlayers ?? 0) + 1) / 5));
  return rating * 0.78 + popularity * 0.22;
};

const librarySignal = (game: RecommendationProfileGame) => {
  let signal =
    game.status === "playing"
      ? 1.75
      : game.status === "completed"
        ? 2.5
        : game.status === "dropped"
          ? -2.5
          : 0.35;

  if (game.is_favorite) signal += 4;
  if (game.is_platinumed) signal += 3.5;

  const hours = getEffectiveHours(game);
  if (typeof hours === "number" && hours > 0) {
    signal += Math.min(3.5, (Math.log1p(hours) / Math.log(101)) * 3.5);
  }

  return signal;
};

const reviewSignal = (review?: RecommendationReview) => {
  if (!review) return 0;
  const positive = (review.score ?? (review.is_positive ? 4 : 1)) >= 3;
  if (!positive) return -5;
  return 3.5 + Math.max(0, Math.min(1.5, ((review.score ?? 4) - 3) * 0.75));
};

const buildPreferenceWeights = (
  profileGames: RecommendationProfileGame[],
  reviews: RecommendationReview[],
) => {
  const weights = new Map<string, number>();
  const reviewsByGame = new Map(reviews.map((review) => [review.app_id, review]));

  for (const game of profileGames) {
    const tokens = normalizedTokens(game);
    if (!tokens.length) continue;

    const signal = librarySignal(game) + reviewSignal(reviewsByGame.get(game.app_id));
    const normalization = Math.sqrt(tokens.length);

    for (const token of tokens) {
      const specificity = isInformativeToken(token) ? 1 : 0.16;
      weights.set(token, (weights.get(token) ?? 0) + (signal * specificity) / normalization);
    }
  }

  const maxPositiveWeight = Math.max(
    1,
    ...Array.from(weights.values()).filter((value) => value > 0),
  );
  for (const [token, weight] of weights) {
    weights.set(token, weight / maxPositiveWeight);
  }

  return weights;
};

const diversityKey = (game: GameData) => {
  const genre = splitGenre(game.genre).find(isInformativeToken);
  const fallback = (game.tags ?? []).find(isInformativeToken);
  return normalizeToken(genre ?? fallback ?? "outros");
};

const tagOverlap = (left: GameData, right: GameData) => {
  const leftTokens = new Set(normalizedTokens(left).filter(isInformativeToken));
  const rightTokens = new Set(normalizedTokens(right).filter(isInformativeToken));
  if (!leftTokens.size || !rightTokens.size) return 0;

  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection += 1;
  }
  return intersection / new Set([...leftTokens, ...rightTokens]).size;
};

const diversify = <T extends GameData>(ranked: RankedRecommendation<T>[], limit: number) => {
  const pool = [...ranked];
  const selected: RankedRecommendation<T>[] = [];
  const genreCounts = new Map<string, number>();

  while (pool.length && selected.length < limit) {
    let bestIndex = -1;
    let bestAdjustedScore = Number.NEGATIVE_INFINITY;

    for (let index = 0; index < pool.length; index += 1) {
      const candidate = pool[index];
      const key = diversityKey(candidate.game);
      const repeatedGenre = genreCounts.get(key) ?? 0;
      const hasAlternative = pool.some((item) => diversityKey(item.game) !== key);
      if (repeatedGenre >= 3 && hasAlternative) continue;

      const maximumOverlap = selected.reduce(
        (maximum, item) => Math.max(maximum, tagOverlap(item.game, candidate.game)),
        0,
      );
      const adjustedScore =
        candidate.recommendationScore - repeatedGenre * 5.5 - maximumOverlap * 8;

      if (adjustedScore > bestAdjustedScore) {
        bestAdjustedScore = adjustedScore;
        bestIndex = index;
      }
    }

    if (bestIndex < 0) bestIndex = 0;
    const [picked] = pool.splice(bestIndex, 1);
    selected.push(picked);
    const key = diversityKey(picked.game);
    genreCounts.set(key, (genreCounts.get(key) ?? 0) + 1);
  }

  return selected;
};

export const rankPersonalRecommendations = <T extends GameData>({
  candidates,
  profileGames,
  reviews,
  limit = 10,
  includeMature = false,
}: RankRecommendationOptions<T>): RankedRecommendation<T>[] => {
  const ownedIds = new Set(profileGames.map((game) => game.app_id));
  const preferenceWeights = buildPreferenceWeights(profileGames, reviews);

  const eligible = candidates.filter(
    (game) =>
      !ownedIds.has(game.app_id) &&
      Boolean(game.title && game.image) &&
      isLikelyGame(game) &&
      (includeMature || !isMatureGame(game)) &&
      hasReliableQuality(game),
  );

  const personalized = eligible
    .map((game) => {
      const tokens = displayTokens(game);
      const positiveMatches = tokens
        .map((display) => ({
          display,
          weight: preferenceWeights.get(normalizeToken(display)) ?? 0,
        }))
        .filter(({ display, weight }) => weight > 0 && isInformativeToken(display))
        .sort((a, b) => b.weight - a.weight);

      if (!positiveMatches.length) return null;

      const affinity =
        positiveMatches.slice(0, 5).reduce((sum, match) => sum + match.weight, 0) /
        Math.sqrt(Math.min(5, positiveMatches.length));

      return {
        game,
        recommendationScore: affinity * 72 + qualityScore(game) * 28,
        matchedTags: positiveMatches.slice(0, 2).map(({ display }) => display),
      } satisfies RankedRecommendation<T>;
    })
    .filter((item): item is RankedRecommendation<T> => Boolean(item))
    .sort((a, b) => b.recommendationScore - a.recommendationScore);

  const personalizedIds = new Set(personalized.map(({ game }) => game.app_id));
  const qualityFallback = eligible
    .filter((game) => !personalizedIds.has(game.app_id))
    .map((game) => ({
      game,
      recommendationScore: qualityScore(game) * 28,
      matchedTags: [],
    }))
    .sort((a, b) => b.recommendationScore - a.recommendationScore);

  return diversify([...personalized, ...qualityFallback], limit);
};
