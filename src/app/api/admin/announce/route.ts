// app/api/admin/announce/route.ts
import { NextRequest, NextResponse } from "next/server";

const WORKFLOW_WEBHOOK = process.env.SLACK_WORKFLOW_WEBHOOK;
const SITE_URL = process.env.SITE_URL || "https://daily-lunch-2025.vercel.app";

export async function POST(req: NextRequest) {
  if (!WORKFLOW_WEBHOOK) {
    console.error("Missing SLACK_WORKFLOW_WEBHOOK env var");
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { date, foods, time } = body;

    if (!date || !Array.isArray(foods)) {
      return NextResponse.json(
        { error: "Invalid payload: date and foods required" },
        { status: 400 }
      );
    }

    const dateText = new Date(date).toLocaleDateString("vi-VN");
    const foodsText = foods.length ? `• ${foods.join("\n• ")}` : "";

    const payload = {
      date: dateText,
      message: `Mọi người vào đặt cơm, ${time} em chốt ạ`,
      url: SITE_URL,
      foods: foodsText,
    };

    const webhookRes = await fetch(WORKFLOW_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!webhookRes.ok) {
      const text = await webhookRes.text().catch(() => "");
      console.error(
        "Slack workflow webhook returned error:",
        webhookRes.status,
        text
      );
      return NextResponse.json(
        { error: "Failed to trigger Slack workflow", details: text },
        { status: 502 }
      );
    }

    console.log(payload);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in /api/admin/announce:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
