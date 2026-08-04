type SpotlightRuntimeEnv = {
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
};

// Supabase publishable keys are intentionally safe to ship to the browser.
const DEFAULT_SUPABASE_URL = "https://bqdrlvxijhlxtioikwhh.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qDvRoZO_AxS3fH-ASDnYkA_DlGr19hP";

const runtimeEnv = (
  globalThis as typeof globalThis & {
    __SPOTLIGHT_ENV__?: SpotlightRuntimeEnv;
  }
).__SPOTLIGHT_ENV__;

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || runtimeEnv?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  runtimeEnv?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  DEFAULT_SUPABASE_PUBLISHABLE_KEY;
