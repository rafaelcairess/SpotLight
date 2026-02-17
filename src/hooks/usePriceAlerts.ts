import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PriceAlert {
  id: string;
  user_id: string;
  game_id: number;
  target_price: number | null;
  is_active: boolean;
  notified_at: string | null;
  created_at: string;
}

// Hook para listar e gerenciar alertas de preÃ§o do usuÃ¡rio.
export function usePriceAlerts(gameId?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: ["price_alerts", user?.id, gameId ?? "all"],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from("price_alerts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (Number.isFinite(gameId)) {
        query = query.eq("game_id", Number(gameId));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PriceAlert[];
    },
    enabled: !!user?.id,
  });

  const addAlert = useMutation({
    mutationFn: async ({
      gameId: targetGameId,
      targetPrice,
    }: {
      gameId: number;
      targetPrice?: number | null;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("price_alerts")
        .upsert(
          {
            user_id: user.id,
            game_id: targetGameId,
            target_price: targetPrice ?? null,
            is_active: true,
            notified_at: null,
          },
          { onConflict: "user_id,game_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data as PriceAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price_alerts"] });
    },
  });

  const removeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("price_alerts")
        .update({ is_active: false })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price_alerts"] });
    },
  });

  return {
    alerts: alertsQuery.data ?? [],
    addAlert,
    removeAlert,
    isLoading: alertsQuery.isLoading,
  };
}
