/**
 * Mantém a sessão Supabase e concentra os fluxos de autenticação.
 *
 * As páginas devem consumir este estado por `useAuth`; não devem criar outro
 * listener de sessão, pois listeners concorrentes causam transições duplicadas.
 */

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithSteam: () => Promise<{ error: Error | null }>;
  signInWithXbox: () => Promise<{ error: Error | null }>;
  signInWithPSN: () => Promise<{ error: Error | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const activeUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    let authEventReceived = false;

    const applySession = (nextSession: Session | null) => {
      const nextUserId = nextSession?.user.id ?? null;
      if (activeUserId.current !== undefined && activeUserId.current !== nextUserId) {
        // Nunca reutiliza dados privados quando a conta muda no mesmo navegador.
        queryClient.clear();
      }
      activeUserId.current = nextUserId;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    };

    // Configura o listener de auth primeiro
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      applySession(session);
    });

    // Depois, checa a sessao existente
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!authEventReceived) applySession(session);
      })
      .catch(() => {
        if (!authEventReceived) applySession(null);
      });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth?mode=login`,
        data: {
          display_name: displayName || "Novo Gamer",
        },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signInWithSteam = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (!supabaseUrl) {
      return { error: new Error("Supabase URL not configured") };
    }

    const redirect = encodeURIComponent(window.location.origin);
    const steamUrl = `${supabaseUrl}/functions/v1/steam-auth-start?redirect=${redirect}`;
    window.location.assign(steamUrl);
    return { error: null };
  };

  const signInWithXbox = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (!supabaseUrl) {
      return { error: new Error("Supabase URL not configured") };
    }

    const redirect = encodeURIComponent(window.location.origin);
    const xboxUrl = `${supabaseUrl}/functions/v1/xbox-auth-start?redirect=${redirect}`;
    window.location.assign(xboxUrl);
    return { error: null };
  };

  const signInWithPSN = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (!supabaseUrl) {
      return { error: new Error("Supabase URL not configured") };
    }

    const redirect = encodeURIComponent(window.location.origin);
    const psnUrl = `${supabaseUrl}/functions/v1/psn-auth-start?redirect=${redirect}`;
    window.location.assign(psnUrl);
    return { error: null };
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      // A conta pode já ter sido apagada no servidor; ainda assim remove a sessão local.
      await supabase.auth.signOut({ scope: "local" });
    }
    activeUserId.current = null;
    setSession(null);
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithSteam,
        signInWithXbox,
        signInWithPSN,
        requestPasswordReset,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
