"use client";

import { useEffect, useState } from "react";
import { format, isToday } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Inbox,
  Search,
  StickyNote,
  UserRound,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  EmptyState,
  PageBackground,
  PageHeader,
  PageSkeleton,
  StatTile,
} from "@/components/PageLayout";
import { cn, fetchJson, formatVnd } from "@/lib/utils";

type GroupBy = "day" | "user";

type HistoryOrder = {
  id: string;
  userName: string;
  userShortName: string;
  foodNames: string[];
  note?: string | null;
  price?: number;
};

type DatedOrder = HistoryOrder & { date: string };

type Loaded =
  | { groupBy: "day"; value: string; orders: HistoryOrder[] }
  | { groupBy: "user"; value: string; orders: DatedOrder[] };

const modes = [
  { value: "day", label: "Theo ngày", icon: CalendarDays },
  { value: "user", label: "Theo người", icon: UserRound },
] as const;

const formatDay = (iso: string) => {
  const date = new Date(iso);
  const label = format(date, "EEEE, dd/MM/yyyy", { locale: vi });
  return isToday(date) ? `${label} (hôm nay)` : label;
};

const formatPrice = (price?: number) => (price ? `${price / 1000}k` : "");

const sumPrices = (orders: HistoryOrder[]) =>
  orders.reduce((sum, order) => sum + (order.price ?? 0), 0);

// The most picked dish and how many times it was picked
const topDish = (orders: HistoryOrder[]) => {
  const counts = new Map<string, number>();
  for (const order of orders) {
    for (const name of order.foodNames) {
      // menus are parsed daily, so the same dish can come back as "Bắp cải luộc" or "bắp cải luộc"
      const key = name.trim().toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0];
};

// Newest month first
const groupByMonth = (orders: DatedOrder[]) => {
  const groups = new Map<string, DatedOrder[]>();
  const sorted = [...orders].sort((a, b) => b.date.localeCompare(a.date));
  for (const order of sorted) {
    const key = format(new Date(order.date), "MM/yyyy");
    groups.set(key, [...(groups.get(key) ?? []), order]);
  }
  return [...groups];
};

export default function OrdersPage() {
  const [groupBy, setGroupBy] = useState<GroupBy>("day");
  const [options, setOptions] = useState<string[] | null>(null); // dates or shortNames
  const [value, setValue] = useState(""); // selected date or shortName
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Load the dates (or users) to pick from
  useEffect(() => {
    const controller = new AbortController();
    fetchJson<{ options?: string[] }>(
      `/api/orders/filters?groupBy=${groupBy}`,
      controller.signal,
    )
      .then(({ options = [] }) => {
        setOptions(options);
        setValue((current) =>
          options.includes(current) ? current : (options[0] ?? ""),
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [groupBy, reloadKey]);

  // Load the orders of the selected date or user
  useEffect(() => {
    if (!value) return;
    const controller = new AbortController();
    const url = `/api/orders/orders?groupBy=${groupBy}&value=${encodeURIComponent(value)}`;
    const request =
      groupBy === "day"
        ? fetchJson<{ data?: { orders: HistoryOrder[] }[] }>(
            url,
            controller.signal,
          ).then(
            (json): Loaded => ({
              groupBy: "day",
              value,
              orders: json.data?.[0]?.orders ?? [],
            }),
          )
        : fetchJson<{ data?: DatedOrder[] }>(url, controller.signal).then(
            (json): Loaded => ({
              groupBy: "user",
              value,
              orders: json.data ?? [],
            }),
          );
    request.then(setData).catch(() => {
      if (!controller.signal.aborted) setError(true);
    });
    return () => controller.abort();
  }, [groupBy, value, reloadKey]);

  const changeGroupBy = (next: GroupBy) => {
    if (next === groupBy) return;
    setGroupBy(next);
    setOptions(null);
    setValue("");
    setError(false);
  };

  const retry = () => {
    setError(false);
    setReloadKey((key) => key + 1);
  };

  const shown = data?.groupBy === groupBy ? data : null;
  // the previous list stays on screen (dimmed) while the next one loads
  const refreshing = !!shown && shown.value !== value;
  const index = options?.indexOf(value) ?? -1;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <PageBackground />

      <PageHeader
        icon={Search}
        title="Tra cứu đơn"
        description="Xem lại các đơn đã đặt theo ngày hoặc theo từng người"
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex self-start rounded-lg border border-input bg-card p-1 shadow-xs">
          {modes.map(({ value: mode, label, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              aria-pressed={groupBy === mode}
              onClick={() => changeGroupBy(mode)}
              className={cn(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                groupBy === mode
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {groupBy === "day" && (
            <Button
              variant="outline"
              size="icon"
              className="border-input"
              aria-label="Ngày trước"
              disabled={!options || index >= options.length - 1}
              onClick={() => options && setValue(options[index + 1])}
            >
              <ChevronLeft />
            </Button>
          )}
          <div className="relative flex-1 sm:w-72 sm:flex-none">
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={!options?.length}
              aria-label={groupBy === "day" ? "Chọn ngày" : "Chọn người"}
              className="h-9 w-full cursor-pointer appearance-none rounded-md border border-input bg-card pr-9 pl-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {!options?.length && (
                <option value="">{options ? "Chưa có dữ liệu" : "Đang tải..."}</option>
              )}
              {options?.map((option) => (
                <option key={option} value={option}>
                  {groupBy === "day" ? formatDay(option) : option}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          {groupBy === "day" && (
            <Button
              variant="outline"
              size="icon"
              className="border-input"
              aria-label="Ngày sau"
              disabled={index <= 0}
              onClick={() => options && setValue(options[index - 1])}
            >
              <ChevronRight />
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <EmptyState
          icon={CircleAlert}
          title="Không tải được dữ liệu"
          description="Có lỗi khi tải đơn, vui lòng thử lại."
          action={
            <Button variant="outline" className="border-input" onClick={retry}>
              Thử lại
            </Button>
          }
        />
      ) : options?.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Chưa có đơn nào"
          description="Các đơn đặt cơm sẽ hiện ở đây."
        />
      ) : !shown ? (
        <PageSkeleton />
      ) : (
        <div
          aria-busy={refreshing}
          className={cn("space-y-6 transition-opacity", refreshing && "opacity-60")}
        >
          {shown.orders.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={
                shown.groupBy === "day"
                  ? "Không có đơn nào trong ngày này"
                  : "Người này chưa đặt đơn nào"
              }
            />
          ) : (
            <>
              {shown.groupBy === "user" && (
                <p className="text-sm text-muted-foreground">
                  Lịch sử đặt cơm của{" "}
                  <span className="font-medium text-foreground">
                    {shown.orders[0].userName}
                  </span>
                </p>
              )}
              <OrderSummary orders={shown.orders} />
              {shown.groupBy === "day" ? (
                <DayOrders orders={shown.orders} />
              ) : (
                <UserOrders orders={shown.orders} />
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}

function OrderSummary({ orders }: { orders: HistoryOrder[] }) {
  const dish = topDish(orders);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <StatTile label="Số đơn" value={orders.length} />
      <StatTile label="Tổng tiền" value={formatVnd(sumPrices(orders))} />
      <StatTile
        className="col-span-2 sm:col-span-1"
        label="Món phổ biến"
        value={dish ? dish[0].charAt(0).toUpperCase() + dish[0].slice(1) : "—"}
        hint={dish && `${dish[1]} lượt chọn`}
      />
    </div>
  );
}

function DayOrders({ orders }: { orders: HistoryOrder[] }) {
  return (
    <Card className="gap-0 overflow-hidden border-red-100 py-0 dark:border-neutral-800">
      <ol className="divide-y divide-border">
        {orders.map((order, index) => (
          <li key={order.id} className="flex gap-3 px-4 py-3 sm:px-5">
            <span className="w-6 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {order.userName}
                {order.userShortName !== order.userName && (
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    {order.userShortName}
                  </span>
                )}
              </p>
              <OrderDetails order={order} />
            </div>
            <span className="shrink-0 text-sm font-medium tabular-nums">
              {formatPrice(order.price)}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function UserOrders({ orders }: { orders: DatedOrder[] }) {
  return (
    <div className="space-y-6">
      {groupByMonth(orders).map(([month, monthOrders]) => (
        <section key={month}>
          <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
            <h2 className="text-sm font-semibold">Tháng {month}</h2>
            <p className="text-xs text-muted-foreground">
              {monthOrders.length} đơn · {formatVnd(sumPrices(monthOrders))}
            </p>
          </div>
          <Card className="gap-0 overflow-hidden border-red-100 py-0 dark:border-neutral-800">
            <ul className="divide-y divide-border">
              {monthOrders.map((order) => {
                const date = new Date(order.date);
                return (
                  <li key={order.id} className="flex gap-3 px-4 py-3 sm:px-5">
                    <div className="w-12 shrink-0">
                      <p className="text-sm font-medium tabular-nums">
                        {format(date, "dd/MM")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(date, "EEE", { locale: vi })}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <OrderDetails order={order} />
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {formatPrice(order.price)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  );
}

function OrderDetails({ order }: { order: HistoryOrder }) {
  return (
    <>
      <p
        className={cn(
          "text-sm",
          order.foodNames.length
            ? "text-foreground/80"
            : "text-muted-foreground italic",
        )}
      >
        {/* only plain-rice orders have no dishes */}
        {order.foodNames.length ? order.foodNames.join(", ") : "Thuần cơm"}
      </p>
      {order.note?.trim() && (
        <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
          <StickyNote className="mt-px size-3.5 shrink-0" />
          {order.note}
        </p>
      )}
    </>
  );
}
