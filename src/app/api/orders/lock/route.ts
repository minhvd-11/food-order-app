import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { orderDay } from "@/lib/orderDate";
import { createClient } from "@/lib/supabase/server";
import { isOrderAdmin } from "@/lib/orderAdmin";

/** Whether today's ordering is locked ("đã chốt đơn"). */
export async function GET() {
  const today = orderDay();
  const lock = await prisma.orderLock.findUnique({ where: { date: today } });
  return NextResponse.json({ locked: !!lock });
}

/** Lock or reopen today's ordering. Only order admins may call this. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;

  if (!isOrderAdmin(email)) {
    return NextResponse.json(
      { message: "Bạn không có quyền chốt/mở lại đơn" },
      { status: 403 },
    );
  }

  const { locked } = (await req.json()) as { locked?: boolean };

  if (typeof locked !== "boolean") {
    return NextResponse.json(
      { message: "Thiếu trạng thái chốt đơn" },
      { status: 400 },
    );
  }

  const today = orderDay();

  if (locked) {
    await prisma.orderLock.upsert({
      where: { date: today },
      update: {},
      create: { date: today, lockedBy: email },
    });
  } else {
    await prisma.orderLock.deleteMany({ where: { date: today } });
  }

  return NextResponse.json({ locked });
}
