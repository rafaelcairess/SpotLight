import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProfileCounts(userId?: string, canViewLibrary = false, canViewReviews = false) {
  return useQuery({
    queryKey: ["profile-content-counts", userId, canViewLibrary, canViewReviews],
    queryFn: async () => {
      if (!userId) return { games: 0, favorites: 0, platinums: 0, reviews: 0 };
      const [gamesResult, favoritesResult, platinumsResult, reviewsResult] = await Promise.all([
        canViewLibrary ? supabase.from("user_games").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_hidden", false) : Promise.resolve({ count: 0, error: null }),
        canViewLibrary ? supabase.from("user_games").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_hidden", false).eq("is_favorite", true) : Promise.resolve({ count: 0, error: null }),
        canViewLibrary ? supabase.from("user_games").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_hidden", false).eq("is_platinumed", true) : Promise.resolve({ count: 0, error: null }),
        canViewReviews ? supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", userId) : Promise.resolve({ count: 0, error: null }),
      ]);
      const error = gamesResult.error || favoritesResult.error || platinumsResult.error || reviewsResult.error;
      if (error) throw error;
      return {
        games: gamesResult.count ?? 0,
        favorites: favoritesResult.count ?? 0,
        platinums: platinumsResult.count ?? 0,
        reviews: reviewsResult.count ?? 0,
      };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
