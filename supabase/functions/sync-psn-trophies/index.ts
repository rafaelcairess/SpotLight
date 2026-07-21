import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * sync-psn-trophies
 *
 * Sincroniza os troféus e jogos de um usuário PSN com o banco de dados.
 * A Trophy API PSN retorna jogos que o usuário possui troféus — não tem
 * acesso a tempo de jogo (indisponível via API pública).
 *
 * Body JSON:
 *   { user_id, psn_account_id, psn_access_token }
 *
 * Variáveis de ambiente necessárias:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

interface PsnTitleTrophy {
  npCommunicationId: string;
  trophySetVersion: string;
  trophyTitleName: string;
  trophyTitleIconUrl?: string;
  trophyTitlePlatform: string;
  definedTrophies: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  earnedTrophies: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

serve(async (req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: "server_not_configured" });
  }

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return json(401, { error: "unauthorized" });
  }

  const body = await req.json().catch(() => ({}));
  const { user_id, psn_account_id, psn_access_token } = body;

  if (!user_id || !psn_account_id || !psn_access_token) {
    return json(400, { error: "missing_required_fields" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    // Busca títulos com troféus do usuário
    const trophiesRes = await fetch(
      `https://m.np.playstation.com/api/trophy/v1/users/${psn_account_id}/trophyTitles?limit=500`,
      {
        headers: {
          Authorization: `Bearer ${psn_access_token}`,
          "Accept-Language": "pt-BR",
        },
      },
    );

    if (!trophiesRes.ok) {
      return json(502, { error: "psn_trophy_api_failed", status: trophiesRes.status });
    }

    const trophiesData = await trophiesRes.json();
    const titles: PsnTitleTrophy[] = Array.isArray(trophiesData?.trophyTitles)
      ? trophiesData.trophyTitles
      : [];

    if (titles.length === 0) {
      await supabase
        .from("profiles")
        .update({ psn_last_synced: new Date().toISOString() })
        .eq("user_id", user_id);
      return json(200, { synced: 0 });
    }

    const { data: userGames } = await supabase
      .from("user_games")
      .select("id, app_id")
      .eq("user_id", user_id)
      .eq("source", "psn");

    // PSN usa npCommunicationId (string), convertemos para hash numérico
    // para caber no campo app_id (integer).
    // Usamos hash negativo no range -(2^30) para evitar colisão com Steam e Xbox.
    const hashId = (s: string): number => {
      let h = 0;
      for (let i = 0; i < s.length; i++) {
        h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
      }
      // Garante negativo e dentro do range int4 seguro
      return -Math.abs(h % 1_073_741_823) - 1;
    };

    const byAppId = new Map<number, string>();
    for (const row of userGames || []) {
      byAppId.set(row.app_id, row.id);
    }

    const now = new Date().toISOString();
    const inserts: Array<Record<string, unknown>> = [];
    const catalogRows: Array<Record<string, unknown>> = [];

    for (const title of titles) {
      const appId = hashId(title.npCommunicationId);
      const isPlatinumed =
        title.definedTrophies.platinum > 0 &&
        title.earnedTrophies.platinum >= title.definedTrophies.platinum;

      catalogRows.push({
        app_id: appId,
        title: title.trophyTitleName,
        image: title.trophyTitleIconUrl || null,
        last_synced: now,
      });

      if (!byAppId.has(appId)) {
        inserts.push({
          user_id,
          app_id: appId,
          status: "playing",
          hours_played: null,
          source: "psn",
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
      .update({ psn_last_synced: now })
      .eq("user_id", user_id);

    return json(200, { synced: titles.length, inserted: inserts.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json(500, { error: "sync_failed", detail: message });
  }
});
