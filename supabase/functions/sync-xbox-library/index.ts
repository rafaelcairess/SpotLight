import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * sync-xbox-library
 *
 * Sincroniza a biblioteca de jogos de um usuário Xbox com o banco de dados.
 * Pode ser chamado manualmente (botão de re-sync) ou automaticamente
 * via GitHub Actions (cron diário).
 *
 * Body JSON esperado (para chamada por usuário):
 *   { user_id, xuid, xsts_token, user_hash }
 *
 * Body JSON para sync em batch (GitHub Actions):
 *   { batch: true }  — percorre todos os profiles com xbox_id
 *
 * Variáveis de ambiente necessárias:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   XBOX_CLIENT_ID
 *   XBOX_CLIENT_SECRET
 */

interface XboxTitle {
  titleId: string;
  name: string;
  titleHistory?: { lastTimePlayed: string };
  achievement?: { currentAchievements: number; totalAchievements: number };
  images?: Array<{ url: string; type: string }>;
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const getXboxHeaders = (xstsToken: string, userHash: string) => ({
  "x-xbl-contract-version": "2",
  Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
  Accept: "application/json",
  "Accept-Language": "pt-BR",
});

serve(async (req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: "server_not_configured" });
  }

  // Verifica autorização: apenas service role pode chamar
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return json(401, { error: "unauthorized" });
  }

  const body = await req.json().catch(() => ({}));
  const { user_id, xuid, xsts_token, user_hash } = body;

  if (!user_id || !xuid || !xsts_token || !user_hash) {
    return json(400, { error: "missing_required_fields" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    // Busca títulos jogados recentemente via Xbox Live API
    const titlesRes = await fetch(
      `https://titlehub.xboxlive.com/users/xuid(${xuid})/titles/titlehistory/decoration/details,image,achievement`,
      { headers: getXboxHeaders(xsts_token, user_hash) },
    );

    if (!titlesRes.ok) {
      return json(502, { error: "xbox_api_failed", status: titlesRes.status });
    }

    const titlesData = await titlesRes.json();
    const titles: XboxTitle[] = Array.isArray(titlesData?.titles) ? titlesData.titles : [];

    if (titles.length === 0) {
      await supabase
        .from("profiles")
        .update({ xbox_last_synced: new Date().toISOString() })
        .eq("user_id", user_id);
      return json(200, { synced: 0 });
    }

    const { data: userGames } = await supabase
      .from("user_games")
      .select("id, app_id")
      .eq("user_id", user_id)
      .eq("source", "xbox");

    // Xbox usa titleId numérico, mapeamos para app_id negativo para evitar conflito com Steam
    // Convenção: app_id Xbox = -(titleId % 2^31) para ficar na faixa de inteiros
    const byAppId = new Map<number, string>();
    for (const row of userGames || []) {
      byAppId.set(row.app_id, row.id);
    }

    const now = new Date().toISOString();
    const inserts: Array<Record<string, unknown>> = [];
    const catalogRows: Array<Record<string, unknown>> = [];

    for (const title of titles) {
      const titleIdNum = parseInt(title.titleId, 10);
      if (!titleIdNum) continue;

      // Usa ID negativo para namespace Xbox (evita colisão com app_id Steam)
      const appId = -(titleIdNum % 2_147_483_647);

      const coverImage =
        title.images?.find((img) => img.type === "BoxArt" || img.type === "Tile")?.url ||
        title.images?.[0]?.url ||
        null;

      const isPlatinumed =
        title.achievement != null &&
        title.achievement.totalAchievements > 0 &&
        title.achievement.currentAchievements >= title.achievement.totalAchievements;

      catalogRows.push({
        app_id: appId,
        title: title.name,
        image: coverImage,
        last_synced: now,
      });

      if (!byAppId.has(appId)) {
        inserts.push({
          user_id,
          app_id: appId,
          status: "playing",
          hours_played: null,
          source: "xbox",
          is_platinumed: isPlatinumed,
          added_at: now,
          updated_at: now,
        });
      } else {
        const id = byAppId.get(appId)!;
        await supabase.from("user_games").update({
          is_platinumed: isPlatinumed,
          updated_at: now,
        }).eq("id", id);
      }
    }

    if (catalogRows.length) {
      await supabase.from("games").upsert(catalogRows, { onConflict: "app_id" });
    }

    if (inserts.length) {
      await supabase.from("user_games").insert(inserts);
    }

    await supabase
      .from("profiles")
      .update({ xbox_last_synced: now })
      .eq("user_id", user_id);

    return json(200, { synced: titles.length, inserted: inserts.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json(500, { error: "sync_failed", detail: message });
  }
});
