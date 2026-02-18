import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ReviewReactionType = "like" | "dislike" | "funny" | "useful";

export interface ReviewReactionRow {
  id: string;
  review_id: string;
  user_id: string;
  reaction: ReviewReactionType;
  created_at: string;
}

interface ReviewReactionsResult {
  rows: ReviewReactionRow[];
  counts: Map<string, Record<ReviewReactionType, number>>;
  userReactions: Map<string, Set<ReviewReactionType>>;
}

const EMPTY_COUNTS: Record<ReviewReactionType, number> = {
  like: 0,
  dislike: 0,
  funny: 0,
  useful: 0,
};

function ensureCounts(
  map: Map<string, Record<ReviewReactionType, number>>,
  reviewId: string
) {
  if (!map.has(reviewId)) {
    map.set(reviewId, { ...EMPTY_COUNTS });
  }
  return map.get(reviewId)!;
}

function ensureUserSet(
  map: Map<string, Set<ReviewReactionType>>,
  reviewId: string
) {
  if (!map.has(reviewId)) {
    map.set(reviewId, new Set());
  }
  return map.get(reviewId)!;
}

// Carrega reações para uma lista de reviews (contagens + reações do usuário logado).
export function useReviewReactions(reviewIds: string[]) {
  const { user } = useAuth();
  const normalizedIds = [...new Set(reviewIds)].filter(Boolean).sort();

  return useQuery<ReviewReactionsResult>({
    queryKey: ["review_reactions", normalizedIds],
    enabled: normalizedIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_reactions")
        .select("id, review_id, user_id, reaction, created_at")
        .in("review_id", normalizedIds);

      if (error) throw error;
      const rows = (data ?? []) as ReviewReactionRow[];
      const counts = new Map<string, Record<ReviewReactionType, number>>();
      const userReactions = new Map<string, Set<ReviewReactionType>>();

      for (const row of rows) {
        const reviewCounts = ensureCounts(counts, row.review_id);
        reviewCounts[row.reaction] += 1;

        if (user?.id && row.user_id === user.id) {
          const userSet = ensureUserSet(userReactions, row.review_id);
          userSet.add(row.reaction);
        }
      }

      return { rows, counts, userReactions };
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Adiciona uma reação do usuário na review.
export function useAddReviewReaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      reaction,
    }: {
      reviewId: string;
      reaction: ReviewReactionType;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("review_reactions")
        .insert({
          review_id: reviewId,
          user_id: user.id,
          reaction,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ReviewReactionRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review_reactions"] });
    },
  });
}

// Remove uma reação do usuário na review.
export function useRemoveReviewReaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      reaction,
    }: {
      reviewId: string;
      reaction: ReviewReactionType;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("review_reactions")
        .delete()
        .eq("review_id", reviewId)
        .eq("user_id", user.id)
        .eq("reaction", reaction);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review_reactions"] });
    },
  });
}
