import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay } from "date-fns";

type OrderRequest = {
  name: string;
  foodIds: string[];
};

export async function POST(req: Request) {
  const { name, foodIds }: OrderRequest = await req.json();

  if (!name || !Array.isArray(foodIds) || foodIds.length === 0) {
    return NextResponse.json(
      { message: "Missing name or foodIds" },
      { status: 400 }
    );
  }

  const today = startOfDay(new Date());

  const user = await prisma.user.upsert({
    where: { name },
    update: {},
    create: { name },
  });

  const existingOrder = await prisma.order.findFirst({
    where: { userId: user.id, date: today },
  });

  if (existingOrder) {
    return NextResponse.json(
      { message: "Already submitted today" },
      { status: 400 }
    );
  }

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      date: today,
      items: {
        create: foodIds.map((foodId) => ({ foodId })),
      },
    },
  });

  return NextResponse.json({ message: "Order submitted", orderId: order.id });
}
