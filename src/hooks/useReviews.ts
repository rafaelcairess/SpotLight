import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Review {
  id: string;
  user_id: string;
  app_id: number;
  content: string;
  is_positive: boolean;
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

export function useReviewsByGame(appId: number) {
  return useQuery({
    queryKey: ['reviews', 'game', appId],
    queryFn: async () => {
      // First get reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('app_id', appId)
        .order('created_at', { ascending: false });
      
      if (reviewsError) throw reviewsError;
      if (!reviews || reviews.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(reviews.map(r => r.user_id))];
      
      // Fetch profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;

      // Map profiles by user_id
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Combine reviews with profiles
      return reviews.map(review => ({
        ...review,
        profiles: profileMap.get(review.user_id) || {
          username: 'unknown',
          display_name: null,
          avatar_url: null,
        },
      })) as ReviewWithProfile[];
    },
  });
}

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
  });
}

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

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      appId, 
      content, 
      isPositive, 
      hoursAtReview 
    }: { 
      appId: number;
      content: string;
      isPositive: boolean;
      hoursAtReview?: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          app_id: appId,
          content,
          is_positive: isPositive,
          hours_at_review: hoursAtReview || 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Review;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews', 'game', variables.appId] });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Pick<Review, 'content' | 'is_positive' | 'hours_at_review'>>;
    }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Review;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

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
