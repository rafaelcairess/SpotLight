/**
 * Hook de dados/estado (useUserGames).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Database } from '@/integrations/supabase/types';

type GameStatus = Database['public']['Enums']['game_status'];

// Entrada da biblioteca do usuário (uma linha por jogo).
export interface UserGame {
  id: string;
  user_id: string;
  app_id: number;
  status: GameStatus;
  hours_played: number | null;
  hours_played_manual: number | null;
  hours_override: boolean;
  is_favorite: boolean;
  is_hidden: boolean;
  is_private: boolean;
  is_platinumed: boolean;
  platinum_platforms: string[];
  last_played_at: string | null;
  playtime_2weeks: number | null;
  added_at: string;
  updated_at: string;
}

// Busca a biblioteca de um usuário (próprio ou público).
export function useUserGames(userId?: string, useAuthFallback = true, enabled = true) {
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
        .eq('is_hidden', false)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data as UserGame[];
    },
    enabled: enabled && !!targetUserId,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Busca a entrada do usuário logado para um jogo.
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

// Adiciona um jogo na biblioteca do usuário.
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
      // Atualiza a lista da biblioteca após adicionar.
      queryClient.invalidateQueries({ queryKey: ['user_games'] });
    },
  });
}

export type PlatinumPlatform = "steam" | "xbox" | "playstation";

export function useMarkGamePlatinum() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { locale } = useLanguage();

  return useMutation({
    mutationFn: async ({ appId, platform }: { appId: number; platform: PlatinumPlatform }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error: detailsError } = await supabase.functions.invoke("fetch-steam-details", {
        body: { app_id: appId, language: locale },
      });
      if (detailsError) throw detailsError;

      const { data: existing, error: existingError } = await supabase
        .from("user_games").select("id, platinum_platforms").eq("user_id", user.id).eq("app_id", appId).maybeSingle();
      if (existingError) throw existingError;

      const platforms = Array.from(new Set([...(existing?.platinum_platforms || []), platform]));
      const query = existing
        ? supabase.from("user_games").update({ is_platinumed: true, platinum_platforms: platforms }).eq("id", existing.id)
        : supabase.from("user_games").insert({ user_id: user.id, app_id: appId, status: "playing", is_platinumed: true, platinum_platforms: platforms });
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_games"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile-platinum-showcase"] });
    },
  });
}

// Garante que o jogo esteja na biblioteca e marcado como favorito.
export function useEnsureFavoriteGame() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { locale } = useLanguage();

  return useMutation({
    // Garante detalhes do jogo (melhor esforco) e marca como favorito.
    mutationFn: async (appId: number) => {
      if (!user?.id) throw new Error("Not authenticated");

      try {
        await supabase.functions.invoke("fetch-steam-details", {
          body: { app_id: appId, language: locale },
        });
      } catch {
        // Melhor esforço: se falhar, ainda salva favorito.
      }

      // Verifica se ja existe entrada na biblioteca.
      const { data: existing, error: existingError } = await supabase
        .from("user_games")
        .select("*")
        .eq("user_id", user.id)
        .eq("app_id", appId)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        // Atualiza somente o favorito se ja existir.
        const { data, error } = await supabase
          .from("user_games")
          .update({ is_favorite: true })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as UserGame;
      }

      // Se nao existir, cria a entrada ja como favorita.
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
      updates: Partial<
        Pick<
          UserGame,
          "status" | "hours_played" | "hours_played_manual" | "hours_override" | "is_favorite" | "is_hidden" | "is_private" | "is_platinumed" | "platinum_platforms"
        >
      >;
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
      // Atualiza a lista da biblioteca após editar.
      queryClient.invalidateQueries({ queryKey: ['user_games'] });
    },
  });
}

// Busca jogos ocultos do usuário logado.
export function useHiddenGames(enabled = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user_games_hidden', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_games')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_hidden', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as UserGame[];
    },
    enabled: enabled && !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Remove um jogo da biblioteca do usuário.
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
      // Atualiza a lista da biblioteca após remover.
      queryClient.invalidateQueries({ queryKey: ['user_games'] });
    },
  });
}
