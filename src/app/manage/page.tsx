"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

type SummaryItem = {
  userId: string;
  userName: string;
  userShortName: string;
  count: number;
  money: number;
};

export default function AdminManagePage() {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    format(new Date(), "yyyy-MM"),
  );
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async (month: string) => {
    setLoading(true);
    const res = await fetch(`/api/orders/manage-orders?month=${month}`);
    const data = await res.json();
    setSummary(data.summary || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSummary(selectedMonth);
  }, [selectedMonth]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        📊 Thống kê đơn hàng theo tháng
      </h1>

      <div className="mb-6">
        <label className="font-medium">📅 Chọn tháng:</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="ml-2 border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 rounded"
        />
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : summary.length === 0 ? (
        <p>Không có dữ liệu trong tháng này.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 dark:border-neutral-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-neutral-800">
              <th className="border border-gray-300 dark:border-neutral-700 p-2">Tên người dùng</th>
              <th className="border border-gray-300 dark:border-neutral-700 p-2">Số lần đặt</th>
              <th className="border border-gray-300 dark:border-neutral-700 p-2">Số tiền (VND)</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row) => (
              <tr key={row.userId}>
                <td className="border border-gray-300 dark:border-neutral-700 p-2">
                  {row.userName} ({row.userShortName})
                </td>
                <td className="border border-gray-300 dark:border-neutral-700 p-2 text-center">{row.count}</td>
                <td className="border border-gray-300 dark:border-neutral-700 p-2 text-right">
                  {row.money.toLocaleString("vi-VN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
