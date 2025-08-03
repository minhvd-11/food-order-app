import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay } from "date-fns";

type OrderRequest = {
  shortName: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  foodIds: string[];
};

export async function POST(req: Request) {
  const { shortName, name, email, avatarUrl, foodIds }: OrderRequest =
    await req.json();

  if (!shortName || !Array.isArray(foodIds) || foodIds.length === 0) {
    return NextResponse.json(
      { message: "Missing shortName or foodIds" },
      { status: 400 }
    );
  }

  const today = startOfDay(new Date());

  // First try to find existing user
  let user = await prisma.user.findUnique({ where: { shortName } });

  // If not exists, create new
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        shortName,
        name: name || shortName,
        email,
        avatarUrl,
      },
    });
  }

  // Check if already submitted today
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
