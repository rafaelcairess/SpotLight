import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PresenceStatus = "online" | "away" | "busy" | "invisible";
export type VisiblePresence = "online" | "away" | "busy" | "offline";

export function resolvePresence(
  status?: string | null,
  lastSeenAt?: string | null,
): VisiblePresence {
  if (status === "invisible" || !lastSeenAt) return "offline";
  const active = Date.now() - new Date(lastSeenAt).getTime() < 3 * 60 * 1000;
  if (!active) return "offline";
  return status === "away" || status === "busy" ? status : "online";
}

export function PresenceHeartbeat() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user?.id) return;
    const touch = async () => {
      if (document.visibilityState === "visible") {
        const { data } = await supabase
          .from("profiles")
          .select("presence_status")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.presence_status !== "invisible") {
          await supabase
            .from("profiles")
            .update({ last_seen_at: new Date().toISOString() })
            .eq("user_id", user.id);
        }
      }
    };
    void touch();
    const interval = window.setInterval(() => void touch(), 90_000);
    const handleVisibility = () => void touch();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user?.id]);
  return null;
}

export function useSetPresence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (presenceStatus: PresenceStatus) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ presence_status: presenceStatus, last_seen_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}
