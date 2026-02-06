import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type FriendStatus =
  | "none"
  | "pending_outgoing"
  | "pending_incoming"
  | "accepted"
  | "declined";

export interface FriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
}

export function useFriendStatus(targetUserId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["friend_status", user?.id, targetUserId],
    queryFn: async () => {
      if (!user?.id || !targetUserId) {
        return { status: "none" as FriendStatus };
      }

      const { data, error } = await supabase
        .from("friend_requests")
        .select("*")
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`
        )
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) {
        return { status: "none" as FriendStatus };
      }

      const request = data[0] as FriendRequest;
      if (request.status === "accepted") return { status: "accepted" as FriendStatus, request };
      if (request.status === "declined") return { status: "declined" as FriendStatus, request };

      const isOutgoing = request.requester_id === user.id;
      return {
        status: isOutgoing ? "pending_outgoing" : "pending_incoming",
        request,
      } as { status: FriendStatus; request: FriendRequest };
    },
    enabled: !!user?.id && !!targetUserId,
  });
}

export function useIncomingFriendRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["friend_requests", "incoming", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("friend_requests")
        .select("*")
        .eq("addressee_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FriendRequest[];
    },
    enabled: !!user?.id,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      addresseeId,
      message,
      link,
    }: {
      addresseeId: string;
      message: string;
      link?: string | null;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("friend_requests")
        .insert({
          requester_id: user.id,
          addressee_id: addresseeId,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: addresseeId,
        actor_id: user.id,
        type: "friend_request",
        message,
        link: link ?? null,
      });

      return data as FriendRequest;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["friend_status"] });
      queryClient.invalidateQueries({ queryKey: ["friend_requests", "incoming", variables.addresseeId] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      requestId,
      requesterId,
      message,
      link,
    }: {
      requestId: string;
      requesterId: string;
      message: string;
      link?: string | null;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: requesterId,
        actor_id: user.id,
        type: "friend_accept",
        message,
        link: link ?? null,
      });

      return data as FriendRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend_status"] });
      queryClient.invalidateQueries({ queryKey: ["friend_requests", "incoming"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeclineFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("friend_requests")
        .update({ status: "declined" })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;
      return data as FriendRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend_status"] });
      queryClient.invalidateQueries({ queryKey: ["friend_requests", "incoming"] });
    },
  });
}