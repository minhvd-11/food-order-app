"use client";

import { useEffect, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { BarChart2, CalendarX2, CircleAlert, Search } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { MonthStepper } from "@/components/MonthStepper";
import {
  EmptyState,
  PageBackground,
  PageHeader,
  PageSkeleton,
  StatTile,
} from "@/components/PageLayout";
import { cn, fetchJson, formatVnd } from "@/lib/utils";

type SummaryItem = {
  userId: string;
  userName: string;
  userShortName: string;
  count: number;
  money: number;
};

// Accent-insensitive search, so "dai" finds "Đại"
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();

export default function AdminManagePage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [data, setData] = useState<{
    month: string;
    summary: SummaryItem[];
  } | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");

  const monthKey = format(month, "yyyy-MM");
  // the previous month stays on screen (dimmed) while the next one loads
  const loading = data?.month !== monthKey;

  useEffect(() => {
    const controller = new AbortController();
    fetchJson<{ summary?: SummaryItem[] }>(
      `/api/orders/manage-orders?month=${monthKey}`,
      controller.signal,
    )
      .then((json) => setData({ month: monthKey, summary: json.summary ?? [] }))
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [monthKey, reloadKey]);

  const changeMonth = (next: Date) => {
    setMonth(next);
    setError(false);
  };

  const retry = () => {
    setError(false);
    setReloadKey((key) => key + 1);
  };

  const summary = data?.summary ?? [];
  const totalMeals = summary.reduce((sum, row) => sum + row.count, 0);
  const totalMoney = summary.reduce((sum, row) => sum + row.money, 0);
  const maxCount = Math.max(1, ...summary.map((row) => row.count));
  const search = normalize(query.trim());
  const rows = summary
    .map((row, index) => ({ ...row, rank: index + 1 }))
    .filter(
      (row) =>
        !search ||
        normalize(`${row.userName} ${row.userShortName}`).includes(search),
    );
  const dataMonthLabel = data?.month.split("-").reverse().join("/");

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <PageBackground />

      <PageHeader
        icon={BarChart2}
        title="Thống kê đơn"
        description="Số suất và tiền cơm của từng người theo tháng"
      >
        <MonthStepper
          month={month}
          onChange={changeMonth}
          loading={loading && !error}
        />
      </PageHeader>

      {error ? (
        <EmptyState
          icon={CircleAlert}
          title="Không tải được thống kê"
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
          {summary.length === 0 ? (
            <EmptyState
              icon={CalendarX2}
              title={`Chưa có đơn nào trong tháng ${dataMonthLabel}`}
              description="Chọn tháng khác để xem thống kê."
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                <StatTile label="Tổng suất" value={totalMeals} />
                <StatTile label="Tổng tiền" value={formatVnd(totalMoney)} />
                <StatTile
                  className="col-span-2 sm:col-span-1"
                  label="Số người đặt"
                  value={summary.length}
                  hint={`Trung bình ${(totalMeals / summary.length).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} suất/người`}
                />
              </div>

              <Card className="gap-0 overflow-hidden border-red-100 py-0 dark:border-neutral-800">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <h2 className="font-semibold">Chi tiết theo người</h2>
                  <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Tìm theo tên..."
                      aria-label="Tìm theo tên"
                      className="pl-9"
                    />
                  </div>
                </div>

                <table className="w-full text-sm">
                  <caption className="sr-only">
                    Thống kê tháng {dataMonthLabel}
                  </caption>
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th
                        scope="col"
                        className="hidden w-12 py-2.5 pl-4 text-left font-medium sm:table-cell"
                      >
                        #
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-2.5 text-left font-medium sm:px-2"
                      >
                        Thành viên
                      </th>
                      <th
                        scope="col"
                        className="px-2 py-2.5 text-right font-medium sm:w-2/5 sm:text-left"
                      >
                        Số suất
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-2.5 text-right font-medium"
                      >
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row) => (
                      <tr
                        key={row.userId}
                        className="transition-colors hover:bg-muted/40"
                      >
                        <td className="hidden py-3 pl-4 text-muted-foreground tabular-nums sm:table-cell">
                          {row.rank}
                        </td>
                        <td className="px-4 py-3 sm:px-2">
                          <span className="font-medium">{row.userName}</span>
                          {row.userShortName !== row.userName && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              {row.userShortName}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center justify-end gap-2 sm:justify-start">
                            <div
                              className="hidden h-2 shrink-0 rounded-r-[4px] bg-primary sm:block"
                              style={{
                                width: `calc((100% - 2.5rem) * ${row.count / maxCount})`,
                              }}
                            />
                            <span className="font-medium tabular-nums">
                              {row.count}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {formatVnd(row.money)}
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-10 text-center text-muted-foreground"
                        >
                          Không tìm thấy ai khớp với “{query.trim()}”
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
            </>
          )}
        </div>
      )}
    </main>
  );
}
