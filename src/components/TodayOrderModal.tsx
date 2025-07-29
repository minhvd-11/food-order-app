"use client";

import { useEffect, useState } from "react";

type TodayOrder = {
  id: string;
  userName: string;
  foodNames: string[];
};

export function TodayOrderModal({ onClose }: { onClose: () => void }) {
  const [orders, setOrders] = useState<TodayOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/orders?groupBy=day&value=" + new Date().toISOString())
      .then((res) => res.json())
      .then((data) => {
        const todayGroup = data?.data?.[0];
        setOrders(todayGroup?.orders ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 relative">
        <h2 className="text-xl font-bold mb-4">🗓️ Đơn đặt hôm nay</h2>

        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 hover:text-red-500"
        >
          ✖
        </button>

        {loading ? (
          <p>Đang tải...</p>
        ) : orders.length === 0 ? (
          <p>Chưa có đơn đặt nào hôm nay.</p>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li
                key={o.id}
                className="border rounded p-3 bg-gray-50 shadow-sm text-sm"
              >
                <strong>{o.userName}</strong>: {o.foodNames.join(", ")}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
