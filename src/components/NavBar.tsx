"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useUser } from "@/contexts/UserContext";
import { BarChart2, FilePlus, LogOut, Search, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const navLinks = [
  { href: "/orders", label: "Tra cứu đơn", icon: <Search size={18} /> },
  { href: "/admin/parse", label: "Tạo thực đơn", icon: <FilePlus size={18} /> },
  {
    href: "/manage",
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
    <nav className="relative w-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm border-b border-red-100 dark:border-neutral-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex gap-6 items-center justify-between">
        <Link href="/" className="hidden sm:inline">
          <div className="flex items-center gap-2">
            <Image
              src="/logo/DL_logo_full.svg"
              alt="Logo"
              width={40}
              height={40}
            />
            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-red-700 to-red-500 bg-clip-text text-transparent">
              Daily Lunch
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "text-sm font-medium hover:text-red-600 dark:hover:text-red-400 transition-colors",
                pathname === link.href
                  ? "hover:text-red-600 dark:hover:text-red-400 underline"
                  : "text-gray-700 dark:text-gray-300",
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
          type="button"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {loading ? null : userMetadata ? (
            <>
              <Link
                href="/account"
                className="flex gap-2 items-center border-r border-gray-200 dark:border-neutral-700 gap-3 pr-4"
              >
                <Image
                  src={
                    userMetadata.avatar_url || "/public/logo.Dailylunchlogo.png"
                  }
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="rounded-full ml-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
                  {userMetadata.name}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-all text-sm font-medium cursor-pointer"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950 transition-all text-sm font-medium cursor-pointer"
            >
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div
          className={clsx(
            "absolute top-full left-0 w-full bg-white/99 dark:bg-neutral-900/99 backdrop-blur-sm shadow-sm border-t border-gray-100 dark:border-neutral-800 z-50 md:hidden transition-all duration-200 origin-top",
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
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800",
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            <div className="flex items-center justify-between px-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Chế độ tối
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
