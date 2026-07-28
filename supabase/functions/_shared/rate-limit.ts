import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RateLimitClient = {
  rpc: (
    functionName: string,
    parameters: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;
};

/**
 * Consome uma cota atômica no PostgreSQL. Memória local não é suficiente,
 * porque uma Edge Function pode estar rodando em várias instâncias.
 */
export async function consumeUserRateLimit(
  client: RateLimitClient,
  userId: string,
  action: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await client.rpc("consume_function_rate_limit", {
    p_user_id: userId,
    p_action: action,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("rate_limit_error:", error.message);
    return false;
  }

  return data === true;
}

export type RequestAuthorization =
  | { status: "authorized"; userId: string }
  | { status: "unauthorized" | "rate_limited" | "server_not_configured" };

/** Valida o JWT no servidor e aplica uma cota por usuário. */
export async function authorizeRateLimitedRequest(
  request: Request,
  action: string,
  limit: number,
  windowSeconds: number,
): Promise<RequestAuthorization> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceRoleKey) return { status: "server_not_configured" };

  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return { status: "unauthorized" };

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error,
  } = await admin.auth.getUser(token);
  if (error || !user) return { status: "unauthorized" };

  const allowed = await consumeUserRateLimit(admin, user.id, action, limit, windowSeconds);
  return allowed ? { status: "authorized", userId: user.id } : { status: "rate_limited" };
}
