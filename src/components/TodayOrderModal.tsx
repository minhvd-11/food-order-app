"use client";

import { FoodOrder } from "@/types";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function TodayOrderModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchTodayOrders();
  }, []);

  const fetchTodayOrders = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = now.toISOString();
      const res = await fetch(`/api/orders/orders?groupBy=day&value=${today}`);
      const data = await res.json();
      const todayGroup = data?.data?.[0];
      setOrders(todayGroup?.orders ?? []);
    } finally {
      setLoading(false);
    }
  };

  const removeOrder = async (orderId: string) => {
    const confirm = window.confirm("❗ Bạn có chắc muốn xóa đơn này?");
    if (!confirm) return;

    await fetch(`/api/orders/manage-orders`, {
      method: "DELETE",
      body: JSON.stringify({ orderId }),
      headers: { "Content-Type": "application/json" },
    });

    fetchTodayOrders();
  };

  const handleCopy = async () => {
    const text = orders
      .map((o) => {
        const items = o.foodNames?.join(", ") || "";
        const note = o.note?.trim() ? ` (${o.note})` : "";
        return `${o.userName}: ${items}${note}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);

      toast.success("📋 Đã sao chép danh sách đơn đặt hôm nay!");
    } catch (err) {
      toast.error("❌ Lỗi khi sao chép vào clipboard.");
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative">
        <h2 className="text-xl font-bold mb-4">🗓️ Đơn đặt hôm nay</h2>

        <button
          type="button"
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
          <>
            <ul className="space-y-3 mb-4 max-h-100 overflow-y-auto pr-2">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="border rounded p-3 bg-gray-50 shadow-sm text-sm flex justify-between items-start gap-3"
                >
                  <div>
                    <strong>
                      {o.userName} ({o.userShortName})
                      {!!o.price && (
                        <span>
                          {` - `}
                          <span className="text-lime-500">
                            {o.price / 1000}k
                          </span>
                        </span>
                      )}
                    </strong>
                    : {o.foodNames?.join(", ") || ""}
                    {o.note?.trim() && (
                      <span className="text-gray-700"> ({o.note})</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeOrder(o.id)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    🗑️ Xóa
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              📋 Sao chép danh sách
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
