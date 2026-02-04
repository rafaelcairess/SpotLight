import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user?.id,
  });
}

export function useProfileByUsername(username: string | undefined) {
  return useQuery({
    queryKey: ['profile', 'username', username],
    queryFn: async () => {
      if (!username) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!username,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, 'username' | 'display_name' | 'bio' | 'avatar_url'>>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useSearchProfiles(searchTerm: string) {
  return useQuery({
    queryKey: ['profiles', 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .limit(20);
      
      if (error) throw error;
      return data as Profile[];
    },
    enabled: searchTerm.length >= 2,
  });
}
