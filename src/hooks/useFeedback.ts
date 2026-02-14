import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

export interface FeedbackItem {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  message: string;
  created_at: string;
}

const ADMIN_EMAILS = ["rafaelcairespires@gmail.com"];

export function useSendFeedback() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (payload: { name?: string; email?: string; message: string }) => {
      const message = payload.message.trim();
      if (!message) {
        throw new Error("Mensagem é obrigatória");
      }

      const name =
        payload.name?.trim() ||
        profile?.display_name ||
        profile?.username ||
        null;
      const email = payload.email?.trim() || user?.email || null;

      const { error } = await supabase
        .from("feedback")
        .insert({
          user_id: user?.id ?? null,
          name,
          email,
          message,
        });

      if (error) throw error;
      return {
        id: "",
        user_id: user?.id ?? null,
        name,
        email,
        message,
        created_at: new Date().toISOString(),
      } as FeedbackItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });
}

export function useFeedbackList() {
  const { user } = useAuth();
  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email);

  return useQuery({
    queryKey: ["feedback", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FeedbackItem[];
    },
    enabled: isAdmin,
  });
}
