"use client";

import { useEffect, useState } from "react";
import Avatar from "./avatar";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  name: string;
  shortName: string;
  email: string;
  avatarUrl: string | null;
}

export default function AccountForm({ user }: { user: User }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const res = await fetch("/api/users");
      const users: UserProfile[] = await res.json();
      const current = users.find((u) => u.id === user.id);

      if (current) {
        setProfile(current);
        setName(current.name || "");
        setAvatarUrl(current.avatarUrl || "");
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;

    const res = await fetch(`/api/users/${profile.id}`, {
      method: "PUT",
      body: JSON.stringify({ name, avatarUrl }),
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully!");
    }
  };

  if (loading || !profile) return <p>Loading...</p>;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <Avatar avatarUrl={avatarUrl} size={120} />

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="text"
          value={profile.email}
          disabled
          className="w-full border border-gray-200 dark:border-neutral-700 px-3 py-2 rounded bg-gray-100 dark:bg-neutral-800 text-sm dark:text-gray-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Short Name</label>
        <input
          type="text"
          value={profile.shortName}
          disabled
          className="w-full border border-gray-200 dark:border-neutral-700 px-3 py-2 rounded bg-gray-100 dark:bg-neutral-800 text-sm dark:text-gray-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 rounded text-sm dark:text-gray-100"
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded hover:bg-blue-700 dark:hover:bg-blue-600"
      >
        Save
      </button>
    </div>
  );
}
