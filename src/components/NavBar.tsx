"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const navLinks = [
  { href: "/admin/orders", label: "Quản lý đơn" },
  { href: "/admin/parse", label: "Tạo danh sách" },
  { href: "/admin/manage", label: "Quản trị" },
];

export function Navbar() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else console.log(error);
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/"; // or use router.replace("/")
  };

  return (
    <nav className="w-full bg-white border-b shadow-sm mb-6">
      <div className="max-w-5xl mx-auto px-4 py-3 flex gap-6 items-center justify-around">
        {/* Logo */}
        <Link href="/">
          <Image
            src="/logo/DL_logo_full.svg"
            alt="Logo"
            width={40}
            height={40}
          />
        </Link>

        {/* Navigation Links */}
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

        {/* Auth Section */}
        <div className="flex items-center gap-3">
          {userEmail ? (
            <>
              <span className="text-sm text-gray-700">{userEmail}</span>
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
