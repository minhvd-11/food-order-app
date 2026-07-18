import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { name, avatarUrl } = await req.json();

  const updated = await prisma.user.update({
    where: { id },
    data: { name, avatarUrl },
  });

  return NextResponse.json(updated);
}
