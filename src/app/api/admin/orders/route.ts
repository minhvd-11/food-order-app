// app/api/admin/orders/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        items: {
          include: {
            food: true,
          },
        },
      },
    });

    return NextResponse.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
