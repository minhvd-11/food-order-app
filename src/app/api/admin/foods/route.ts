// app/api/admin/foods/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { foods, date } = body as { foods: string[]; date?: string };

    const parsedDate = date ? new Date(date) : new Date();
    const isoDate = parsedDate.toISOString().split("T")[0]; // yyyy-mm-dd

    // Upsert DayFood
    const day = await prisma.day.upsert({
      where: { date: isoDate },
      update: {},
      create: { date: isoDate },
    });

    // For each food name, connect or create, then link to Day
    const foodRecords = await Promise.all(
      foods.map(async (name) => {
        const food = await prisma.food.upsert({
          where: { name },
          update: {},
          create: { name },
        });

        await prisma.dayFood.upsert({
          where: {
            dayId_foodId: {
              dayId: day.id,
              foodId: food.id,
            },
          },
          update: {},
          create: {
            dayId: day.id,
            foodId: food.id,
          },
        });

        return food;
      })
    );

    return NextResponse.json({ success: true, foods: foodRecords });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
