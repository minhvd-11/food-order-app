"use client";

import { addMonths, format, isSameMonth, startOfMonth } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

// ‹ Tháng 10/2026 › with a shortcut back to the current month; future months are disabled
export function MonthStepper({
  month,
  onChange,
  loading,
}: {
  month: Date;
  onChange: (month: Date) => void;
  loading?: boolean;
}) {
  const isCurrentMonth = isSameMonth(month, new Date());

  return (
    <div className="flex items-center gap-2">
      {!isCurrentMonth && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(startOfMonth(new Date()))}
        >
          Tháng này
        </Button>
      )}
      <div className="flex items-center rounded-lg border border-input bg-card p-1 shadow-xs">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Tháng trước"
          onClick={() => onChange(addMonths(month, -1))}
        >
          <ChevronLeft />
        </Button>
        <span className="flex w-36 items-center justify-center gap-2 text-sm font-medium">
          {loading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <CalendarDays className="size-4 text-muted-foreground" />
          )}
          Tháng {format(month, "MM/yyyy")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Tháng sau"
          disabled={isCurrentMonth}
          onClick={() => onChange(addMonths(month, 1))}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
