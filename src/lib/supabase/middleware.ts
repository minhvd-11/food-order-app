import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from /admin
  if (!user && request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ✅ Sync Supabase user into Prisma.User
  if (user) {
    try {
      const { id, email, user_metadata } = user;

      if (!email) return supabaseResponse; // Skip if no email

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

  return supabaseResponse;
}
