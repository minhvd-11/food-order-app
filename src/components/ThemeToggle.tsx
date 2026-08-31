"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <Sun
        size={16}
        className={isDark ? "text-muted-foreground" : "text-amber-500"}
      />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Chuyển chế độ sáng/tối"
      />
      <Moon
        size={16}
        className={isDark ? "text-indigo-400" : "text-muted-foreground"}
      />
    </label>
  );
}
