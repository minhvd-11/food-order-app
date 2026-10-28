import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import UserOrderStats from "@/components/UserOrderInfo";
import { EmptyState, PageBackground } from "@/components/PageLayout";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import AccountForm from "./account-form";
import Avatar from "./avatar";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // users get a profile when they first sign in with Google (see syncUserWithPrisma)
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, shortName: true, email: true, avatarUrl: true },
  });
  const name = profile?.name ?? user.email ?? "Bạn";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <PageBackground />

      <header className="mb-8 flex items-center gap-4">
        <Avatar avatarUrl={profile?.avatarUrl ?? null} name={name} size={64} />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">{name}</h1>
          <p className="truncate text-sm text-muted-foreground">
            {profile?.email ?? user.email}
          </p>
        </div>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <UserOrderStats userId={user.id} />
        <aside className="lg:sticky lg:top-24">
          {profile ? (
            <AccountForm profile={profile} />
          ) : (
            <EmptyState
              icon={UserRound}
              title="Chưa có hồ sơ đặt cơm"
              description="Hồ sơ được tạo khi bạn đăng nhập bằng Google."
            />
          )}
        </aside>
      </div>
    </main>
  );
}
