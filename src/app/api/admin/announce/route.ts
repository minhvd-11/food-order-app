// app/api/admin/announce/route.ts
import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CHAT_WEBHOOK = process.env.GOOGLE_CHAT_WEBHOOK;
const SLACK_WORKFLOW_WEBHOOK = process.env.SLACK_WORKFLOW_WEBHOOK;
const SITE_URL = process.env.SITE_URL || "https://daily-lunch-2025.vercel.app";

export async function POST(req: NextRequest) {
  if (!GOOGLE_CHAT_WEBHOOK && !SLACK_WORKFLOW_WEBHOOK) {
    console.error(
      "Missing both GOOGLE_CHAT_WEBHOOK and SLACK_WORKFLOW_WEBHOOK env vars",
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

    const results: { platform: string; success: boolean; error?: string }[] =
      [];

    // --- Google Chat ---
    if (GOOGLE_CHAT_WEBHOOK) {
      const foodsHtml = foods.length
        ? foods.map((f) => `• ${f}`).join("<br>")
        : "";

      const googleChatPayload = {
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

      try {
        const res = await fetch(GOOGLE_CHAT_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(googleChatPayload),
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

    // --- Slack ---
    if (SLACK_WORKFLOW_WEBHOOK) {
      const foodsText = foods.length ? `• ${foods.join("\n• ")}` : "";

      const slackPayload = {
        date: dateText,
        message: `Mọi người vào đặt cơm, ${time} em chốt ạ`,
        url: SITE_URL,
        foods: foodsText,
      };

      try {
        const res = await fetch(SLACK_WORKFLOW_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(slackPayload),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error(
            "Slack workflow webhook returned error:",
            res.status,
            text,
          );
          results.push({ platform: "slack", success: false, error: text });
        } else {
          console.log("Slack announce sent successfully");
          results.push({ platform: "slack", success: true });
        }
      } catch (err: any) {
        console.error("Slack webhook fetch failed:", err);
        results.push({
          platform: "slack",
          success: false,
          error: err.message,
        });
      }
    }

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
