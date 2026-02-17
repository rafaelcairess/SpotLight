import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Modelo de perfil usado nas pÃ¡ginas privada e pÃºblica.
export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  profile_visibility: string;
  reviews_visibility: string;
  library_visibility: string;
  created_at: string;
  updated_at: string;
}

// Busca o perfil do usuÃ¡rio logado.
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
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Busca perfil por username (pÃ¡gina pÃºblica).
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

// Perfis recentes para seÃ§Ãµes de descoberta.
export function useCommunityProfiles(limit = 24) {
  return useQuery({
    queryKey: ['profiles', 'community', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Profile[];
    },
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
          | 'profile_visibility'
          | 'reviews_visibility'
          | 'library_visibility'
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
      // Atualiza o cache do perfil apÃ³s salvar.
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// Busca perfis por username ou nome de exibiÃ§Ã£o.
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
