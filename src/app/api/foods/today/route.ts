// app/api/foods/today/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  const now = new Date();

  try {
    const foods = await prisma.dayFood.findMany({
      where: {
        date: {
          gte: startOfDay(now),
          lt: endOfDay(now),
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
