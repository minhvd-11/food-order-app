"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui";
import { EditOrderModal } from "@/components";

type Order = {
  id: string;
  userName: string;
  foodNames: string[];
};

export default function AdminManagePage() {
  const [selectedDate, setSelectedDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd")
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableFoods, setAvailableFoods] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const fetchOrders = async (date: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/manage-orders?date=${date}`);
    const data = await res.json();
    setOrders(data.orders);
    setLoading(false);
  };

  const fetchAvailableFoods = async (date: string) => {
    const res = await fetch(`/api/admin/available-foods?date=${date}`);
    const data = await res.json();
    setAvailableFoods(data.foods); // array of strings
  };

  useEffect(() => {
    fetchOrders(selectedDate);
    fetchAvailableFoods(selectedDate);
  }, [selectedDate]);

  const removeOrder = async (orderId: string) => {
    await fetch(`/api/admin/manage-orders`, {
      method: "DELETE",
      body: JSON.stringify({ orderId }),
      headers: { "Content-Type": "application/json" },
    });
    fetchOrders(selectedDate);
  };

  const updateOrder = async (orderId: string, newFoodNames: string[]) => {
    await fetch(`/api/admin/manage-orders`, {
      method: "PUT",
      body: JSON.stringify({
        orderId,
        foodNames: newFoodNames,
        date: selectedDate,
      }),
      headers: { "Content-Type": "application/json" },
    });
    fetchOrders(selectedDate);
  };

  const openEditModal = (order: Order) => {
    setEditingOrder(order);
    setEditModalOpen(true);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🛠 Quản lý dữ liệu</h1>

      <div className="mb-6">
        <label className="font-medium">📅 Chọn ngày:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="ml-2 border p-2 rounded"
        />
      </div>

      {loading ? (
        <p>Đang tải đơn hàng...</p>
      ) : orders.length === 0 ? (
        <p>Không có đơn hàng cho ngày này.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-4 border rounded shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{order.userName}</p>
                <p className="text-gray-600">{order.foodNames.join(", ")}</p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => openEditModal(order)}>
                  ✏️ Sửa
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => removeOrder(order.id)}
                >
                  🗑 Xóa
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingOrder && (
        <EditOrderModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          userName={editingOrder.userName}
          foodNames={editingOrder.foodNames}
          availableFoods={availableFoods}
          onSave={(newFoodNames) => updateOrder(editingOrder.id, newFoodNames)}
        />
      )}
    </div>
  );
}
