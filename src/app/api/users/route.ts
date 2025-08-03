import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      shortName: true,
      email: true,
      avatarUrl: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function PUT(req: NextRequest) {
  const { id, name, avatarUrl } = await req.json();

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id },
    data: { name, avatarUrl },
  });

  return NextResponse.json(updated);
}
