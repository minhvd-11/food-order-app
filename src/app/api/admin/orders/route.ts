// app/api/admin/orders/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const groupBy = req.nextUrl.searchParams.get("groupBy") ?? "day";
  const value = req.nextUrl.searchParams.get("value");

  if (!value) {
    return NextResponse.json({ data: [] });
  }

  if (groupBy === "user") {
    const orders = await prisma.order.findMany({
      where: { user: { name: value } },
      include: {
        user: true,
        items: { include: { food: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const grouped = orders.map((o) => ({
      userName: o.user.name,
      foodNames: o.items.map((i) => i.food.name),
      date: o.date,
      id: o.id,
    }));
    return NextResponse.json({ groupBy: "user", data: grouped });
  } else {
    const date = startOfDay(new Date(value));
    const orders = await prisma.order.findMany({
      where: { date },
      include: {
        user: true,
        items: { include: { food: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const groupedByDay = [
      {
        date,
        orders: orders.map((o) => ({
          userName: o.user.name,
          foodNames: o.items.map((i) => i.food.name),
          id: o.id,
        })),
      },
    ];
    return NextResponse.json({ groupBy: "day", data: groupedByDay });
  }
}
