import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { fromZonedTime } from "date-fns-tz";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { foods, date } = body as { foods: string[]; date?: string };

    const parsedDate = date ? new Date(date) : new Date();
    const localDate = fromZonedTime(parsedDate, "Asia/Ho_Chi_Minh");
    localDate.setHours(17, 0, 0, 0);

    // Batch queries instead of 2 upserts per food in parallel, which
    // exhausted the DB connection pool when saving many foods at once.
    const names = [...new Set(foods)];

    await prisma.food.createMany({
      data: names.map((name) => ({ name })),
      skipDuplicates: true,
    });

    const existing = await prisma.food.findMany({
      where: { name: { in: names } },
    });

    await prisma.dayFood.createMany({
      data: existing.map((food) => ({ date: localDate, foodId: food.id })),
      skipDuplicates: true,
    });

    const byName = new Map(existing.map((food) => [food.name, food]));
    const foodRecords = names.map((name) => byName.get(name)!);

    return NextResponse.json({ success: true, foods: foodRecords });
  } catch (err) {
    console.error("POST /admin/foods error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
