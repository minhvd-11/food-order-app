"use client";

import { foodList } from "@/data/foods";
import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default function Home() {
  const { guestName, setGuestName, selectedItems, toggleItem, submitOrder } =
    useCartStore();

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🍽 Danh sách món ăn</h1>

      {/* Guest Name Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          👤 Tên của bạn:
        </label>
        <input
          type="text"
          className="w-full p-2 border rounded-md"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Nhập tên để lưu đơn"
        />
      </div>

      {/* Food Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {foodList.map((food) => {
          const isSelected = selectedItems.some((item) => item.id === food.id);

          return (
            <Card
              key={food.id}
              onClick={() => toggleItem(food)}
              className={cn(
                "cursor-pointer border p-4 rounded-xl shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.98]",
                isSelected
                  ? "border-green-500 bg-green-100 text-green-900"
                  : "border-gray-200 hover:border-gray-400"
              )}
            >
              <p className="text-base font-medium">{food.name}</p>
            </Card>
          );
        })}
      </div>

      {/* Selected Summary & Submit */}
      {selectedItems.length > 0 && (
        <div className="mt-8 p-4 border-t">
          <h2 className="text-lg font-semibold mb-2">🛒 Món đã chọn:</h2>
          <ul className="list-disc list-inside space-y-1 mb-4">
            {selectedItems.map((item) => (
              <li key={item.id} className="text-gray-800">
                {item.name}
              </li>
            ))}
          </ul>
          <button
            onClick={submitOrder}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            ✅ Lưu đơn
          </button>
        </div>
      )}
    </main>
  );
}
