// app/api/admin/announce/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildLunchCard,
  ChatApiError,
  findDirectMessageSpace,
  isChatBotConfigured,
  sendChatMessage,
} from "@/lib/googleChat";

export const runtime = "nodejs";

const GOOGLE_CHAT_WEBHOOK = process.env.GOOGLE_CHAT_WEBHOOK;
const SLACK_WORKFLOW_WEBHOOK = process.env.SLACK_WORKFLOW_WEBHOOK;
const SITE_URL = process.env.SITE_URL || "https://daily-lunch-2025.vercel.app";

type AnnounceResult = {
  platform: string;
  success: boolean;
  error?: string;
  sent?: number;
  failed?: number;
};

type Subscriber = {
  id: string;
  chatUserId: string;
  spaceName: string;
};

/**
 * Sends one subscriber their DM, repairing a stale space once and retiring
 * subscribers who have removed the app.
 */
async function deliverToSubscriber(
  subscriber: Subscriber,
  card: Record<string, unknown>,
): Promise<void> {
  try {
    await sendChatMessage(subscriber.spaceName, card);
  } catch (err) {
    if (!(err instanceof ChatApiError) || !err.isGone) throw err;

    const freshSpace = await findDirectMessageSpace(subscriber.chatUserId);

    if (freshSpace && freshSpace !== subscriber.spaceName) {
      await sendChatMessage(freshSpace, card);
      await prisma.chatSubscriber.update({
        where: { id: subscriber.id },
        data: { spaceName: freshSpace },
      });
      return;
    }

    // The DM is gone for good — the user removed the app.
    await prisma.chatSubscriber.update({
      where: { id: subscriber.id },
      data: { active: false },
    });
    throw err;
  }
}

/**
 * Fans the daily card out to everyone subscribed to the bot. Returns null when
 * nobody is subscribed, so an empty list is never counted as a delivery that
 * could mask a failure on another channel.
 */
async function announceToSubscribers(
  card: Record<string, unknown>,
): Promise<AnnounceResult | null> {
  const subscribers = await prisma.chatSubscriber.findMany({
    where: { active: true },
    select: { id: true, chatUserId: true, spaceName: true },
  });

  if (subscribers.length === 0) {
    console.log("No Google Chat subscribers to DM");
    return null;
  }

  const outcomes = await Promise.allSettled(
    subscribers.map((subscriber) => deliverToSubscriber(subscriber, card)),
  );

  const failures = outcomes.filter((o) => o.status === "rejected");
  failures.forEach((failure) =>
    console.error("Google Chat DM failed:", failure.reason),
  );

  const sent = outcomes.length - failures.length;
  console.log(`Google Chat DMs sent: ${sent}/${outcomes.length}`);

  return {
    platform: "google_chat_dm",
    success: failures.length === 0,
    sent,
    failed: failures.length,
    error: failures.length
      ? `${failures.length} DM(s) failed to send`
      : undefined,
  };
}

export async function POST(req: NextRequest) {
  const chatBotConfigured = isChatBotConfigured();

  if (!GOOGLE_CHAT_WEBHOOK && !SLACK_WORKFLOW_WEBHOOK && !chatBotConfigured) {
    console.error(
      "Missing GOOGLE_CHAT_WEBHOOK, SLACK_WORKFLOW_WEBHOOK and GOOGLE_CHAT_SERVICE_ACCOUNT env vars",
    );
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const { date, foods, time } = body;

    if (!date || !Array.isArray(foods)) {
      return NextResponse.json(
        { error: "Invalid payload: date and foods required" },
        { status: 400 },
      );
    }

    const dateText = new Date(date).toLocaleDateString("vi-VN");

    const results: AnnounceResult[] = [];
    const card = buildLunchCard({ dateText, foods, time });

    // --- Google Chat space (incoming webhook) ---
    if (GOOGLE_CHAT_WEBHOOK) {
      try {
        const res = await fetch(GOOGLE_CHAT_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(card),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error(
            "Google Chat webhook returned error:",
            res.status,
            text,
          );
          results.push({
            platform: "google_chat",
            success: false,
            error: text,
          });
        } else {
          console.log("Google Chat announce sent successfully");
          results.push({ platform: "google_chat", success: true });
        }
      } catch (err: any) {
        console.error("Google Chat webhook fetch failed:", err);
        results.push({
          platform: "google_chat",
          success: false,
          error: err.message,
        });
      }
    }

    // --- Google Chat DMs (people subscribed to the bot) ---
    if (chatBotConfigured) {
      try {
        const dmResult = await announceToSubscribers(card);
        if (dmResult) results.push(dmResult);
      } catch (err: any) {
        console.error("Google Chat DM announce failed:", err);
        results.push({
          platform: "google_chat_dm",
          success: false,
          error: err.message,
        });
      }
    }

    // --- Slack ---
    // if (SLACK_WORKFLOW_WEBHOOK) {
    //   const foodsText = foods.length ? `• ${foods.join("\n• ")}` : "";

    //   const slackPayload = {
    //     date: dateText,
    //     message: `Mọi người vào đặt cơm, ${time} em chốt ạ`,
    //     url: SITE_URL,
    //     foods: foodsText,
    //   };

    //   try {
    //     const res = await fetch(SLACK_WORKFLOW_WEBHOOK, {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify(slackPayload),
    //     });

    //     if (!res.ok) {
    //       const text = await res.text().catch(() => "");
    //       console.error(
    //         "Slack workflow webhook returned error:",
    //         res.status,
    //         text,
    //       );
    //       results.push({ platform: "slack", success: false, error: text });
    //     } else {
    //       console.log("Slack announce sent successfully");
    //       results.push({ platform: "slack", success: true });
    //     }
    //   } catch (err: any) {
    //     console.error("Slack webhook fetch failed:", err);
    //     results.push({
    //       platform: "slack",
    //       success: false,
    //       error: err.message,
    //     });
    //   }
    // }

    const allFailed = results.length > 0 && results.every((r) => !r.success);

    if (allFailed) {
      return NextResponse.json(
        { error: "Failed to send announcements", details: results },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("Error in /api/admin/announce:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
