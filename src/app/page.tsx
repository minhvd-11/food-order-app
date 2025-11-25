"use client";

import { useEffect, useState } from "react";
import { SketchyButton, TodayOrderModal } from "@/components";
import { useCartStore } from "@/store/useCartStore";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Food, OrderPrice, OrderPriceTierType, User } from "@/types";
import { useUser } from "@/contexts/UserContext";

export default function Home() {
  const {
    guestName,
    setGuestName,
    setShortName,
    selectedItems,
    toggleItem,
    submitOrder,
    loading: submitLoading,
    note,
    setNote,
    orderPrice,
    setOrderPrice,
  } = useCartStore();

  const { userMetadata } = useUser();

  const [foods, setFoods] = useState<Food[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const priceOptions: OrderPrice[] = [
    {
      priceTier: OrderPriceTierType.NO_TOPPING_PRICE,
      label: "Thuần Cơm",
      value: 10000,
    },
    {
      priceTier: OrderPriceTierType.BASIC_PRICE,
      label: "Cơ bản",
      value: 30000,
    },
    {
      priceTier: OrderPriceTierType.EXTRA_PLUS_PRICE,
      label: "Hơi no",
      value: 35000,
    },
    {
      priceTier: OrderPriceTierType.PROMAX_PRICE,
      label: "Ngập mồm",
      value: 40000,
    },
  ];

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

  useEffect(() => {
    if (userMetadata?.email && users.length > 0 && !guestName) {
      const matchedUser = users.find((u) => u.email === userMetadata.email);
      if (matchedUser) {
        setGuestName(matchedUser.name);
        setShortName(matchedUser.shortName || "");
      }
    }
  }, [userMetadata?.email, users, guestName, setGuestName, setShortName]);

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
              placeholder="VD: minh.vd"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-4">
          {priceOptions.map((option) => {
            const isSelected = option.value === orderPrice;

            return (
              <button
                key={option.priceTier}
                onClick={() => setOrderPrice(option.value)}
                className={`
                  relative p-2 rounded-xl border-2 transition-all duration-300
                  text-center group
                  ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-400/10 shadow-lg shadow-emerald-400/20"
                      : "border-slate-200 bg-white hover:border-green-300 hover:shadow-md"
                  }
               `}
              >
                <div className="flex flex-col gap-1 items-center">
                  <div className="flex justify-between">
                    <h3
                      className={`transition-colors ${
                        isSelected ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {option.label}
                    </h3>
                  </div>

                  <p className="text-slate-600 text-sm">
                    {option.value.toLocaleString()} đ
                  </p>
                </div>
              </button>
            );
          })}
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
                  onClick={() => {
                    if (orderPrice !== 10000) {
                      toggleItem(food);
                    }
                  }}
                  className={cn(
                    "border p-4 rounded-xl shadow-sm transition-all duration-150",
                    orderPrice !== 10000
                      ? "cursor-pointer hover:shadow-md active:scale-[0.98] hover:border-gray-400"
                      : "cursor-not-allowed opacity-60",
                    isSelected && orderPrice !== 10000
                      ? "border-green-500 bg-green-100 text-green-900"
                      : "border-gray-200"
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
            <label className="block text-sm font-medium mb-2">
              📝 Ghi chú thêm:
            </label>
            <Button
              onClick={() => setNote(!note ? "thêm lạc" : note + ", thêm lạc")}
              variant="outline"
              size="sm"
              className="hover:bg-black hover:text-white"
            >
              Thêm lạc
            </Button>
            <textarea
              name="note-text-box"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Thêm ớt, thêm cà, ..."
              className="w-full p-2 border rounded-md my-3"
              rows={3}
            />
          </div>
        )}

        {/* Selected Summary & Submit */}
        {(selectedItems.length > 0 || orderPrice === 10000) && (
          <div className="mt-8 p-4 border-t">
            <h2 className="text-lg font-semibold mb-2">🛒 Món đã chọn:</h2>
            <ul className="list-disc list-inside space-y-1 mb-4">
              {selectedItems.map((item) => (
                <li key={item.id} className="text-gray-800">
                  {item.name}
                </li>
              ))}
            </ul>
            <h2 className="text-lg font-semibold mb-2">
              Đơn giá: {orderPrice?.toLocaleString()} đ
            </h2>
            <SketchyButton onClick={submitOrder} disabled={submitLoading}>
              {submitLoading ? "Đang lưu..." : "Lưu đơn"}
            </SketchyButton>
          </div>
        )}
      </div>
    </main>
  );
}
