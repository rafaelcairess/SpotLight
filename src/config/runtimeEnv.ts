type SpotlightRuntimeEnv = {
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
};

const runtimeEnv = (
  globalThis as typeof globalThis & {
    __SPOTLIGHT_ENV__?: SpotlightRuntimeEnv;
  }
).__SPOTLIGHT_ENV__;

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || runtimeEnv?.VITE_SUPABASE_URL || "";

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || runtimeEnv?.VITE_SUPABASE_PUBLISHABLE_KEY || "";
