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
      userShortName: o.user.shortName,
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
  const { shortName, date, foodIds } = await req.json();

  if (!shortName || !date || !Array.isArray(foodIds)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Find user by shortName
  const user = await prisma.user.findUnique({
    where: { shortName },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const orderDate = startOfDay(new Date(date));

  // Remove existing order (if any) for that date
  await prisma.order.deleteMany({
    where: {
      userId: user.id,
      date: orderDate,
    },
  });

  // Create new order
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      date: orderDate,
      items: {
        create: foodIds.map((foodId: string) => ({
          foodId,
        })),
      },
    },
  });

  return NextResponse.json({ success: true, order });
}
