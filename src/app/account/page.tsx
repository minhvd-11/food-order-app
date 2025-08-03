import UserOrderStats from "@/components/UserOrderInfo";
import AccountForm from "./account-form";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <div className="text-center py-20">Not logged in.</div>;

  return (
    <div className="flex flex-col lg:flex-row justify-between gap-8 px-4 py-8 max-w-6xl mx-auto">
      <div className="flex-1">
        <UserOrderStats userId={user.id} />
      </div>
      <div className="w-full lg:w-[400px]">
        <AccountForm user={user} />
      </div>
    </div>
  );
}
