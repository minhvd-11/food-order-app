"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { FoodOrder, User } from "@/types";

export default function UserOrderStats({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [user, setUser] = useState<User>();
  const [showCount, setShowCount] = useState(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const res = await fetch("/api/users");
      const users: User[] = await res.json();
      const current = users.find((u) => u.id === userId);
      if (current) {
        setUser(current);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const now = new Date();
      const month = format(now, "yyyy-MM");

      const res = await fetch(
        `/api/orders/manage-orders?userId=${userId}&month=${month}`,
      );
      const data = await res.json();
      setOrders(data.orders || []);
      setLoading(false);
    };

    fetchOrders();
  }, [userId]);

  const orderedDays = orders.length;
  const totalPrice = useMemo(() => {
    return orders.reduce((sum, order) => sum + (order.price ?? 0), 0);
  }, [orders]);

  return (
    <div className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 shadow rounded-lg p-6 w-full max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">Thống kê</h3>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tên</p>
          <p className="font-medium break-all">{user?.shortName}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Số lần đặt</p>
          <p className="font-medium">{orderedDays} lần</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tổng tiền</p>
          <p className="font-medium text-green-600 dark:text-green-400">
            {totalPrice.toLocaleString()} đ
          </p>
        </div>
      </div>

      <h4 className="text-md font-semibold mb-2">Lịch sử đặt món</h4>

      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="w-5 h-5 border-2 border-gray-300 dark:border-neutral-700 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">Không có dữ liệu</p>
      ) : (
        <>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400">
                <th className="py-2">Ngày</th>
                <th className="py-2">Món đã chọn</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, showCount).map((order, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 dark:border-neutral-700 last:border-b-0"
                >
                  <td className="py-2">
                    {format(new Date(order.date), "yyyy-MM-dd")}
                  </td>
                  <td className="py-2">{order.foodNames.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {showCount < orders.length && (
            <button
              onClick={() => setShowCount((c) => c + 5)}
              className="mt-4 text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Hiển thị thêm
            </button>
          )}
        </>
      )}
    </div>
  );
}
