import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GameData } from "@/types/game";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SupportedLocale } from "@/i18n/utils";

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

type SteamAppRow = {
  app_id: number;
  name: string;
  is_game: boolean | null;
  last_seen: string;
};

export type CatalogGame = GameData & { hasDetails: boolean };

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

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
  /\bexpansão\b/i,
];

const NON_GAME_TAG_MARKERS = [
  "dlc",
  "soundtrack",
  "demo",
  "expansion",
  "season pass",
  "artbook",
];

const isLikelyGame = (game: { title?: string; tags?: string[]; genre?: string }) => {
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

const getPosterImage = (appId: number) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;

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

const mergeLocalizations = (games: GameData[], localizations: GameLocalizationRow[]) => {
  if (!localizations.length) return games;
  const map = new Map(localizations.map((row) => [row.app_id, row]));
  return games.map((game) => applyLocalization(game, map.get(game.app_id)));
};

export function usePopularGames(limit = 10) {
  const { locale } = useLanguage();

  return useQuery({
    queryKey: ["games", "popular", locale, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("active_players", { ascending: false })
        .limit(limit);

      if (error) throw error;
      const games = (data as GameRow[]).map(mapGameRow).filter(isLikelyGame);
      const localizations = await fetchLocalizations(games.map((game) => game.app_id), locale);
      return mergeLocalizations(games, localizations);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useTopRatedGames(limit = 12) {
  const { locale } = useLanguage();

  return useQuery({
    queryKey: ["games", "top-rated", locale, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("community_rating", { ascending: false })
        .limit(limit);

      if (error) throw error;
      const games = (data as GameRow[]).map(mapGameRow).filter(isLikelyGame);
      const localizations = await fetchLocalizations(games.map((game) => game.app_id), locale);
      return mergeLocalizations(games, localizations);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useAllGames(limit = 200) {
  const { locale } = useLanguage();

  return useQuery({
    queryKey: ["games", "all", locale, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("last_synced", { ascending: false })
        .limit(limit);

      if (error) throw error;
      const games = (data as GameRow[]).map(mapGameRow).filter(isLikelyGame);
      const localizations = await fetchLocalizations(games.map((game) => game.app_id), locale);
      return mergeLocalizations(games, localizations);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useDiscountedGames(limit = 30) {
  const { locale } = useLanguage();

  return useQuery({
    queryKey: ["games", "discounted", locale, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .gt("discount_percent", 0)
        .order("active_players", { ascending: false })
        .limit(limit);

      if (error) throw error;
      const games = (data as GameRow[]).map(mapGameRow).filter(isLikelyGame);
      const localizations = await fetchLocalizations(games.map((game) => game.app_id), locale);
      return mergeLocalizations(games, localizations);
    },
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
      const games = (data as GameRow[]).map(mapGameRow).filter(isLikelyGame);
      const localizations = await fetchLocalizations(games.map((game) => game.app_id), locale);
      return {
        games: mergeLocalizations(games, localizations),
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

      const { data, error } = await supabase
        .from("games")
        .select("*")
        .in("app_id", uniqueIds);

      if (error) throw error;
      const games = (data as GameRow[]).map(mapGameRow).filter(isLikelyGame);
      const localizations = await fetchLocalizations(games.map((game) => game.app_id), locale);
      return mergeLocalizations(games, localizations);
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
        const appIds = filteredList.map((app) => app.app_id);
        const [gamesResponse, localizations] = await Promise.all([
          supabase.from("games").select("*").in("app_id", appIds),
          fetchLocalizations(appIds, locale),
        ]);

        if (gamesResponse.error) throw gamesResponse.error;

        const gameMap = new Map(
          (gamesResponse.data as GameRow[]).map((row) => [row.app_id, mapGameRow(row)])
        );
        const localizationMap = new Map(localizations.map((row) => [row.app_id, row]));

        const merged = filteredList.map((app) => {
          const fullGame = gameMap.get(app.app_id);
          if (fullGame) {
            return { ...applyLocalization(fullGame, localizationMap.get(app.app_id)), hasDetails: true };
          }
          const localized = localizationMap.get(app.app_id);
          return {
            app_id: app.app_id,
            title: localized?.title || app.name,
            image: getPosterImage(app.app_id),
            short_description: localized?.short_description || undefined,
            genre: localized?.genre || undefined,
            tags: localized?.tags || undefined,
            hasDetails: false,
          };
        });

        return merged.sort((a, b) => {
          const playersDiff = (b.activePlayers ?? 0) - (a.activePlayers ?? 0);
          if (playersDiff !== 0) return playersDiff;
          const ratingDiff = (b.communityRating ?? 0) - (a.communityRating ?? 0);
          if (ratingDiff !== 0) return ratingDiff;
          return a.title.localeCompare(b.title);
        });
      }

      // Fallback 1: if the catalog is empty, try searching the existing games table
      // so we still return something even if the applist job has not run yet.
      const { data: gamesFallback, error: gamesFallbackError } = await supabase
        .from("games")
        .select("*")
        .ilike("title", `%${normalized}%`)
        .order("active_players", { ascending: false })
        .limit(limit);

      if (!gamesFallbackError && (gamesFallback?.length ?? 0) > 0) {
        const games = (gamesFallback as GameRow[]).map(mapGameRow).filter(isLikelyGame);
        const localizations = await fetchLocalizations(games.map((game) => game.app_id), locale);
        const merged = mergeLocalizations(games, localizations).map((game) => ({
          ...game,
          hasDetails: true,
        }));
        return merged.sort((a, b) => {
          const playersDiff = (b.activePlayers ?? 0) - (a.activePlayers ?? 0);
          if (playersDiff !== 0) return playersDiff;
          const ratingDiff = (b.communityRating ?? 0) - (a.communityRating ?? 0);
          if (ratingDiff !== 0) return ratingDiff;
          return a.title.localeCompare(b.title);
        });
      }

      const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke(
        "search-steam",
        { body: { query: normalized, limit, language: locale } },
      );

      if (fallbackError) {
        return [];
      }

      const items = (fallbackData?.items ?? []) as Array<{
        app_id: number;
        title: string;
        image?: string;
      }>;

      const filteredItems = items.filter((item) =>
        isLikelyGame({ title: item.title, tags: [], genre: undefined })
      );

      if (filteredItems.length === 0) return [];

      const fallbackIds = filteredItems.map((item) => item.app_id);
      const [gameRowsResponse, localizations] = await Promise.all([
        supabase.from("games").select("*").in("app_id", fallbackIds),
        fetchLocalizations(fallbackIds, locale),
      ]);

      const gameMap = new Map(
        ((gameRowsResponse.data ?? []) as GameRow[]).map((row) => [row.app_id, mapGameRow(row)])
      );
      const localizationMap = new Map(localizations.map((row) => [row.app_id, row]));

      const merged = filteredItems.map((item) => {
        const fullGame = gameMap.get(item.app_id);
        if (fullGame) {
          return { ...applyLocalization(fullGame, localizationMap.get(item.app_id)), hasDetails: true };
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

      return merged.sort((a, b) => {
        const playersDiff = (b.activePlayers ?? 0) - (a.activePlayers ?? 0);
        if (playersDiff !== 0) return playersDiff;
        const ratingDiff = (b.communityRating ?? 0) - (a.communityRating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
        return a.title.localeCompare(b.title);
      });
    },
    enabled: normalized.length >= 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useGameLocalization(appId?: number) {
  const { locale } = useLanguage();
  const validId = Number.isFinite(appId) && (appId ?? 0) > 0;

  return useQuery({
    queryKey: ["games", "localization", locale, appId],
    queryFn: async () => {
      if (!validId) return null;

      const { data, error } = await supabase
        .from("game_localizations")
        .select("app_id, locale, title, short_description, genre, tags, updated_at")
        .eq("locale", locale)
        .eq("app_id", appId as number)
        .maybeSingle();

      if (error) throw error;
      return (data ?? null) as GameLocalizationRow | null;
    },
    enabled: validId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
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

      const localizations = await fetchLocalizations([game.app_id], locale);
      return applyLocalization(game, localizations[0]);
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
    mutationFn: async (appId: number) => {
      const { data, error } = await supabase.functions.invoke("fetch-steam-details", {
        body: { app_id: appId, language: locale },
      });
      if (error) throw error;
      return data as { status: string; app_id: number };
    },
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
      const localizations = await fetchLocalizations([mapped.app_id], locale);
      return applyLocalization(mapped, localizations[0]);
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
