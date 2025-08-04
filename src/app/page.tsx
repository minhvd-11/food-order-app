"use client";

import { useEffect, useState } from "react";
import { SketchyButton } from "@/components";
import { useCartStore } from "@/store/useCartStore";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { TodayOrderModal } from "@/components";
import { Food, User } from "@/types";

export default function Home() {
  const {
    guestName,
    setGuestName,
    shortName,
    setShortName,
    selectedItems,
    toggleItem,
    submitOrder,
    loading: submitLoading,
  } = useCartStore();

  const [foods, setFoods] = useState<Food[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [foodsRes, usersRes] = await Promise.all([
          fetch("/api/foods/today"),
          fetch("/api/users"),
        ]);
        const foodsData = await foodsRes.json();
        const usersData = await usersRes.json();
        setFoods(foodsData);
        setUsers(usersData);
      } catch (err) {
        console.error(err);
        setFoods([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="p-6 space-y-6">
      <div className="p-4 max-w-3xl mx-auto">
        {/* Name & Shortname Inputs */}
        <div className="flex justify-between gap-4 items-end mb-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">
              🧑 Tên của bạn (chọn từ danh sách):
            </label>
            <select
              value={guestName}
              onChange={(e) => {
                const selectedName = e.target.value;
                setGuestName(selectedName);

                const selectedUser = users.find((u) => u.name === selectedName);
                if (selectedUser) {
                  setShortName(selectedUser.shortName);
                } else {
                  setShortName(""); // reset if switching to new entry
                }
              }}
              className="w-full p-2 border rounded-md"
            >
              <option value="">--Chọn tên bạn--</option>
              {users.map((user) => (
                <option key={user.id} value={user.name}>
                  {user.name} ({user.shortName})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">
              ✏️ Hoặc nhập tên mới:
            </label>
            <input
              type="text"
              placeholder="Tên"
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value);
                setShortName(e.target.value);
              }}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <SketchyButton onClick={() => setShowModal(true)}>
            Xem đơn
          </SketchyButton>
          {showModal && <TodayOrderModal onClose={() => setShowModal(false)} />}
        </div>

        <h1 className="text-2xl font-bold mb-4">🍽 Danh sách món ăn</h1>

        {/* Food Cards */}
        {loading ? (
          <p>⏳ Đang tải danh sách món ăn...</p>
        ) : !foods.length ? (
          <p>❌ Không có món ăn nào cho hôm nay.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {foods.map((food) => {
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

        {!!foods.length && (
          <div className="mt-6">
            <label className="block text-sm font-medium mb-1">
              📝 Ghi chú thêm:
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Thêm ớt, thêm cà, ..."
              className="w-full p-2 border rounded-md"
              rows={3}
            />
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
            <SketchyButton onClick={submitOrder}>
              {submitLoading ? "Đang lưu..." : "Lưu đơn"}
            </SketchyButton>
          </div>
        )}
      </div>
    </main>
  );
}
