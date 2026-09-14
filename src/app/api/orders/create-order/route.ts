import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay } from "date-fns";
import { notifyOrderCreated } from "@/lib/chatNotifications";

type OrderRequest = {
  name: string;
  shortName?: string;
  foodIds?: string[];
  note?: string;
  price?: number;
};

const BASE_PRICE = 30000;

export async function POST(req: Request) {
  const { name, shortName, foodIds, note, price }: OrderRequest =
    await req.json();

  const finalPrice = price ?? BASE_PRICE;

  if (
    (!name || !Array.isArray(foodIds) || foodIds.length === 0) &&
    price !== 10000
  ) {
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
      note,
      price: finalPrice,
      date: today,
      items: {
        create: foodIds?.map((foodId) => ({ foodId })),
      },
    },
    include: { items: { include: { food: true } } },
  });

  // The order is this many orders deep for the day, counting itself.
  const orderNumber = await prisma.order.count({ where: { date: today } });

  await notifyOrderCreated({
    user,
    dateText: today.toLocaleDateString("vi-VN"),
    orderNumber,
    foods: order.items.map((item) => item.food.name),
    note,
    price: finalPrice,
  });

  return NextResponse.json({
    message: "Lưu đơn thành công",
    orderId: order.id,
    orderNumber,
  });
}
