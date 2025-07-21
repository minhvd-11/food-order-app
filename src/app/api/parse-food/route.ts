/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/api/parse-food.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing food list text" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Đây là đoạn văn bản có chứa các món ăn viết tự nhiên của người Việt:
"${text}"
Loại bỏ các từ ngữ thừa không phải món ăn, tự động sửa lỗi chính tả,
Hãy trích xuất từng món thành mảng JSON có dạng:
[
  { "name": "tên món" }
]

Chỉ trả về JSON, không giải thích gì thêm.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const parsed = response.text().trim();

    // Try to safely parse the JSON
    const jsonStart = parsed.indexOf("[");
    const json = parsed.slice(jsonStart);

    const foods = JSON.parse(json);
    return res.status(200).json({ foods });
  } catch (err: any) {
    console.error("Gemini API error:", err.message);
    return res.status(500).json({ error: "Failed to parse food text" });
  }
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Thiếu nội dung" }, { status: 400 });
    }

    // Mock AI parsing
    const foods = text.split(",").map((item: string, i: any) => ({
      id: `${i}`,
      name: item.trim(),
    }));

    return NextResponse.json({ foods });
  } catch (error: any) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
