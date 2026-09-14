// lib/chatNotifications.ts
//
// Per-user Chat DMs triggered by app events (as opposed to the daily
// announcement, which fans out to every subscriber).
import { prisma } from "@/lib/prisma";
import {
  buildOrderConfirmationCard,
  ChatApiError,
  isChatBotConfigured,
  sendChatMessage,
} from "@/lib/googleChat";

/**
 * Links an app user to their Chat subscription. Users are matched by email,
 * but `User.email` is null for people who were created from an order form
 * rather than a login, so fall back to the email's local part — shortNames
 * mirror it (`huy.nv` <-> `huy.nv@teko.vn`).
 */
export async function findSubscriberForUser(user: {
  email?: string | null;
  shortName?: string | null;
}) {
  const clauses = [];

  if (user.email) {
    clauses.push({ email: { equals: user.email, mode: "insensitive" as const } });
  }
  if (user.shortName) {
    clauses.push({
      email: { startsWith: `${user.shortName}@`, mode: "insensitive" as const },
    });
  }
  if (clauses.length === 0) return null;

  return prisma.chatSubscriber.findFirst({
    where: { active: true, OR: clauses },
  });
}

/**
 * DMs the person who just ordered. Never throws: a Chat problem must not fail
 * an order that is already saved.
 */
export async function notifyOrderCreated(opts: {
  user: { id: string; email?: string | null; shortName?: string | null };
  dateText: string;
  orderNumber: number;
  foods: string[];
  note?: string | null;
  price: number;
}): Promise<void> {
  if (!isChatBotConfigured()) return;

  try {
    const subscriber = await findSubscriberForUser(opts.user);

    if (!subscriber) {
      console.log(
        `No Chat subscriber matched user ${opts.user.shortName ?? opts.user.id}; skipping confirmation`,
      );
      return;
    }

    try {
      await sendChatMessage(
        subscriber.spaceName,
        buildOrderConfirmationCard({
          dateText: opts.dateText,
          orderNumber: opts.orderNumber,
          foods: opts.foods,
          note: opts.note,
          price: opts.price,
        }),
      );
      console.log(`Order confirmation DM sent to ${subscriber.chatUserId}`);
    } catch (err) {
      // This one DM space is gone (the user removed the app) — retire just
      // that subscription so the daily announcement stops trying too.
      if (err instanceof ChatApiError && err.isGone) {
        await prisma.chatSubscriber.update({
          where: { id: subscriber.id },
          data: { active: false },
        });
      }
      throw err;
    }
  } catch (err) {
    console.error("Failed to send order confirmation DM:", err);
  }
}
