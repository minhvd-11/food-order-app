// app/api/admin/orders/route.ts

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date");

  let dateFilter = {};
  if (dateParam) {
    const date = new Date(dateParam);
    dateFilter = {
      date: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(24, 0, 0, 0)),
      },
    };
  }

  const orders = await prisma.order.findMany({
    where: dateFilter,
    include: {
      user: true,
      items: {
        include: { food: true },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ orders });
}
