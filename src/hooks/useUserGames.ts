import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type GameStatus = Database['public']['Enums']['game_status'];

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

export function useUserGames(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

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
  });
}

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
  });
}

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
      queryClient.invalidateQueries({ queryKey: ['user_games'] });
    },
  });
}

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
      queryClient.invalidateQueries({ queryKey: ['user_games'] });
    },
  });
}

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
      queryClient.invalidateQueries({ queryKey: ['user_games'] });
    },
  });
}
