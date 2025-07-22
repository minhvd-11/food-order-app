// app/api/foods/today/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay } from "date-fns";

export async function GET() {
  const today = startOfDay(new Date());

  try {
    const foods = await prisma.dayFood.findMany({
      where: { date: today },
      include: { food: true },
    });

    return NextResponse.json(
      foods.map((df: { food: { id: number; name: string } }) => ({
        id: df.food.id,
        name: df.food.name,
      }))
    );
  } catch (err) {
    console.error("Error fetching today foods:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
