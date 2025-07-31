"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/admin/orders", label: "Quản lý đơn" },
  { href: "/admin/parse", label: "Tạo danh sách" },
  { href: "/admin/manage", label: "Quản trị" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full bg-white border-b shadow-sm mb-6">
      <div className="max-w-5xl mx-auto px-4 py-3 flex gap-6 items-center">
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
    </nav>
  );
}
