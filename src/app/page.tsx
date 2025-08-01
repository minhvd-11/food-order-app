"use client";

import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui";
import { useEffect, useState } from "react";
import { Food } from "@/types";
import { TodayOrderModal, Navbar, SketchyButton } from "@/components";

export default function Home() {
  const { guestName, setGuestName, selectedItems, toggleItem, submitOrder } =
    useCartStore();

  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await fetch("/api/foods/today");
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Lỗi khi tải danh sách món ăn");
        setFoods(data);
      } catch (err) {
        console.error(err);
        setFoods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, []);

  return (
    <main className="p-6 space-y-6">
      <Navbar />
      <div className="p-4 max-w-3xl mx-auto">
        {/* Guest Name Input */}
        <div className="flex justify-between mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              👤 Tên của bạn:
            </label>

            <input
              type="text"
              className="w-half p-2 border rounded-md"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Nhập tên để lưu đơn"
            />
          </div>
          <div>
            <SketchyButton onClick={() => setShowModal(true)}>
              Xem đơn
            </SketchyButton>
          </div>

          {showModal && <TodayOrderModal onClose={() => setShowModal(false)} />}
        </div>

        <h1 className="text-2xl font-bold mb-4">🍽 Danh sách món ăn</h1>

        {/* Food Cards */}
        {loading ? (
          <p>⏳ Đang tải danh sách món ăn...</p>
        ) : !foods?.length ? (
          <p>❌ Không có món ăn nào cho hôm nay.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {foods?.map((food) => {
              const isSelected = selectedItems.some(
                (item) => item.id === food.id
              );

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
        )}

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
            <SketchyButton onClick={submitOrder}>Lưu đơn</SketchyButton>
          </div>
        )}
      </div>
    </main>
  );
}
