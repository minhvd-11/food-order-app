"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useUser } from "@/contexts/UserContext";
import { BarChart2, FilePlus, LogOut, Search, Menu, X } from "lucide-react";

const navLinks = [
  { href: "/admin/orders", label: "Tra cứu đơn", icon: <Search size={18} /> },
  { href: "/admin/parse", label: "Tạo thực đơn", icon: <FilePlus size={18} /> },
  {
    href: "/admin/manage",
    label: "Thống kê đơn",
    icon: <BarChart2 size={18} />,
  },
];

export function Navbar() {
  const { userMetadata, loading } = useUser();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="relative w-full bg-white border-b shadow-sm mb-6">
      <div className="max-w-5xl mx-auto px-4 py-3 flex gap-6 items-center justify-between">
        <Link href="/" className="hidden sm:inline">
          <Image
            src="/logo/DL_logo_full.svg"
            alt="Logo"
            width={40}
            height={40}
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "text-sm font-medium hover:text-blue-600",
                pathname === link.href
                  ? "text-blue-600 underline"
                  : "text-gray-700",
              )}
            >
              <div className="flex items-center gap-2">
                {link.icon}
                {link.label}
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="flex items-center gap-4">
          {loading ? null : userMetadata ? (
            <>
              <Link href="/account" className="flex gap-2 items-center">
                <Image
                  src={
                    userMetadata.avatar_url || "/public/logo.Dailylunchlogo.png"
                  }
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="rounded-full ml-2"
                />
                <span className="text-sm text-gray-700 hidden sm:inline">
                  {userMetadata.name}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all text-sm font-medium"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-all text-sm font-medium"
            >
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div
          className={clsx(
            "absolute top-full left-0 w-full bg-white shadow-md border-t z-50 md:hidden transition-all duration-200 origin-top",
            mobileOpen
              ? "opacity-100 scale-y-100"
              : "opacity-0 scale-y-95 pointer-events-none",
          )}
        >
          <div className="flex flex-col p-4 gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-3 text-sm font-medium px-2 py-2 rounded-lg",
                  pathname === link.href
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50",
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
