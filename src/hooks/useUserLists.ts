/**
 * Hook de dados/estado (useUserLists).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserList {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListGame {
  id: string;
  list_id: string;
  app_id: number;
  note: string | null;
  added_at: string;
}

// Busca todas as listas do usuário logado.
export function useUserLists() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_lists", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_lists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserList[];
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}

// Busca uma lista pública por ID.
export function useUserListById(listId: string | undefined) {
  return useQuery({
    queryKey: ["user_list", listId],
    queryFn: async () => {
      if (!listId) return null;
      const { data, error } = await supabase
        .from("user_lists")
        .select("*")
        .eq("id", listId)
        .maybeSingle();
      if (error) throw error;
      return data as UserList | null;
    },
    enabled: !!listId,
    staleTime: 2 * 60 * 1000,
  });
}

// Busca os jogos de uma lista.
export function useUserListGames(listId: string | undefined) {
  return useQuery({
    queryKey: ["user_list_games", listId],
    queryFn: async () => {
      if (!listId) return [];
      const { data, error } = await supabase
        .from("user_list_games")
        .select("*")
        .eq("list_id", listId)
        .order("added_at", { ascending: false });
      if (error) throw error;
      return data as UserListGame[];
    },
    enabled: !!listId,
    staleTime: 2 * 60 * 1000,
  });
}

// Cria uma nova lista.
export function useCreateUserList() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      is_public,
    }: {
      name: string;
      description?: string;
      is_public?: boolean;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_lists")
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          is_public: is_public ?? false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as UserList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_lists"] });
    },
  });
}

// Remove uma lista.
export function useDeleteUserList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_lists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_lists"] });
    },
  });
}

// Adiciona um jogo a uma lista.
export function useAddGameToList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      appId,
      note,
    }: {
      listId: string;
      appId: number;
      note?: string;
    }) => {
      const { data, error } = await supabase
        .from("user_list_games")
        .insert({ list_id: listId, app_id: appId, note: note || null })
        .select()
        .single();
      if (error) throw error;
      return data as UserListGame;
    },
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ["user_list_games", listId] });
    },
  });
}

// Remove um jogo de uma lista.
export function useRemoveGameFromList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, appId }: { listId: string; appId: number }) => {
      const { error } = await supabase
        .from("user_list_games")
        .delete()
        .eq("list_id", listId)
        .eq("app_id", appId);
      if (error) throw error;
    },
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ["user_list_games", listId] });
    },
  });
}
