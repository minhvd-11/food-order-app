"use client";

import { useEffect, useState } from "react";

type AdminOrder = {
  id: string;
  userName: string;
  date: string;
  foodNames: string[];
};

export default function AdminPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">📋 Lịch sử đặt đồ ăn</h1>

      {loading ? (
        <p>Đang tải...</p>
      ) : orders.length === 0 ? (
        <p>Không có đơn nào.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border rounded-xl p-4 shadow-sm bg-white"
            >
              <div className="text-sm text-gray-500">
                {new Date(order.date).toLocaleDateString("vi-VN")} —{" "}
                <span className="font-medium">{order.userName}</span>
              </div>
              <div className="mt-2">🍽️ {order.foodNames.join(", ")}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
