import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const dateParam = url.searchParams.get("date");
  const userId = url.searchParams.get("userId");
  const monthParam = url.searchParams.get("month");

  // ===== CASE 3: Monthly summary grouped by user =====
  if (monthParam && !userId) {
    const [year, month] = monthParam.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const grouped = await prisma.order.groupBy({
      by: ["userId"],
      where: { date: { gte: start, lte: end } },
      _count: { id: true },
      _sum: { price: true },
    });

    const userIds = grouped.map((g) => g.userId).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, shortName: true },
    });

    const userMap = Object.fromEntries(
      users.map((u) => [u.id, { name: u.name, shortName: u.shortName }])
    );

    const summary = grouped.map((g) => ({
      userId: g.userId,
      userName: userMap[g.userId]?.name || "Unknown",
      userShortName: userMap[g.userId]?.shortName || "Unknown",
      count: g._count.id,
      money: g._sum.price ?? 0, // Real total amount (handles null if no orders, but shouldn't happen)
    }));

    // Sort by count descending
    summary.sort((a, b) => b.count - a.count);

    return NextResponse.json({ summary });
  }

  // ===== CASE 2: Monthly orders for a single user =====
  if (monthParam && userId) {
    const [year, month] = monthParam.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const orders = await prisma.order.findMany({
      where: { userId, date: { gte: start, lte: end } },
      include: {
        user: true,
        items: { include: { food: true } },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        date: o.date,
        userShortName: o.user.shortName,
        userName: o.user.name,
        foodNames: o.items.map((i) => i.food.name),
        price: o.price,
      })),
    });
  }

  // ===== CASE 1: Daily orders =====
  let where: any = {};
  if (dateParam) {
    const date = startOfDay(new Date(dateParam));
    where.date = date;
  }
  if (userId) {
    where.userId = userId;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: true,
      items: { include: { food: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      date: o.date,
      userShortName: o.user.shortName,
      userName: o.user.name,
      foodNames: o.items.map((i) => i.food.name),
      price: o.price,
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
