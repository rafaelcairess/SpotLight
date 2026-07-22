/**
 * Hook de dados/estado (useGames).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GameData } from "@/types/game";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SupportedLocale } from "@/i18n/utils";
import { getPosterImage } from "@/lib/steam";
import { isLikelyGame } from "@/lib/gameFilters";
import { sortByPopularity } from "@/lib/sort";

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
  steam_url: string | null;
  last_synced: string;
};

type GameLocalizationRow = {
  app_id: number;
  locale: string;
  title: string | null;
  short_description: string | null;
  genre: string | null;
  tags: string[] | null;
  updated_at: string;
};

// Mapeia o formato do banco para o formato usado pela UI.
export const mapGameRow = (row: GameRow): GameData => ({
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

type SteamAppRow = {
  app_id: number;
  name: string;
  is_game: boolean | null;
  last_seen: string;
};

export type CatalogGame = GameData & { hasDetails: boolean };
type CatalogItem = { app_id: number; title: string; image?: string };

// Aplica campos localizados sem perder o fallback original.
const applyLocalization = (game: GameData, localization?: GameLocalizationRow | null): GameData => {
  if (!localization) return game;
  return {
    ...game,
    title: localization.title || game.title,
    short_description: localization.short_description || game.short_description,
    genre: localization.genre || game.genre,
    tags: localization.tags || game.tags,
  };
};

// Busca localizacoes por app_id + locale.
const fetchLocalizations = async (appIds: number[], locale: SupportedLocale) => {
  if (!appIds.length) return [] as GameLocalizationRow[];
  const { data, error } = await supabase
    .from("game_localizations")
    .select("app_id, locale, title, short_description, genre, tags, updated_at")
    .eq("locale", locale)
    .in("app_id", appIds);

  if (error) throw error;
  return (data ?? []) as GameLocalizationRow[];
};

// Mescla localizacoes mantendo a ordem original da lista.
const mergeLocalizations = (games: GameData[], localizations: GameLocalizationRow[]) => {
  if (!localizations.length) return games;
  const map = new Map(localizations.map((row) => [row.app_id, row]));
  return games.map((game) => applyLocalization(game, map.get(game.app_id)));
};

// Converte linhas do banco para o formato da UI + filtra nao-jogos.
const mapRowsToGames = (rows?: GameRow[]) =>
  (rows ?? []).map(mapGameRow).filter(isLikelyGame);

// Aplica localizacoes para o idioma atual.
const localizeGames = async (games: GameData[], locale: SupportedLocale) => {
  if (!games.length) return [];
  const localizations = await fetchLocalizations(games.map((game) => game.app_id), locale);
  return mergeLocalizations(games, localizations);
};

// Helper padrao para consultas de jogos com localizacoes e filtro de nao-jogos.
const fetchGamesWithLocalization = async (
  fetcher: () => PromiseLike<{ data: GameRow[] | null; error: unknown }>,
  locale: SupportedLocale
) => {
  const { data, error } = await fetcher();
  if (error) throw error;
  const games = mapRowsToGames(data as GameRow[]);
  return localizeGames(games, locale);
};

// Merge de itens do catalogo com detalhes/localizacao quando existirem.
// Quando nao existe detalhe, monta um GameData minimo com poster e placeholders.
const mergeCatalogItems = async (items: CatalogItem[], locale: SupportedLocale) => {
  if (!items.length) return [] as CatalogGame[];

  const appIds = items.map((item) => item.app_id);
  const [gamesResponse, localizations] = await Promise.all([
    supabase.from("games").select("*").in("app_id", appIds),
    fetchLocalizations(appIds, locale),
  ]);

  if (gamesResponse.error) throw gamesResponse.error;

  const gameMap = new Map(
    (gamesResponse.data as GameRow[]).map((row) => [row.app_id, mapGameRow(row)])
  );
  const localizationMap = new Map(localizations.map((row) => [row.app_id, row]));

  return items.map((item) => {
    const fullGame = gameMap.get(item.app_id);
    if (fullGame) {
      return {
        ...applyLocalization(fullGame, localizationMap.get(item.app_id)),
        hasDetails: true,
      };
    }
    const localized = localizationMap.get(item.app_id);
    return {
      app_id: item.app_id,
      title: localized?.title || item.title,
      image: item.image || getPosterImage(item.app_id),
      short_description: localized?.short_description || undefined,
      genre: localized?.genre || undefined,
      tags: localized?.tags || undefined,
      hasDetails: false,
    };
  });
};

export function usePopularGames(limit = 10) {
  const { locale } = useLanguage();

  return useQuery({
    queryKey: ["games", "popular", locale, limit],
    queryFn: async () => {
      return fetchGamesWithLocalization(
        () =>
          supabase
            .from("games")
            .select("*")
            .gte("community_rating", 72)
            .gt("active_players", 0)
            .order("active_players", { ascending: false })
            .limit(limit),
        locale
      );
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useAllGames(limit = 200, enabled = true) {
  const { locale } = useLanguage();

  return useQuery({
    queryKey: ["games", "all", locale, limit],
    queryFn: async () => {
      return fetchGamesWithLocalization(
        () =>
          supabase
            .from("games")
            .select("*")
            .order("last_synced", { ascending: false })
            .limit(limit),
        locale
      );
    },
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useDiscountedGamesPaged(limit = 30, page = 1) {
  const { locale } = useLanguage();

  return useQuery({
    queryKey: ["games", "discounted", "paged", locale, limit, page],
    queryFn: async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("games")
        .select("*", { count: "exact" })
        .gt("discount_percent", 0)
        .order("active_players", { ascending: false })
        .range(from, to);

      if (error) throw error;
      const games = mapRowsToGames(data as GameRow[]);
      const localized = await localizeGames(games, locale);
      return {
        games: localized,
        count: count ?? 0,
      };
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useGamesByIds(appIds: number[]) {
  const { locale } = useLanguage();
  const uniqueIds = Array.from(new Set(appIds.filter((id) => Number.isFinite(id))));

  return useQuery({
    queryKey: ["games", "by-ids", locale, uniqueIds],
    queryFn: async () => {
      if (uniqueIds.length === 0) return [];

      return fetchGamesWithLocalization(
        () => supabase.from("games").select("*").in("app_id", uniqueIds),
        locale
      );
    },
    enabled: uniqueIds.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useSearchGames(query: string, limit = 20) {
  const catalogQuery = useSearchCatalog(query, limit);
  return {
    ...catalogQuery,
    data: (catalogQuery.data ?? []).map(({ hasDetails, ...game }) => game),
  };
}

export function useSearchCatalog(query: string, limit = 20) {
  const { locale } = useLanguage();
  const normalized = query.trim();

  return useQuery<CatalogGame[]>({
    queryKey: ["games", "catalog-search", normalized, locale, limit],
    queryFn: async () => {
      if (normalized.length < 2) return [];

      // 1) Tenta via steam_apps (cache local do app list).
      let list: SteamAppRow[] = [];
      let appsFailed = false;

      try {
        const { data: apps, error: appsError } = await supabase
          .from("steam_apps")
          .select("app_id, name, is_game, last_seen")
          .or("is_game.is.null,is_game.eq.true")
          .textSearch("name", normalized, { type: "websearch", config: "simple" })
          .limit(limit);

        if (appsError) {
          appsFailed = true;
        } else {
          list = (apps ?? []) as SteamAppRow[];
        }
      } catch {
        appsFailed = true;
      }

      if (!appsFailed && list.length > 0) {
        const filteredList = list.filter((app) =>
          isLikelyGame({ title: app.name, tags: [], genre: undefined })
        );
        const merged = await mergeCatalogItems(
          filteredList.map((app) => ({ app_id: app.app_id, title: app.name })),
          locale
        );
        return sortByPopularity(merged);
      }

      // Fallback 1: consulta direta na tabela games para nao ficar sem resultado.
      const { data: gamesFallback, error: gamesFallbackError } = await supabase
        .from("games")
        .select("*")
        .ilike("title", `%${normalized}%`)
        .order("active_players", { ascending: false })
        .limit(limit);

      if (!gamesFallbackError && (gamesFallback?.length ?? 0) > 0) {
        const games = mapRowsToGames(gamesFallback as GameRow[]);
        const localized = await localizeGames(games, locale);
        const merged = localized.map((game) => ({
          ...game,
          hasDetails: true,
        }));
        return sortByPopularity(merged);
      }

      // Fallback 2: consulta via edge function quando o cache local falha.
      const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke(
        "search-steam",
        { body: { query: normalized, limit, language: locale } },
      );

      if (fallbackError) {
        return [];
      }

      const items = (fallbackData?.items ?? []) as CatalogItem[];

      const filteredItems = items.filter((item) =>
        isLikelyGame({ title: item.title, tags: [], genre: undefined })
      );

      if (filteredItems.length === 0) return [];

      const merged = await mergeCatalogItems(filteredItems, locale);
      return sortByPopularity(merged);
    },
    enabled: normalized.length >= 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useGameById(appId?: number) {
  const { locale } = useLanguage();
  const validId = Number.isFinite(appId) && (appId ?? 0) > 0;

  return useQuery({
    queryKey: ["games", "by-id", locale, appId],
    queryFn: async () => {
      if (!validId) return null;

      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("app_id", appId as number)
        .maybeSingle();

      if (error) throw error;
      const game = data ? mapGameRow(data as GameRow) : null;
      if (!game) return null;

      const localized = await localizeGames([game], locale);
      return localized[0] ?? game;
    },
    enabled: validId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useEnsureGameDetails() {
  const { locale } = useLanguage();
  const queryClient = useQueryClient();

  return useMutation({
    // Busca detalhes completos na Steam via edge function.
    mutationFn: async (appId: number) => {
      const { data, error } = await supabase.functions.invoke("fetch-steam-details", {
        body: { app_id: appId, language: locale },
      });
      if (error) throw error;
      return data as { status: string; app_id: number };
    },
    // Revalida caches que dependem do detalhe do jogo.
    onSuccess: (_, appId) => {
      queryClient.invalidateQueries({ queryKey: ["games", "by-id", appId] });
      queryClient.invalidateQueries({ queryKey: ["games", "by-ids"] });
      queryClient.invalidateQueries({ queryKey: ["games", "catalog-search"] });
      queryClient.invalidateQueries({ queryKey: ["games", "localization"] });
    },
  });
}

export function useDailyFeaturedGame() {
  const { locale } = useLanguage();

  return useQuery({
    queryKey: ["games", "featured", "daily", locale],
    queryFn: async () => {
      const { data: featured, error: featuredError } = await supabase
        .from("daily_featured")
        .select("app_id, featured_date")
        .order("featured_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (featuredError) throw featuredError;
      if (!featured?.app_id) return null;

      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("app_id", featured.app_id)
        .single();

      if (gameError) throw gameError;
      const mapped = mapGameRow(game as GameRow);
      const localized = await localizeGames([mapped], locale);
      return localized[0] ?? mapped;
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
