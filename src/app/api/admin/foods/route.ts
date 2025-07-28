// app/api/admin/foods/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { foods, date } = body as { foods: string[]; date?: string };

    const parsedDate = date ? new Date(date) : new Date();
    const dateOnly = new Date(parsedDate.toISOString().split("T")[0]);

    const foodRecords = await Promise.all(
      foods.map(async (name) => {
        const food = await prisma.food.upsert({
          where: { name },
          update: {},
          create: { name },
        });

        // Upsert DayFood based on (date, foodId)
        await prisma.dayFood.upsert({
          where: {
            date_foodId: {
              date: dateOnly,
              foodId: food.id,
            },
          },
          update: {},
          create: {
            date: dateOnly,
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
