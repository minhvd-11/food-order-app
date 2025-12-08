import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL;

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Thiếu nội dung" }, { status: 400 });
    }

    const prompt = `
      Đây là đoạn văn bản có chứa các món ăn bằng tiếng Việt:
      "${text}"
      Nhiệm vụ:
      1. Loại bỏ các từ ngữ thừa không phải món ăn.
      2. Sửa lỗi chính tả (nhưng không thay đổi món ăn thành món khác).
      3. Trích xuất từng món thành mảng JSON objects.
      
      Output format:
      [{ "name": "tên món" }]
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
        // CONFIGURATION: Force JSON response
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errorBody = await geminiRes.text();

      // Check specifically for the 429 error
      if (geminiRes.status === 429) {
        console.error("Gemini Quota Exceeded:", errorBody);
        return NextResponse.json(
          { error: "Server đang quá tải, vui lòng thử lại sau 30 giây." },
          { status: 429 }
        );
      }

      console.error("Gemini API error:", geminiRes.status, errorBody);
      return NextResponse.json(
        { error: "Gemini API request failed" },
        { status: 500 }
      );
    }

    const geminiData = await geminiRes.json();
    const textOutput = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      return NextResponse.json(
        { error: "Không nhận được phản hồi từ AI" },
        { status: 500 }
      );
    }

    let foods;
    try {
      foods = JSON.parse(textOutput);
    } catch (e) {
      console.error("JSON Parse Error:", textOutput);
      return NextResponse.json(
        { error: "Lỗi định dạng dữ liệu từ AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ foods });
  } catch (err: any) {
    console.error("Lỗi phân tích AI:", err.message || err);
    return NextResponse.json(
      { error: "Lỗi server hoặc không phân tích được" },
      { status: 500 }
    );
  }
}
