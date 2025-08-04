// lib/prisma/syncUser.ts
import { prisma } from "@/lib/prisma"; // your server-side prisma client
import { User } from "@supabase/supabase-js";

export async function syncUserWithPrisma(user: User) {
  if (!user.email) return;

  try {
    const { id, email, user_metadata } = user;

    const name =
      user_metadata?.full_name || email.split("@")[0] || "Người dùng";

    const shortName = email.split("@")[0]; // ✅ Prevent editing: derive only from email
    const avatarUrl = user_metadata?.avatar_url || null;

    await prisma.user.upsert({
      where: { id },
      update: {
        name,
        email,
        avatarUrl,
      },
      create: {
        id,
        email,
        name,
        avatarUrl,
        shortName, // only set once on create
      },
    });
  } catch (err) {
    console.error("❌ Failed to sync user to Prisma:", err);
  }
}
