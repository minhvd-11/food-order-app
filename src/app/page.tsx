"use client";

import { foodList } from "@/data/foods";
import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default function Home() {
  const { selectedItems, toggleItem } = useCartStore();

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">🍽 Danh sách món ăn</h1>
      <div className="text-red-500 font-bold p-4">This text should be red</div>

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
    </main>
  );
}
