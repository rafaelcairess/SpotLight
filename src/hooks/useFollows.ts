import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export function useFollowingIds(userIds: string[]) {
  const { user } = useAuth();

  const ids = Array.from(new Set(userIds)).filter(Boolean);

  return useQuery({
    queryKey: ['follows', 'following', user?.id, ids],
    queryFn: async () => {
      if (!user?.id || ids.length === 0) return [] as string[];

      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', ids);

      if (error) throw error;
      return (data || []).map((row) => row.following_id);
    },
    enabled: !!user?.id && ids.length > 0,
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (followingId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!followingId || followingId === user.id) {
        throw new Error('Invalid follow target');
      }

      const { data, error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: followingId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Follow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follows'] });
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (followingId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!followingId) throw new Error('Invalid follow target');

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follows'] });
    },
  });
}

export function useFollowCounts(userId?: string) {
  return useQuery({
    queryKey: ['follows', 'counts', userId],
    queryFn: async () => {
      if (!userId) return { followers: 0, following: 0 };

      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { head: true, count: 'exact' })
        .eq('following_id', userId);

      if (followersError) throw followersError;

      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { head: true, count: 'exact' })
        .eq('follower_id', userId);

      if (followingError) throw followingError;

      return {
        followers: followersCount ?? 0,
        following: followingCount ?? 0,
      };
    },
    enabled: !!userId,
  });
}
