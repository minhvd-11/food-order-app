// lib/googleChat.ts
//
// Outbound Google Chat API calls, authenticated as the Chat app itself
// (service account, `chat.bot` scope). Incoming webhooks can only post to a
// space — DMing a person requires the Chat API, which is what this file wraps.
import crypto from "node:crypto";

const CHAT_API_BASE = "https://chat.googleapis.com/v1";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CHAT_BOT_SCOPE = "https://www.googleapis.com/auth/chat.bot";

const SITE_URL = process.env.SITE_URL || "https://daily-lunch-2025.vercel.app";

type ServiceAccount = {
  clientEmail: string;
  privateKey: string;
};

let serviceAccount: ServiceAccount | null | undefined;

/**
 * Reads GOOGLE_CHAT_SERVICE_ACCOUNT, which may hold either the raw service
 * account JSON or a base64 copy of it (easier to paste into Vercel, which
 * mangles multi-line values).
 */
function loadServiceAccount(): ServiceAccount | null {
  if (serviceAccount !== undefined) return serviceAccount;

  const raw = process.env.GOOGLE_CHAT_SERVICE_ACCOUNT?.trim();
  if (!raw) {
    serviceAccount = null;
    return serviceAccount;
  }

  try {
    const json = raw.startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json) as {
      client_email?: string;
      private_key?: string;
    };

    if (!parsed.client_email || !parsed.private_key) {
      throw new Error("client_email or private_key missing");
    }

    serviceAccount = {
      clientEmail: parsed.client_email,
      // Escaped newlines survive most env-var UIs; real newlines pass through.
      privateKey: parsed.private_key.replace(/\\n/g, "\n"),
    };
  } catch (err) {
    console.error("Invalid GOOGLE_CHAT_SERVICE_ACCOUNT:", err);
    serviceAccount = null;
  }

  return serviceAccount;
}

export function isChatBotConfigured(): boolean {
  return loadServiceAccount() !== null;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

let cachedToken: { value: string; expiresAt: number } | null = null;

/** Mints (and caches) an app-auth access token via the JWT bearer grant. */
async function getAccessToken(): Promise<string> {
  const account = loadServiceAccount();
  if (!account) throw new Error("Google Chat service account not configured");

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: account.clientEmail,
    scope: CHAT_BOT_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const signingInput = `${base64url(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  )}.${base64url(JSON.stringify(claims))}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(signingInput)
    .sign(account.privateKey);
  const assertion = `${signingInput}.${base64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to mint Chat access token: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.value;
}

export class ChatApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
  }

  /** The subscriber is gone or the app was removed — stop DMing them. */
  get isGone(): boolean {
    return this.status === 403 || this.status === 404;
  }
}

async function chatApi<T>(
  path: string,
  init: { method: string; body?: unknown },
): Promise<T> {
  const token = await getAccessToken();

  const res = await fetch(`${CHAT_API_BASE}/${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ChatApiError(res.status, text || res.statusText);
  }

  return (await res.json()) as T;
}

/** Posts a message into a space (a DM space is just a space). */
export async function sendChatMessage(
  spaceName: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await chatApi(`${spaceName}/messages`, { method: "POST", body: payload });
}

/**
 * Resolves the 1:1 DM space between this app and a user. Only succeeds once
 * the user has added the app, so it is a repair path for a stale stored space
 * rather than a way to cold-DM someone.
 */
export async function findDirectMessageSpace(
  chatUserId: string,
): Promise<string | null> {
  try {
    const space = await chatApi<{ name?: string }>(
      `spaces:findDirectMessage?name=${encodeURIComponent(chatUserId)}`,
      { method: "GET" },
    );
    return space.name ?? null;
  } catch (err) {
    if (err instanceof ChatApiError && err.isGone) return null;
    throw err;
  }
}

/**
 * Card text is rendered as limited HTML, so anything that came from a user or
 * from the menu parser has to be escaped before it goes in.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const PRICE_LABELS: Record<number, string> = {
  10000: "Thuần Cơm",
  30000: "Cơ bản",
  35000: "Hơi no",
  40000: "Ngập mồm",
};

function formatPrice(price: number): string {
  const label = PRICE_LABELS[price];
  const amount = `${new Intl.NumberFormat("vi-VN").format(price)}đ`;
  return label ? `${label} (${amount})` : amount;
}

/**
 * The daily menu card. Shared by the space webhook and the per-user DMs so
 * both always look the same.
 */
export function buildLunchCard(opts: {
  dateText: string;
  foods: string[];
  time: string;
}): Record<string, unknown> {
  const { dateText, foods, time } = opts;
  const foodsHtml = foods.length
    ? foods.map((f) => `• ${escapeHtml(f)}`).join("<br>")
    : "";

  return {
    cardsV2: [
      {
        cardId: "lunch",
        card: {
          header: {
            title: `Đặt cơm ${dateText}`,
            subtitle: `Chốt lúc ${time}`,
          },
          sections: [
            {
              widgets: [
                {
                  textParagraph: {
                    text: `Mọi người vào đặt cơm trước <b>${time}</b>.`,
                  },
                },
                {
                  textParagraph: {
                    text: foodsHtml,
                  },
                },
                {
                  buttonList: {
                    buttons: [
                      {
                        text: "Đặt cơm",
                        onClick: {
                          openLink: {
                            url: SITE_URL,
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

/**
 * Per-person confirmation DM sent right after an order is saved.
 *
 * The order number is what people read out to collect their food, so it leads
 * the card twice: in the header title (the largest text a card can render —
 * cards have no font-size control) and again as a coloured, icon-flagged row
 * above the fold.
 */
export function buildOrderConfirmationCard(opts: {
  dateText: string;
  orderNumber: number;
  foods: string[];
  note?: string | null;
  price: number;
}): Record<string, unknown> {
  const { dateText, orderNumber, foods, note, price } = opts;

  const widgets: Record<string, unknown>[] = [
    {
      decoratedText: {
        startIcon: { knownIcon: "CONFIRMATION_NUMBER_ICON" },
        topLabel: "Đọc số này khi lấy cơm",
        text: `<b><font color="#e8710a">SỐ ${orderNumber}</font></b>`,
        wrapText: true,
      },
    },
    { divider: {} },
    {
      textParagraph: {
        text: foods.length
          ? `Món đã đặt:<br>${foods.map((f) => `• ${escapeHtml(f)}`).join("<br>")}`
          : "Bạn chưa chọn món nào.",
      },
    },
  ];

  const trimmedNote = note?.trim();
  if (trimmedNote) {
    widgets.push({
      textParagraph: { text: `Ghi chú: <b>${escapeHtml(trimmedNote)}</b>` },
    });
  }

  widgets.push({
    textParagraph: { text: `Suất: ${escapeHtml(formatPrice(price))}` },
  });

  widgets.push({
    buttonList: {
      buttons: [
        {
          text: "Xem đơn hôm nay",
          onClick: { openLink: { url: SITE_URL } },
        },
      ],
    },
  });

  return {
    // Falls back to plain text wherever a card can't render (notifications,
    // older clients) - and the number survives there too.
    text: `✅ Đặt cơm thành công — đơn của bạn là *SỐ ${orderNumber}*`,
    cardsV2: [
      {
        cardId: "order-confirmation",
        card: {
          header: {
            title: `✅ Đơn số ${orderNumber}`,
            subtitle: `Đặt cơm thành công • ${dateText}`,
          },
          sections: [{ widgets }],
        },
      },
    ],
  };
}
