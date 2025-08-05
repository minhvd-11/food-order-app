import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

export async function GET() {
  const timeZone = "Asia/Ho_Chi_Minh";
  const now = new Date();

  const start = fromZonedTime(startOfDay(now), timeZone);
  const end = fromZonedTime(endOfDay(now), timeZone);

  try {
    const foods = await prisma.dayFood.findMany({
      where: {
        date: {
          gte: start,
          lt: end,
        },
      },
      include: {
        food: true,
      },
    });

    return NextResponse.json(
      foods.map((df) => ({
        id: df.food.id,
        name: df.food.name,
      }))
    );
  } catch (err) {
    console.error("Error fetching today foods:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
