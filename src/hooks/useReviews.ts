import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Tipos de reviews usados por componentes e hooks.

export interface Review {
  id: string;
  user_id: string;
  app_id: number;
  content: string;
  is_positive: boolean;
  score: number | null;
  hours_at_review: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithProfile extends Review {
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// Busca reviews de um jogo e enriquece com dados de perfil para exibiÃ§Ã£o.
export function useReviewsByGame(appId: number) {
  return useQuery({
    queryKey: ['reviews', 'game', appId],
    queryFn: async () => {
      // 1) Reviews do jogo (mais recentes primeiro)
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('app_id', appId)
        .order('created_at', { ascending: false });
      
      if (reviewsError) throw reviewsError;
      if (!reviews || reviews.length === 0) return [];

      // 2) UsuÃ¡rios Ãºnicos para buscar perfis em uma consulta
      const userIds = [...new Set(reviews.map(r => r.user_id))];
      
      // 3) Perfis para nome e avatar
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;

      // 4) Junta reviews + perfis no cliente
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return reviews.map(review => ({
        ...review,
        profiles: profileMap.get(review.user_id) || {
          username: 'unknown',
          display_name: null,
          avatar_url: null,
        },
      })) as ReviewWithProfile[];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Busca todas as reviews de um usuÃ¡rio (perfil prÃ³prio ou pÃºblico).
export function useReviewsByUser(userId?: string, useAuthFallback = true) {
  const { user } = useAuth();
  const targetUserId = userId ?? (useAuthFallback ? user?.id : undefined);

  return useQuery({
    queryKey: ['reviews', 'user', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Review[];
    },
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Busca a review do usuÃ¡rio logado para um jogo especÃ­fico.
export function useUserReviewForGame(appId: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reviews', user?.id, appId],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('app_id', appId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Review | null;
    },
    enabled: !!user?.id,
  });
}

// Cria review com nota normalizada e is_positive derivado.
export function useCreateReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      appId, 
      content, 
      score,
      hoursAtReview 
    }: { 
      appId: number;
      content: string;
      score: number;
      hoursAtReview?: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      // Normaliza nota para 0..5 (inteiro) e define "recomendado".
      const normalizedScore = Math.max(0, Math.min(5, Math.round(score)));
      const isPositive = normalizedScore >= 3;
      
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          app_id: appId,
          content,
          is_positive: isPositive,
          score: normalizedScore,
          hours_at_review: hoursAtReview || 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Review;
    },
    onSuccess: (_, variables) => {
      // Atualiza listas globais e reviews do jogo.
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'game', variables.appId] });
    },
  });
}

// Atualiza review e re-normaliza a nota, se enviada.
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Pick<Review, 'content' | 'is_positive' | 'score' | 'hours_at_review'>>;
    }) => {
      const nextUpdates = { ...updates };
      if (typeof nextUpdates.score === "number") {
        // MantÃ©m a nota entre 0..5 e sincroniza is_positive.
        const normalizedScore = Math.max(0, Math.min(5, Math.round(nextUpdates.score)));
        nextUpdates.score = normalizedScore;
        nextUpdates.is_positive = normalizedScore >= 3;
      }

      const { data, error } = await supabase
        .from('reviews')
        .update(nextUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Review;
    },
    onSuccess: () => {
      // Invalida todas as reviews para atualizar a UI.
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

// Exclui uma review por id (RLS garante que sÃ³ o dono pode excluir).
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
