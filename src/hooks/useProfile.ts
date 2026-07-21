/**
 * Hook de dados/estado (useProfile).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Modelo de perfil usado nas páginas privada e pública.
export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  steam_id: string | null;
  steam_last_synced: string | null;
  steam_library_private: boolean | null;
  xbox_id: string | null;
  xbox_gamertag: string | null;
  xbox_last_synced: string | null;
  psn_id: string | null;
  psn_online_id: string | null;
  psn_last_synced: string | null;
  profile_visibility: string;
  reviews_visibility: string;
  library_visibility: string;
  comments_permission: 'public' | 'friends' | 'disabled';
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// Busca o perfil do usuário logado.
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
        .maybeSingle();  // ← era .single()

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Busca perfil por username (página pública).
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
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Atualiza campos do perfil (username, bio, visibilidade, avatar).
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      updates: Partial<
        Pick<
          Profile,
          | 'username'
          | 'display_name'
          | 'bio'
          | 'avatar_url'
          | 'steam_id'
          | 'profile_visibility'
          | 'reviews_visibility'
          | 'library_visibility'
          | 'comments_permission'
        >
      >
    ) => {
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
      // Atualiza o cache do perfil após salvar.
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// Busca perfis por username ou nome de exibição.
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
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
