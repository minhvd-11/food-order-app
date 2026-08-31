"use client";

import { useEffect, useState } from "react";

type AdminOrder = {
  id: string;
  userName: string;
  date: string;
  foodNames: string[];
  note?: string;
  price?: number;
};

export default function AdminPage() {
  const [groupBy, setGroupBy] = useState<"day" | "user">("day");
  const [filterValue, setFilterValue] = useState<string>(""); // selected date or user
  const [filterOptions, setFilterOptions] = useState<string[]>([]); // available dates or users

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch filter options when groupBy changes
  useEffect(() => {
    const fetchFilters = async () => {
      const res = await fetch(`/api/orders/filters?groupBy=${groupBy}`);
      const data = await res.json();
      setFilterOptions(data.options);
      setFilterValue(data.options[0] ?? "");
    };
    fetchFilters();
  }, [groupBy]);

  // Fetch orders based on current groupBy and selected filter
  useEffect(() => {
    if (!filterValue) return;

    setLoading(true);
    fetch(
      `/api/orders/orders?groupBy=${groupBy}&value=${encodeURIComponent(
        filterValue,
      )}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (groupBy === "day") {
          const group = data?.data?.[0];
          setOrders(group?.orders ?? []);
        } else {
          setOrders(data?.data ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [groupBy, filterValue]);

  return (
    <main className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">📋 Lịch sử đặt đồ ăn</h1>
        <select
          value={groupBy}
          onChange={(e) => {
            setGroupBy(e.target.value as "day" | "user");
            setOrders([]);
          }}
          className="border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded p-1"
        >
          <option value="day">Theo ngày</option>
          <option value="user">Theo người dùng</option>
        </select>
      </div>

      {/* Filter select */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          {groupBy === "day" ? "Chọn ngày:" : "Chọn người dùng:"}
        </label>
        <select
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          className="border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded p-2 w-full"
        >
          {filterOptions.map((opt) => (
            <option key={opt} value={opt}>
              {groupBy === "day"
                ? new Date(opt).toLocaleDateString("vi-VN")
                : opt}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : orders.length === 0 ? (
        <p>Không có đơn nào.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 dark:border-neutral-700 rounded-xl p-4 shadow-sm bg-white dark:bg-neutral-900"
            >
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {groupBy === "user" &&
                  new Date(order.date).toLocaleDateString("vi-VN")}
                {groupBy === "day" && (
                  <span className="font-medium">{order.userName}</span>
                )}
              </div>
              <div className="mt-2">
                🍽️ {!!order.price && `${order.price / 1000}k - `}{" "}
                {order.foodNames.join(", ")} {!!order.note && `(${order.note})`}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
