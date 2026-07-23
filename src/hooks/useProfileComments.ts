import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProfileComment {
  id: string;
  profile_user_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author: { username: string; display_name: string | null; avatar_url: string | null };
}

export function useProfileComments(profileUserId?: string, enabled = true) {
  return useQuery({
    queryKey: ["profile-comments", profileUserId],
    queryFn: async () => {
      if (!profileUserId) return [] as ProfileComment[];
      const { data, error } = await supabase
        .from("profile_comments")
        .select("*")
        .eq("profile_user_id", profileUserId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const authorIds = [...new Set((data || []).map((comment) => comment.author_id))];
      const { data: profiles, error: profileError } = authorIds.length
        ? await supabase
            .from("profiles")
            .select("user_id, username, display_name, avatar_url")
            .in("user_id", authorIds)
        : { data: [], error: null };
      if (profileError) throw profileError;
      const authors = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
      return (data || []).map((comment) => ({
        ...comment,
        author: authors.get(comment.author_id) || {
          username: "jogador",
          display_name: "Jogador",
          avatar_url: null,
        },
      })) as ProfileComment[];
    },
    enabled: enabled && !!profileUserId,
  });
}

export function useAddProfileComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ profileUserId, content }: { profileUserId: string; content: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const cleanContent = content.trim();
      if (!cleanContent || cleanContent.length > 600) throw new Error("Invalid comment");
      const { error } = await supabase
        .from("profile_comments")
        .insert({ profile_user_id: profileUserId, author_id: user.id, content: cleanContent });
      if (error) throw error;
    },
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: ["profile-comments", variables.profileUserId] }),
  });
}

export function useDeleteProfileComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; profileUserId: string }) => {
      const { error } = await supabase.from("profile_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: ["profile-comments", variables.profileUserId] }),
  });
}
