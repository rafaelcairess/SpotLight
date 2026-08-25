import { API_URL } from "@/config/runtimeEnv";
import { supabase } from "@/integrations/supabase/client";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  authenticated?: boolean;
};

/** Shared HTTP boundary for the gradual migration from Supabase calls to ASP.NET Core. */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  if (!API_URL) throw new ApiError(0, "A API C# ainda não foi configurada neste ambiente.");

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body !== undefined) headers.set("Content-Type", "application/json");

  if (options.authenticated) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new ApiError(401, "É necessário entrar para continuar.");
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  const details = await response.json().catch(() => undefined);
  const message =
    typeof details === "object" && details && "title" in details
      ? String(details.title)
      : `A API respondeu com status ${response.status}.`;
  throw new ApiError(response.status, message, details);
}

export type CurrentUserResponse = {
  userId: string;
  email: string | null;
  role: string;
  authenticationLevel: string | null;
  isAnonymous: boolean;
};

export const spotlightApi = {
  getCurrentUser: () =>
    apiRequest<CurrentUserResponse>("/api/me", {
      authenticated: true,
    }),
};
