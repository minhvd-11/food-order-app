// app/api/admin/filters/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const groupBy = req.nextUrl.searchParams.get("groupBy") ?? "day";

  if (groupBy === "user") {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    });
    return NextResponse.json({ groupBy, options: users.map((u) => u.name) });
  }

  // Default: groupBy day
  const days = await prisma.order.findMany({
    distinct: ["date"],
    orderBy: { date: "desc" },
    select: { date: true },
  });
  return NextResponse.json({
    groupBy,
    options: days.map((d) => d.date.toISOString()),
  });
}
