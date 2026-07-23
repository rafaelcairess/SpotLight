/**
 * Hook de dados/estado (useTopGamesRanking).
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GameData } from "@/types/game";
import { TOP_GAMES_SERIES_CURATED } from "@/features/top/data/topGamesSeriesCurated";
import { includesAnyNormalized, normalizeText } from "@/lib/text";
import { getPosterImage } from "@/lib/steam";
import { isLikelyGame } from "@/lib/gameFilters";

type GameRow = {
  app_id: number;
  title: string;
  image: string | null;
  short_description: string | null;
  genre: string | null;
  tags: string[] | null;
  active_players: number | null;
  community_rating: number | null;
  price: string | null;
  price_original: string | null;
  discount_percent: number | null;
  release_date: string | null;
  developer: string | null;
  publisher: string | null;
  platforms: string[] | null;
};

export interface RankedGame extends GameData {
  isCurated: boolean;
  hasDetails?: boolean;
}

type SteamAppRow = {
  app_id: number;
  name: string;
  is_game: boolean | null;
};

const mapGameRow = (row: GameRow): GameData => ({
  app_id: row.app_id,
  title: row.title,
  image: row.image || "",
  short_description: row.short_description || undefined,
  genre: row.genre || undefined,
  tags: row.tags || undefined,
  activePlayers: row.active_players || undefined,
  communityRating: row.community_rating || undefined,
  price: row.price || undefined,
  priceOriginal: row.price_original || undefined,
  discountPercent: row.discount_percent || undefined,
  releaseDate: row.release_date || undefined,
  developer: row.developer || undefined,
  publisher: row.publisher || undefined,
  platforms: row.platforms || undefined,
});

// Cria um placeholder quando nao temos detalhes completos no catalogo.
const buildPlaceholderGame = (appId: number, title: string): GameData => ({
  app_id: appId,
  title,
  image: getPosterImage(appId),
});

// Busca um app por nome no cache de apps da Steam.
const findSteamApp = async (query: string) => {
  const { data, error } = await supabase
    .from("steam_apps")
    .select("app_id, name, is_game")
    .or("is_game.is.null,is_game.eq.true")
    .ilike("name", `%${query}%`)
    .limit(1)
    .maybeSingle();

  if (error) return null;
  const app = data as SteamAppRow | null;
  if (!app) return null;
  if (!isLikelyGame({ title: app.name, tags: [], genre: undefined })) return null;
  return app;
};

// Aplica filtros de genero/tag considerando normalizacao.
const matchesGenreAndTag = (game: GameData, genreFilter: string, tagFilter: string) => {
  const normalizedGenreFilter = normalizeText(genreFilter);
  const normalizedTagFilter = normalizeText(tagFilter);

  const tokens = [...(game.genre ? game.genre.split(",") : []), ...(game.tags || [])]
    .map((token) => normalizeText(token))
    .filter(Boolean);

  const genreOk = normalizedGenreFilter
    ? tokens.some((token) => token.includes(normalizedGenreFilter))
    : true;
  const tagOk = normalizedTagFilter
    ? tokens.some((token) => token.includes(normalizedTagFilter))
    : true;

  return genreOk && tagOk;
};

export function useTopGamesRanking(genreFilter = "", tagFilter = "", limit = 100) {
  return useQuery({
    queryKey: ["games", "ranking", "curated", genreFilter, tagFilter, limit],
    queryFn: async () => {
      // Monta termos unicos da curadoria para buscar no catalogo.
      const curatedTerms = Array.from(
        new Set(
          TOP_GAMES_SERIES_CURATED.flatMap((entry) => entry.match)
            .map((term) => term.trim())
            .filter(Boolean),
        ),
      );

      const curatedOr = curatedTerms.map((term) => `title.ilike.%${term}%`).join(",");

      // Busca em paralelo: pool curado + pool popular.
      const [
        { data: curatedData, error: curatedError },
        { data: popularData, error: popularError },
      ] = await Promise.all([
        curatedOr
          ? supabase.from("games").select("*").or(curatedOr)
          : supabase.from("games").select("*").limit(0),
        supabase
          .from("games")
          .select("*")
          .order("active_players", { ascending: false })
          .limit(1200),
      ]);

      if (curatedError) throw curatedError;
      if (popularError) throw popularError;

      const curatedPool = ((curatedData || []) as GameRow[]).map(mapGameRow);
      const popularPool = ((popularData || []) as GameRow[]).map(mapGameRow);
      const takenIds = new Set<number>();

      // Primeiro preenche a lista com a curadoria (por ordem declarada).
      const curated: RankedGame[] = [];
      for (const entry of TOP_GAMES_SERIES_CURATED) {
        const found = curatedPool.find(
          (game) =>
            !takenIds.has(game.app_id) &&
            includesAnyNormalized(game.title, entry.match) &&
            matchesGenreAndTag(game, genreFilter, tagFilter),
        );

        if (found) {
          takenIds.add(found.app_id);
          curated.push({ ...found, isCurated: true, hasDetails: true });
          continue;
        }

        // Fallback: tenta achar o app direto pelo nome na Steam.
        const fallbackQuery = entry.steamQuery || entry.label;
        const steamApp = await findSteamApp(fallbackQuery);
        if (!steamApp) continue;

        const placeholder = buildPlaceholderGame(steamApp.app_id, steamApp.name);
        if (!matchesGenreAndTag(placeholder, genreFilter, tagFilter)) {
          continue;
        }

        takenIds.add(steamApp.app_id);
        curated.push({ ...placeholder, isCurated: true, hasDetails: false });
      }

      // Preenche o restante com populares, respeitando filtros e evitando repeticao.
      const remaining = popularPool
        .filter((game) => !takenIds.has(game.app_id))
        .filter((game) => matchesGenreAndTag(game, genreFilter, tagFilter))
        .sort((a, b) => {
          const playersDiff = (b.activePlayers || 0) - (a.activePlayers || 0);
          if (playersDiff !== 0) return playersDiff;
          return (b.communityRating || 0) - (a.communityRating || 0);
        })
        .map((game) => ({ ...game, isCurated: false as const, hasDetails: true }));

      return [...curated, ...remaining].slice(0, limit);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
