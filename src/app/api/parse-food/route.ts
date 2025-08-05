import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Thiếu nội dung" }, { status: 400 });
    }

    const prompt = `
      Đây là đoạn văn bản có chứa các món ăn bằng tiếng Việt:
      "${text}"
      Loại bỏ các từ ngữ thừa không phải món ăn, sửa lỗi chính tả không tự sửa đổi thành món ăn khác, đảm bảo giữ nguyên số món ăn và trích xuất từng món thành mảng JSON có dạng:
      [{ "name": "tên món" }]
      Chỉ trả về JSON, không giải thích gì thêm.
    `;

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const errorBody = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errorBody);
      return NextResponse.json(
        { error: "Gemini API request failed" },
        { status: 500 }
      );
    }

    const geminiData = await geminiRes.json();

    const textOutput =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!textOutput) {
      return NextResponse.json(
        { error: "Không nhận được phản hồi từ AI" },
        { status: 500 }
      );
    }

    // Extract and parse the JSON from the response
    const cleaned = textOutput.replace(/^```json\n/, "").replace(/\n```$/, "");
    const foods = JSON.parse(cleaned);

    return NextResponse.json({ foods });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Lỗi phân tích AI:", err.message || err);
    return NextResponse.json(
      { error: "Lỗi server hoặc không phân tích được" },
      { status: 500 }
    );
  }
}
