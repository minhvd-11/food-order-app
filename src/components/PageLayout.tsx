import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Cream background with a soft brand glow; fixed so it fills the viewport whatever the content height
export function PageBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-[#FFFBF0] bg-radial-[ellipse_48rem_28rem_at_50%_4rem] from-red-200/50 to-transparent dark:bg-neutral-950 dark:from-red-900/25"
    />
  );
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-900/50">
          <Icon className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
    </header>
  );
}

export function StatTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-red-100 bg-card p-4 shadow-sm dark:border-neutral-800",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold sm:text-2xl">{value}</p>
      {hint && (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

// First-load placeholder shaped like a row of stat tiles above a list
export function PageSkeleton() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Đang tải...</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "h-[88px] animate-pulse rounded-xl bg-muted",
              i === 2 && "col-span-2 sm:col-span-1",
            )}
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-red-200 bg-card/60 px-6 py-14 text-center dark:border-neutral-800">
      <span className="mb-1 flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400">
        <Icon className="size-6" />
      </span>
      <p className="font-medium">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
