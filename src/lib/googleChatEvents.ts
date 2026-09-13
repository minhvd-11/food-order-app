// lib/googleChatEvents.ts
//
// Inbound side of the Chat app: proves a request really came from Google Chat,
// and flattens the two payload shapes Chat can send (the classic HTTP Chat app
// format and the newer Workspace add-on format) into one small event type.
import crypto from "node:crypto";

const CHAT_ISSUER = "chat@system.gserviceaccount.com";

// Chat signs the bearer token differently depending on the "Authentication
// Audience" chosen in the Chat API configuration:
//   Project Number    -> a JWT self-signed by chat@system.gserviceaccount.com,
//                        audience = the Cloud project number.
//   HTTP endpoint URL -> a Google-signed OIDC ID token, audience = this
//                        endpoint's URL, with chat@system as the email claim.
// Both are accepted so either setting works.
const CHAT_CERTS_URL = `https://www.googleapis.com/service_accounts/v1/metadata/x509/${CHAT_ISSUER}`;
const GOOGLE_OIDC_CERTS_URL = "https://www.googleapis.com/oauth2/v1/certs";
const GOOGLE_OIDC_ISSUERS = new Set([
  "accounts.google.com",
  "https://accounts.google.com",
]);

const certCaches = new Map<
  string,
  { certs: Record<string, string>; expiresAt: number }
>();

async function getCerts(url: string): Promise<Record<string, string>> {
  const cached = certCaches.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.certs;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch certs from ${url}: ${res.status}`);

  const certs = (await res.json()) as Record<string, string>;
  certCaches.set(url, { certs, expiresAt: Date.now() + 60 * 60 * 1000 });
  return certs;
}

function decodeSegment(segment: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
}

type TokenClaims = {
  iss?: string;
  aud?: string;
  exp?: number;
  email?: string;
  email_verified?: boolean | string;
};

/**
 * Decides which cert set and audience to check this token against, based on
 * who issued it. Returns null for anything not issued by Google Chat, or when
 * the matching env var isn't configured.
 */
function strategyFor(
  claims: TokenClaims,
): { certsUrl: string; audience: string } | null {
  const projectNumber = process.env.GOOGLE_CHAT_PROJECT_NUMBER?.trim();
  const endpointUrl = process.env.GOOGLE_CHAT_ENDPOINT_URL?.trim();

  if (claims.iss === CHAT_ISSUER) {
    if (!projectNumber) {
      console.error(
        "Chat sent a project-number token but GOOGLE_CHAT_PROJECT_NUMBER is not set",
      );
      return null;
    }
    return { certsUrl: CHAT_CERTS_URL, audience: projectNumber };
  }

  if (claims.iss && GOOGLE_OIDC_ISSUERS.has(claims.iss)) {
    // An OIDC token is only from Chat if Chat's service account signed for it.
    if (
      claims.email !== CHAT_ISSUER ||
      (claims.email_verified !== true && claims.email_verified !== "true")
    ) {
      return null;
    }
    if (!endpointUrl) {
      console.error(
        "Chat sent an endpoint-URL token but GOOGLE_CHAT_ENDPOINT_URL is not set",
      );
      return null;
    }
    return { certsUrl: GOOGLE_OIDC_CERTS_URL, audience: endpointUrl };
  }

  return null;
}

/**
 * Verifies the bearer token Chat puts on every request. Fails closed — with
 * neither GOOGLE_CHAT_PROJECT_NUMBER nor GOOGLE_CHAT_ENDPOINT_URL set, the
 * endpoint accepts nothing, so an unconfigured deploy can't be driven by
 * strangers.
 */
export async function verifyChatRequest(req: Request): Promise<boolean> {
  const authorization = req.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return false;

  const parts = authorization.slice("Bearer ".length).trim().split(".");
  if (parts.length !== 3) return false;

  const [headerPart, payloadPart, signaturePart] = parts;

  try {
    const header = decodeSegment(headerPart) as { alg?: string; kid?: string };
    if (header.alg !== "RS256" || !header.kid) return false;

    const claims = decodeSegment(payloadPart) as TokenClaims;

    const strategy = strategyFor(claims);
    if (!strategy) return false;

    const now = Math.floor(Date.now() / 1000);
    if (claims.aud !== strategy.audience) return false;
    if (typeof claims.exp !== "number" || claims.exp <= now) return false;

    const certs = await getCerts(strategy.certsUrl);
    const cert = certs[header.kid];
    if (!cert) return false;

    return crypto
      .createVerify("RSA-SHA256")
      .update(`${headerPart}.${payloadPart}`)
      .verify(
        new crypto.X509Certificate(cert).publicKey,
        Buffer.from(signaturePart, "base64url"),
      );
  } catch (err) {
    console.error("Failed to verify Chat bearer token:", err);
    return false;
  }
}

export type ChatEventType =
  | "ADDED_TO_SPACE"
  | "REMOVED_FROM_SPACE"
  | "MESSAGE"
  | "UNKNOWN";

export type ChatPayloadFormat = "legacy" | "addon";

export type ChatEvent = {
  type: ChatEventType;
  format: ChatPayloadFormat;
  text: string;
  user: { name?: string; displayName?: string; email?: string };
  space: { name?: string; type?: string; singleUserBotDm?: boolean };
};

type RawUser = { name?: string; displayName?: string; email?: string };
type RawSpace = {
  name?: string;
  type?: string;
  spaceType?: string;
  singleUserBotDm?: boolean;
};
type RawMessage = { text?: string; argumentText?: string };

function toEvent(
  type: ChatEventType,
  format: ChatPayloadFormat,
  user: RawUser | undefined,
  space: RawSpace | undefined,
  message: RawMessage | undefined,
): ChatEvent {
  return {
    type,
    format,
    // argumentText drops the "@Lunch Bot" mention, but it is empty for a bare
    // slash command, so fall back to the full text in that case.
    text: (message?.argumentText?.trim() || message?.text || "").trim(),
    user: {
      name: user?.name,
      displayName: user?.displayName,
      email: user?.email,
    },
    space: {
      name: space?.name,
      // spaceType (DIRECT_MESSAGE) is the newer spelling of type (DM).
      type: space?.type ?? space?.spaceType,
      singleUserBotDm: space?.singleUserBotDm,
    },
  };
}

/** Flattens either payload shape into a single event. */
export function normalizeChatEvent(body: unknown): ChatEvent {
  const raw = (body ?? {}) as Record<string, any>;

  // Workspace add-on format: everything hangs off a `chat` envelope.
  if (raw.chat) {
    const chat = raw.chat as Record<string, any>;
    const user = (chat.user ?? raw.commonEventObject?.user) as RawUser;

    if (chat.messagePayload) {
      return toEvent(
        "MESSAGE",
        "addon",
        user,
        chat.messagePayload.space,
        chat.messagePayload.message,
      );
    }
    if (chat.appCommandPayload) {
      return toEvent(
        "MESSAGE",
        "addon",
        user,
        chat.appCommandPayload.space,
        chat.appCommandPayload.message,
      );
    }
    if (chat.addedToSpacePayload) {
      return toEvent(
        "ADDED_TO_SPACE",
        "addon",
        user,
        chat.addedToSpacePayload.space,
        undefined,
      );
    }
    if (chat.removedFromSpacePayload) {
      return toEvent(
        "REMOVED_FROM_SPACE",
        "addon",
        user,
        chat.removedFromSpacePayload.space,
        undefined,
      );
    }

    return toEvent("UNKNOWN", "addon", user, undefined, undefined);
  }

  // Classic HTTP Chat app format.
  const type: ChatEventType =
    raw.type === "MESSAGE" ||
    raw.type === "ADDED_TO_SPACE" ||
    raw.type === "REMOVED_FROM_SPACE"
      ? raw.type
      : "UNKNOWN";

  return toEvent(type, "legacy", raw.user, raw.space, raw.message);
}

/** Builds a synchronous reply in whichever format the request arrived in. */
export function chatReply(
  text: string,
  format: ChatPayloadFormat,
): Record<string, unknown> {
  if (format === "addon") {
    return {
      hostAppDataAction: {
        chatDataAction: { createMessageAction: { message: { text } } },
      },
    };
  }
  return { text };
}

/** True when the space is a 1:1 DM between the user and this app. */
export function isDirectMessage(event: ChatEvent): boolean {
  return (
    event.space.singleUserBotDm === true ||
    event.space.type === "DM" ||
    event.space.type === "DIRECT_MESSAGE"
  );
}
