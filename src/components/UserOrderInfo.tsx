"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

export default function UserOrderStats({ userId }: { userId: string }) {
  const supabase = createClient();
  const [orders, setOrders] = useState<Array<{ date: string; food: string }>>(
    []
  );
  const [showCount, setShowCount] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("orders")
        .select("date, food")
        .eq("user_id", userId)
        .gte("date", firstDayOfMonth.toISOString())
        .order("date", { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
      setLoading(false);
    }

    fetchOrders();
  }, [userId]);

  const orderedDays = orders.length;
  const totalMoney = orderedDays * 30000;

  return (
    <div className="bg-white shadow rounded-lg p-6 w-full max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500">User ID</p>
          <p className="font-medium break-all">{userId}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Order Days</p>
          <p className="font-medium">{orderedDays} ngày</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Tổng tiền</p>
          <p className="font-medium text-green-600">
            {totalMoney.toLocaleString()} đ
          </p>
        </div>
      </div>

      <h4 className="text-md font-semibold mb-2">Lịch sử đặt món</h4>

      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-sm text-gray-500 italic">Không có dữ liệu</p>
      ) : (
        <>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="py-2">Ngày</th>
                <th className="py-2">Món đã chọn</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, showCount).map((order, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className="py-2">
                    {format(new Date(order.date), "yyyy-MM-dd")}
                  </td>
                  <td className="py-2">{order.food}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {showCount < orders.length && (
            <button
              onClick={() => setShowCount((c) => c + 5)}
              className="mt-4 text-blue-600 hover:underline text-sm"
            >
              Hiển thị thêm
            </button>
          )}
        </>
      )}
    </div>
  );
}
