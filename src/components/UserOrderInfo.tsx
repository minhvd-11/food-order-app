"use client";

import { useEffect, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { CalendarX2, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui";
import { EmptyState, PageSkeleton } from "@/components/PageLayout";
import { MonthStepper } from "@/components/MonthStepper";
import {
  DatedOrder,
  DatedOrderList,
  OrderSummary,
} from "@/components/OrderList";
import { cn, fetchJson } from "@/lib/utils";

// One person's orders, a month at a time
export default function UserOrderStats({ userId }: { userId: string }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [data, setData] = useState<{
    month: string;
    orders: DatedOrder[];
  } | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const monthKey = format(month, "yyyy-MM");
  // the previous month stays on screen (dimmed) while the next one loads
  const loading = data?.month !== monthKey;

  useEffect(() => {
    const controller = new AbortController();
    fetchJson<{ orders?: DatedOrder[] }>(
      `/api/orders/manage-orders?userId=${encodeURIComponent(userId)}&month=${monthKey}`,
      controller.signal,
    )
      .then((json) => setData({ month: monthKey, orders: json.orders ?? [] }))
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [userId, monthKey, reloadKey]);

  const changeMonth = (next: Date) => {
    setMonth(next);
    setError(false);
  };

  const retry = () => {
    setError(false);
    setReloadKey((key) => key + 1);
  };

  return (
    <section className="min-w-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Lịch sử đặt cơm</h2>
        <MonthStepper
          month={month}
          onChange={changeMonth}
          loading={loading && !error}
        />
      </div>

      {error ? (
        <EmptyState
          icon={CircleAlert}
          title="Không tải được lịch sử"
          description="Có lỗi khi tải dữ liệu, vui lòng thử lại."
          action={
            <Button variant="outline" className="border-input" onClick={retry}>
              Thử lại
            </Button>
          }
        />
      ) : !data ? (
        <PageSkeleton />
      ) : (
        <div
          aria-busy={loading}
          className={cn("space-y-6 transition-opacity", loading && "opacity-60")}
        >
          {data.orders.length === 0 ? (
            <EmptyState
              icon={CalendarX2}
              title={`Bạn chưa đặt đơn nào trong tháng ${data.month.split("-").reverse().join("/")}`}
              description="Chọn tháng khác để xem lại các đơn trước đây."
            />
          ) : (
            <>
              <OrderSummary orders={data.orders} />
              <DatedOrderList orders={data.orders} />
            </>
          )}
        </div>
      )}
    </section>
  );
}
