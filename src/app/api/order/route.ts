import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay } from "date-fns";

type OrderRequest = {
  name: string;
  shortName?: string;
  foodIds: string[];
};

export async function POST(req: Request) {
  const { name, shortName, foodIds }: OrderRequest = await req.json();

  if (!name || !Array.isArray(foodIds) || foodIds.length === 0) {
    return NextResponse.json(
      { message: "Thiếu tên hoặc món ăn" },
      { status: 400 }
    );
  }

  const today = startOfDay(new Date());

  let user = await prisma.user.findFirst({ where: { name } });

  if (!user && shortName) {
    user = await prisma.user.upsert({
      where: { shortName },
      update: { name },
      create: { id: shortName, shortName, name },
    });
  }

  if (!user) {
    return NextResponse.json(
      { message: "Không tìm thấy người dùng" },
      { status: 400 }
    );
  }

  const existingOrder = await prisma.order.findFirst({
    where: { userId: user.id, date: today },
  });

  if (existingOrder) {
    return NextResponse.json(
      { message: "Đã đặt đơn hôm nay rồi" },
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

  return NextResponse.json({
    message: "Lưu đơn thành công",
    orderId: order.id,
  });
}
