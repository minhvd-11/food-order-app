import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date");
  if (!dateParam) return NextResponse.json({ orders: [] });

  const date = startOfDay(new Date(dateParam));

  const orders = await prisma.order.findMany({
    where: { date },
    include: {
      user: true,
      items: { include: { food: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      userName: o.user.name,
      foodNames: o.items.map((i) => i.food.name),
    })),
  });
}

export async function DELETE(req: NextRequest) {
  const { orderId } = await req.json();
  if (!orderId)
    return NextResponse.json({ error: "orderId required" }, { status: 400 });

  await prisma.orderItem.deleteMany({ where: { orderId } });
  await prisma.order.delete({ where: { id: orderId } });

  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  const { userName, date, foodIds } = await req.json();

  if (!userName || !date || !Array.isArray(foodIds)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Find or create the user
  const user = await prisma.user.upsert({
    where: { name: userName },
    update: {},
    create: { name: userName },
  });

  // Remove existing order (if any) for that date
  await prisma.order.deleteMany({
    where: {
      userId: user.id,
      date: new Date(date),
    },
  });

  // Create new order
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      date: new Date(date),
      items: {
        create: foodIds.map((foodId: string) => ({
          foodId,
        })),
      },
    },
  });

  return NextResponse.json({ success: true, order });
}
