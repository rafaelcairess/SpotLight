import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ProfileSummary } from "@/hooks/useFollows";

export type FriendshipState = "none" | "outgoing" | "incoming" | "friends";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
}

export function useFriendship(otherUserId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["friendship", user?.id, otherUserId],
    queryFn: async () => {
      if (!user?.id || !otherUserId || user.id === otherUserId) return null;
      const { data, error } = await supabase
        .from("friend_requests")
        .select("id, requester_id, addressee_id, status")
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${user.id})`,
        )
        .in("status", ["pending", "accepted"])
        .maybeSingle();
      if (error) throw error;
      return data as Friendship | null;
    },
    enabled: !!user?.id && !!otherUserId && user.id !== otherUserId,
  });
}

export function getFriendshipState(
  friendship: Friendship | null | undefined,
  currentUserId?: string,
): FriendshipState {
  if (!friendship || !currentUserId) return "none";
  if (friendship.status === "accepted") return "friends";
  return friendship.requester_id === currentUserId ? "outgoing" : "incoming";
}

export function useFriends(userId?: string) {
  return useQuery({
    queryKey: ["friends", userId],
    queryFn: async () => {
      if (!userId) return [] as ProfileSummary[];
      const { data, error } = await supabase
        .from("friend_requests")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
      if (error) throw error;
      const ids = (data || []).map((row) =>
        row.requester_id === userId ? row.addressee_id : row.requester_id,
      );
      if (!ids.length) return [] as ProfileSummary[];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, presence_status, last_seen_at")
        .in("user_id", ids);
      if (profilesError) throw profilesError;
      const byId = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
      return ids.map((id) => byId.get(id)).filter(Boolean) as ProfileSummary[];
    },
    enabled: !!userId,
  });
}

export function useFriendRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["friend-requests", user?.id],
    queryFn: async () => {
      if (!user?.id)
        return { incoming: [], outgoing: [] } as {
          incoming: Array<Friendship & { profile: ProfileSummary }>;
          outgoing: Array<Friendship & { profile: ProfileSummary }>;
        };
      const { data, error } = await supabase
        .from("friend_requests")
        .select("id, requester_id, addressee_id, status")
        .eq("status", "pending")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      if (error) throw error;
      const ids = (data || []).map((request) =>
        request.requester_id === user.id ? request.addressee_id : request.requester_id,
      );
      const { data: profiles, error: profileError } = ids.length
        ? await supabase
            .from("profiles")
            .select("user_id, username, display_name, avatar_url, presence_status, last_seen_at")
            .in("user_id", ids)
        : { data: [], error: null };
      if (profileError) throw profileError;
      const byId = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
      const enriched = (data || [])
        .map((request) => ({
          ...request,
          profile: byId.get(
            request.requester_id === user.id ? request.addressee_id : request.requester_id,
          ),
        }))
        .filter((request) => request.profile) as Array<Friendship & { profile: ProfileSummary }>;
      return {
        incoming: enriched.filter((request) => request.addressee_id === user.id),
        outgoing: enriched.filter((request) => request.requester_id === user.id),
      };
    },
    enabled: !!user?.id,
  });
}

function useFriendMutation(
  action: (input: {
    currentUserId: string;
    otherUserId: string;
    friendship?: Friendship | null;
  }) => Promise<void>,
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      otherUserId,
      friendship,
    }: {
      otherUserId: string;
      friendship?: Friendship | null;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      await action({ currentUserId: user.id, otherUserId, friendship });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendship"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });
}

export function useSendFriendRequest() {
  return useFriendMutation(async ({ currentUserId, otherUserId }) => {
    const { error } = await supabase
      .from("friend_requests")
      .insert({ requester_id: currentUserId, addressee_id: otherUserId });
    if (error) throw error;
  });
}

export function useAcceptFriendRequest() {
  return useFriendMutation(async ({ friendship }) => {
    if (!friendship) throw new Error("Friend request missing");
    const { error } = await supabase
      .from("friend_requests")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", friendship.id);
    if (error) throw error;
  });
}

export function useRemoveFriendship() {
  return useFriendMutation(async ({ friendship }) => {
    if (!friendship) throw new Error("Friendship missing");
    const { error } = await supabase.from("friend_requests").delete().eq("id", friendship.id);
    if (error) throw error;
  });
}
