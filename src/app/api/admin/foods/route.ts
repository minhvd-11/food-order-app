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

    const foodRecords = await Promise.all(
      foods.map(async (name) => {
        const food = await prisma.food.upsert({
          where: { name },
          update: {},
          create: { name },
        });

        await prisma.dayFood.upsert({
          where: {
            date_foodId: {
              date: localDate,
              foodId: food.id,
            },
          },
          update: {},
          create: {
            date: localDate,
            foodId: food.id,
          },
        });

        return food;
      })
    );

    return NextResponse.json({ success: true, foods: foodRecords });
  } catch (err) {
    console.error("POST /admin/foods error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
