"use client";

import { useEffect, useState } from "react";
import { SketchyButton, TodayOrderModal } from "@/components";
import { useCartStore } from "@/store/useCartStore";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Food, OrderPrice, OrderPriceTierType, User } from "@/types";
import { useUser } from "@/contexts/UserContext";
import { ChevronDown } from "lucide-react";

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

const noteOptions = ["thêm lạc", "nhiều cơm", "ít cơm", "thêm cà"];

export const OrderSelection = () => {
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

  const isNoToppingOrder = orderPrice === 10000;

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
    // <main className="p-6 space-y-6">
    <section className="max-w-4xl mx-auto p-6 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-red-100 dark:border-neutral-800 relative z-10 my-8">
      {/* Name & Shortname Inputs */}
      <div className="flex justify-between gap-4 items-end mb-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">
            🧑 Tên của bạn (chọn từ danh sách):
          </label>
          <div className="relative">
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
              className="w-full h-12 pl-4 pr-10 rounded-xl border border-gray-200 dark:border-neutral-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-neutral-800 shadow-sm transition-all appearance-none text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              <option value="">--Chọn tên bạn--</option>
              {users.map((user) => (
                <option key={user.id} value={user.name}>
                  {user.name} ({user.shortName})
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
              size={18}
            />
          </div>
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
            className="w-full h-12 pl-4 pr-10 rounded-xl border border-gray-200 dark:border-neutral-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-neutral-800 shadow-sm transition-all appearance-none text-gray-700 dark:text-gray-200"
          />
        </div>

        <SketchyButton onClick={() => setShowModal(true)}>
          Xem đơn
        </SketchyButton>
        {showModal && <TodayOrderModal onClose={() => setShowModal(false)} />}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
        {priceOptions.map((option) => {
          const isSelected = option.value === orderPrice;

          return (
            <button
              type="button"
              key={option.priceTier}
              onClick={() => setOrderPrice(option.value)}
              className={`
                  relative p-2 rounded-xl border-2 transition-all duration-300
                  text-center group cursor-pointer
                  ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-400/10 shadow-lg shadow-emerald-400/20"
                      : "border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md"
                  }
               `}
            >
              <div className="flex flex-col gap-1 items-center">
                <div className="flex justify-between">
                  <h3
                    className={`transition-colors ${
                      isSelected
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {option.label}
                  </h3>
                </div>

                <p className="text-slate-600 dark:text-slate-400 text-sm">
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
        <div className="p-6 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-dashed border-gray-300 dark:border-neutral-700 text-center">
          <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
            <span className="text-xl">✕</span> Không có món ăn nào cho hôm nay.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {foods.map((food) => {
            const isSelected = selectedItems.some(
              (item) => item.id === food.id,
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
                    ? "cursor-pointer hover:shadow-md active:scale-[0.98] hover:border-gray-400 dark:hover:border-neutral-500"
                    : "cursor-not-allowed opacity-60",
                  isSelected && orderPrice !== 10000
                    ? "border-green-500 bg-green-100 text-green-900 dark:border-green-600 dark:bg-green-900/40 dark:text-green-100"
                    : "border-gray-200 dark:border-neutral-700",
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
          {noteOptions.map((opt, index) => {
            return (
              <Button
                key={index}
                onClick={() => setNote(!note ? opt : note + `, ${opt}`)}
                variant="outline"
                size="sm"
                className="hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black mr-2"
              >
                {opt}
              </Button>
            );
          })}

          <textarea
            name="note-text-box"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Thêm ớt, thêm cà, ..."
            className="w-full p-2 border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 rounded-md my-3"
            rows={3}
          />
        </div>
      )}

      {/* Selected Summary & Submit */}
      {(selectedItems.length > 0 || isNoToppingOrder) && (
        <div className="mt-8 p-4 border-t border-gray-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold mb-2">🛒 Món đã chọn:</h2>
          {isNoToppingOrder ? (
            <span>Cơm 10k</span>
          ) : (
            <ul className="list-disc list-inside space-y-1 mb-4">
              {selectedItems.map((item) => (
                <li key={item.id} className="text-gray-800 dark:text-gray-200">
                  {item.name}
                </li>
              ))}
            </ul>
          )}

          <h2 className="text-lg font-semibold mb-2">
            Đơn giá: {orderPrice?.toLocaleString()} đ
          </h2>
          <SketchyButton onClick={submitOrder} disabled={submitLoading}>
            {submitLoading ? "Đang lưu..." : "Lưu đơn"}
          </SketchyButton>
        </div>
      )}
    </section>
    // </main>
  );
};
