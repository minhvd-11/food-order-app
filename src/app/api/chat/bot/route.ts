// app/api/chat/bot/route.ts
//
// HTTP endpoint for the Google Chat app. Configure this URL under
// Google Cloud Console > Google Chat API > Configuration > Connection settings.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findDirectMessageSpace } from "@/lib/googleChat";
import {
  ChatEvent,
  chatReply,
  isDirectMessage,
  normalizeChatEvent,
  verifyChatRequest,
} from "@/lib/googleChatEvents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HELP_TEXT = [
  "🍱 *Bot đặt cơm Teko*",
  "",
  "Mỗi ngày khi thực đơn được chốt, mình sẽ nhắn riêng cho bạn danh sách món.",
  "",
  "Các lệnh:",
  "• `subscribe` (hoặc `dk`) — nhận thông báo hằng ngày",
  "• `unsubscribe` (hoặc `huy`) — ngừng nhận thông báo",
  "• `status` — kiểm tra trạng thái đăng ký",
  "• `help` — xem lại hướng dẫn này",
].join("\n");

const SUBSCRIBE_WORDS = new Set([
  "subscribe",
  "sub",
  "dangky",
  "dang ky",
  "dk",
  "start",
  "on",
]);
const UNSUBSCRIBE_WORDS = new Set([
  "unsubscribe",
  "unsub",
  "huy",
  "huydangky",
  "huy dang ky",
  "stop",
  "off",
]);
const STATUS_WORDS = new Set(["status", "trangthai", "trang thai"]);

type Command = "subscribe" | "unsubscribe" | "status" | "help";

/** Lowercases, drops Vietnamese diacritics and any leading slash/mention. */
function parseCommand(text: string): Command {
  const normalized = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/^[/@]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (SUBSCRIBE_WORDS.has(normalized)) return "subscribe";
  if (UNSUBSCRIBE_WORDS.has(normalized)) return "unsubscribe";
  if (STATUS_WORDS.has(normalized)) return "status";
  return "help";
}

/**
 * The DM space to send this person's announcements to. When they talk to the
 * bot inside a shared space we look up their 1:1 space instead, so we never
 * store a room and accidentally broadcast.
 */
async function resolveDmSpace(event: ChatEvent): Promise<string | null> {
  if (isDirectMessage(event) && event.space.name) return event.space.name;
  if (!event.user.name) return null;

  try {
    return await findDirectMessageSpace(event.user.name);
  } catch (err) {
    console.error("findDirectMessage failed:", err);
    return null;
  }
}

async function handleSubscribe(event: ChatEvent): Promise<string> {
  const chatUserId = event.user.name;
  if (!chatUserId) return "Không xác định được tài khoản của bạn 😥";

  const spaceName = await resolveDmSpace(event);
  if (!spaceName) {
    return "Bạn hãy nhắn tin riêng cho mình (mở chat 1:1 với bot) rồi gõ `subscribe` nhé!";
  }

  await prisma.chatSubscriber.upsert({
    where: { chatUserId },
    update: {
      spaceName,
      displayName: event.user.displayName ?? null,
      email: event.user.email ?? null,
      active: true,
    },
    create: {
      chatUserId,
      spaceName,
      displayName: event.user.displayName ?? null,
      email: event.user.email ?? null,
      active: true,
    },
  });

  const name = event.user.displayName ? ` ${event.user.displayName}` : "";
  return `✅ Đã đăng ký${name}! Mỗi ngày khi có thực đơn mình sẽ nhắn riêng cho bạn.\n\nGõ \`unsubscribe\` nếu muốn ngừng nhận.`;
}

async function handleUnsubscribe(event: ChatEvent): Promise<string> {
  const chatUserId = event.user.name;
  if (!chatUserId) return "Không xác định được tài khoản của bạn 😥";

  const { count } = await prisma.chatSubscriber.updateMany({
    where: { chatUserId, active: true },
    data: { active: false },
  });

  return count > 0
    ? "👋 Đã huỷ đăng ký. Gõ `subscribe` bất cứ lúc nào để nhận lại thông báo."
    : "Bạn đang không đăng ký nhận thông báo. Gõ `subscribe` để bắt đầu.";
}

async function handleStatus(event: ChatEvent): Promise<string> {
  const chatUserId = event.user.name;
  if (!chatUserId) return "Không xác định được tài khoản của bạn 😥";

  const subscriber = await prisma.chatSubscriber.findUnique({
    where: { chatUserId },
  });

  return subscriber?.active
    ? "🔔 Bạn đang nhận thông báo đặt cơm hằng ngày."
    : "🔕 Bạn chưa đăng ký. Gõ `subscribe` để nhận thông báo đặt cơm.";
}

async function handleEvent(event: ChatEvent): Promise<string | null> {
  switch (event.type) {
    case "ADDED_TO_SPACE":
      // Added to a 1:1 chat means "I want this" — subscribe straight away.
      if (isDirectMessage(event)) {
        const welcome = await handleSubscribe(event);
        return `${welcome}\n\n${HELP_TEXT}`;
      }
      return `Chào cả nhà! Thông báo đặt cơm được gửi riêng cho từng người — nhắn tin riêng cho mình và gõ \`subscribe\` để đăng ký nhé.`;

    case "REMOVED_FROM_SPACE":
      // No reply is possible here; just stop DMing them.
      if (event.user.name) {
        await prisma.chatSubscriber.updateMany({
          where: { chatUserId: event.user.name, active: true },
          data: { active: false },
        });
      }
      return null;

    case "MESSAGE":
      switch (parseCommand(event.text)) {
        case "subscribe":
          return handleSubscribe(event);
        case "unsubscribe":
          return handleUnsubscribe(event);
        case "status":
          return handleStatus(event);
        default:
          return HELP_TEXT;
      }

    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyChatRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const event = normalizeChatEvent(await req.json());
    const reply = await handleEvent(event);

    return NextResponse.json(reply ? chatReply(reply, event.format) : {});
  } catch (err) {
    console.error("Error in /api/chat/bot:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
