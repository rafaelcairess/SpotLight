import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type GameStatus = Database['public']['Enums']['game_status'];

// Entrada da biblioteca do usuÃ¡rio (uma linha por jogo).
export interface UserGame {
  id: string;
  user_id: string;
  app_id: number;
  status: GameStatus;
  hours_played: number | null;
  is_favorite: boolean;
  is_platinumed: boolean;
  added_at: string;
  updated_at: string;
}

// Busca a biblioteca de um usuÃ¡rio (prÃ³prio ou pÃºblico).
export function useUserGames(userId?: string, useAuthFallback = true) {
  const { user } = useAuth();
  const targetUserId = userId ?? (useAuthFallback ? user?.id : undefined);

  return useQuery({
    queryKey: ['user_games', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const { data, error } = await supabase
        .from('user_games')
        .select('*')
        .eq('user_id', targetUserId)
        .order('added_at', { ascending: false });
      
      if (error) throw error;
      return data as UserGame[];
    },
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Busca a entrada do usuÃ¡rio logado para um jogo.
export function useUserGameByAppId(appId: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user_games', user?.id, appId],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_games')
        .select('*')
        .eq('user_id', user.id)
        .eq('app_id', appId)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserGame | null;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Adiciona um jogo na biblioteca do usuÃ¡rio.
export function useAddGame() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      appId, 
      status = 'wishlist' 
    }: { 
      appId: number; 
      status?: GameStatus;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('user_games')
        .insert({
          user_id: user.id,
          app_id: appId,
          status,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as UserGame;
    },
    onSuccess: () => {
      // Atualiza a lista da biblioteca apÃ³s adicionar.
      queryClient.invalidateQueries({ queryKey: ['user_games'] });
    },
  });
}

// Garante que o jogo esteja na biblioteca e marcado como favorito.
export function useEnsureFavoriteGame() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (appId: number) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data: existing, error: existingError } = await supabase
        .from("user_games")
        .select("*")
        .eq("user_id", user.id)
        .eq("app_id", appId)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        const { data, error } = await supabase
          .from("user_games")
          .update({ is_favorite: true })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as UserGame;
      }

      const { data, error } = await supabase
        .from("user_games")
        .insert({
          user_id: user.id,
          app_id: appId,
          status: "playing",
          is_favorite: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserGame;
    },
    onSuccess: () => {
      // Atualiza a lista da biblioteca após favoritar.
      queryClient.invalidateQueries({ queryKey: ["user_games"] });
    },
  });
}

// Atualiza uma entrada da biblioteca (status, horas, favorito, platina).
export function useUpdateGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Pick<UserGame, 'status' | 'hours_played' | 'is_favorite' | 'is_platinumed'>>;
    }) => {
      const { data, error } = await supabase
        .from('user_games')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as UserGame;
    },
    onSuccess: () => {
      // Atualiza a lista da biblioteca apÃ³s editar.
      queryClient.invalidateQueries({ queryKey: ['user_games'] });
    },
  });
}

// Remove um jogo da biblioteca do usuÃ¡rio.
export function useRemoveGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_games')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Atualiza a lista da biblioteca apÃ³s remover.
      queryClient.invalidateQueries({ queryKey: ['user_games'] });
    },
  });
}
