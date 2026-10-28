"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, Input } from "@/components/ui";

export type AccountProfile = {
  id: string;
  name: string;
  shortName: string;
};

export default function AccountForm({ profile }: { profile: AccountProfile }) {
  const router = useRouter();
  const [savedName, setSavedName] = useState(profile.name);
  const [name, setName] = useState(profile.name);
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();
  const canSave = !!trimmed && trimmed !== savedName && !saving;

  const handleSave = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${profile.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: trimmed }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      setSavedName(trimmed);
      setName(trimmed);
      toast.success("Đã lưu thông tin");
      router.refresh(); // show the new name in the page header
    } catch {
      toast.error("Không lưu được, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="gap-0 border-red-100 py-0 dark:border-neutral-800">
      <h2 className="border-b border-border px-5 py-4 font-semibold">
        Thông tin cá nhân
      </h2>

      <form onSubmit={handleSave} className="space-y-4 p-5">
        <div className="space-y-2">
          <label htmlFor="account-short-name" className="text-sm font-medium">
            Tên tài khoản
          </label>
          <Input
            id="account-short-name"
            value={profile.shortName}
            readOnly
            aria-describedby="account-short-name-hint"
            className="bg-muted/60 text-muted-foreground"
          />
          <p
            id="account-short-name-hint"
            className="text-xs text-muted-foreground"
          >
            Lấy từ email, không thể thay đổi.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="account-name" className="text-sm font-medium">
            Họ và tên
          </label>
          <Input
            id="account-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            autoComplete="name"
          />
        </div>

        <Button type="submit" disabled={!canSave} className="w-full">
          {saving && <Loader2 className="animate-spin" />}
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </form>
    </Card>
  );
}
