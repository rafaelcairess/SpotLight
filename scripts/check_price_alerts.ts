/// <reference types="node" />
/// <reference lib="dom" />

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const loadEnvFile = (filename: string) => {
  const filePath = path.join(rootDir, filename);
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
};

loadEnvFile(".env");
loadEnvFile(".env.local");

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const FUNCTIONS_URL = (process.env.SUPABASE_FUNCTIONS_URL || `${SUPABASE_URL}/functions/v1`).replace(/\/$/, "");
const STEAM_STORE_LANGUAGE = process.env.STEAM_STORE_LANGUAGE || "brazilian";

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL not found. Check .env or set SUPABASE_URL.");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY not found. Add it to .env.local.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
};

const getAppDetails = async (appId: number) => {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=br&l=${STEAM_STORE_LANGUAGE}`;
  const data = await fetchJson(url);
  const entry = data?.[appId];
  if (!entry?.success) return null;
  return entry.data;
};

const extractPriceSnapshot = (details: any) => {
  if (!details) return null;

  if (details?.is_free) {
    return {
      title: details.name || "Jogo",
      price: 0,
      discountPercent: 0,
      currency: "BRL",
      priceFormatted: "Grátis",
    };
  }

  const priceOverview = details?.price_overview;
  if (!priceOverview) return null;

  const priceValue = Number.isFinite(priceOverview.final)
    ? priceOverview.final / 100
    : null;

  return {
    title: details.name || "Jogo",
    price: priceValue,
    discountPercent: Number.isFinite(priceOverview.discount_percent)
      ? priceOverview.discount_percent
      : null,
    currency: priceOverview.currency || "BRL",
    priceFormatted: priceOverview.final_formatted || null,
  };
};

const formatCurrency = (value: number | null, currency = "BRL") => {
  if (value === null || Number.isNaN(value)) return "N/D";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
};

const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/send-price-alert-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn(`Email function error (${res.status}): ${body}`);
      return false;
    }

    return true;
  } catch (error: any) {
    console.warn("Falha ao chamar a função de email:", error?.message || error);
    return false;
  }
};

const main = async () => {
  const { data: alerts, error } = await supabase
    .from("price_alerts")
    .select("*")
    .eq("is_active", true);

  if (error) throw error;
  if (!alerts || alerts.length === 0) {
    console.log("Nenhum alerta ativo.");
    return;
  }

  const uniqueGameIds = Array.from(new Set(alerts.map((alert: any) => alert.game_id)));
  const priceSnapshots = new Map<number, any>();

  for (const gameId of uniqueGameIds) {
    try {
      const details = await getAppDetails(gameId);
      const snapshot = extractPriceSnapshot(details);
      if (!snapshot) {
        console.warn(`Sem preÃ§o para ${gameId}`);
        continue;
      }

      priceSnapshots.set(gameId, snapshot);

      await supabase.from("price_history").insert({
        game_id: gameId,
        price: snapshot.price,
        discount_percent: snapshot.discountPercent,
        currency: snapshot.currency,
        recorded_at: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error(`Erro ao consultar ${gameId}:`, err?.message || err);
    }

    await sleep(250);
  }

  for (const alert of alerts) {
    const snapshot = priceSnapshots.get(alert.game_id);
    if (!snapshot || snapshot.price === null || snapshot.price === undefined) {
      continue;
    }

    const targetValue =
      alert.target_price === null || alert.target_price === undefined
        ? null
        : Number(alert.target_price);
    const hasDiscount = (snapshot.discountPercent ?? 0) > 0;
    const meetsTarget = targetValue === null ? hasDiscount : snapshot.price <= targetValue;

    if (!meetsTarget) continue;
    if (alert.notified_at) continue;

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      alert.user_id
    );
    if (userError) {
      console.error(`Erro ao buscar usuÃ¡rio ${alert.user_id}:`, userError.message);
      continue;
    }

    const email = userData?.user?.email;
    if (!email) {
      console.warn(`UsuÃ¡rio sem email: ${alert.user_id}`);
      continue;
    }

    const subject = `SpotLight: ${snapshot.title} entrou em promoÃ§Ã£o`;
    const html = `
      <div>
        <h2>${snapshot.title}</h2>
        <p>O preÃ§o atual Ã© <strong>${snapshot.priceFormatted || formatCurrency(snapshot.price, snapshot.currency)}</strong>.</p>
        <p>${
          targetValue === null
            ? "VocÃª pediu alerta em qualquer promoÃ§Ã£o."
            : `Seu alvo era ${formatCurrency(targetValue, snapshot.currency)}.`
        }</p>
        <p><a href=\"https://store.steampowered.com/app/${alert.game_id}\">Abrir na Steam</a></p>
      </div>
    `;

    const sent = await sendEmail({ to: email, subject, html });
    if (!sent) {
      console.warn(`Email não enviado para ${email} (${snapshot.title})`);
      continue;
    }

    await supabase
      .from("price_alerts")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", alert.id);

    console.log(`Email enviado para ${email} (${snapshot.title})`);
  }
};

main().catch((err) => {
  console.error("Erro geral:", err?.message || err);
  process.exit(1);
});
