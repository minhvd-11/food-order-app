import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { StickyNote } from "lucide-react";
import { Card } from "@/components/ui";
import { StatTile } from "@/components/PageLayout";
import { cn, formatVnd } from "@/lib/utils";

export type HistoryOrder = {
  id: string;
  userName: string;
  userShortName: string;
  foodNames: string[];
  note?: string | null;
  price?: number;
};

export type DatedOrder = HistoryOrder & { date: string };

export const formatPrice = (price?: number) => (price ? `${price / 1000}k` : "");

export const sumPrices = (orders: HistoryOrder[]) =>
  orders.reduce((sum, order) => sum + (order.price ?? 0), 0);

// The most picked dish and how many times it was picked
export const topDish = (orders: HistoryOrder[]) => {
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

export function OrderSummary({ orders }: { orders: HistoryOrder[] }) {
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

export function OrderDetails({ order }: { order: HistoryOrder }) {
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

// One person's orders, newest first, each row led by its date
export function DatedOrderList({ orders }: { orders: DatedOrder[] }) {
  const sorted = [...orders].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Card className="gap-0 overflow-hidden border-red-100 py-0 dark:border-neutral-800">
      <ul className="divide-y divide-border">
        {sorted.map((order) => {
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
  );
}
