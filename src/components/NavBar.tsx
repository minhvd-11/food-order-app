"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useUser } from "@/contexts/UserContext";

const navLinks = [
  { href: "/admin/orders", label: "Tra cứu đơn" },
  { href: "/admin/parse", label: "Tạo thực đơn" },
  { href: "/admin/manage", label: "Thống kê đơn" },
];

export function Navbar() {
  const { userMetadata, loading } = useUser();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="w-full bg-white border-b shadow-sm mb-6">
      <div className="max-w-5xl mx-auto px-4 py-3 flex gap-6 items-center justify-between">
        <Link href="/">
          <Image
            src="/logo/DL_logo_full.svg"
            alt="Logo"
            width={40}
            height={40}
          />
        </Link>

        <div className="flex gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "text-sm font-medium hover:text-blue-600",
                pathname === link.href
                  ? "text-blue-600 underline"
                  : "text-gray-700"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {loading ? null : userMetadata ? (
            <>
              <Link href="/account">
                <Image
                  src={
                    userMetadata.avatar_url || "/public/logo.Dailylunchlogo.png"
                  }
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="rounded-full ml-2"
                />
              </Link>
              <Link href="/account" className="text-sm text-gray-700">
                {userMetadata.name}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm border px-3 py-1 rounded hover:bg-gray-100"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm border px-3 py-1 rounded hover:bg-gray-100"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
