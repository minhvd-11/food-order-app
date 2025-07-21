"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/utils";

type ParsedFood = {
  id: string;
  name: string;
};

export default function AdminParsePage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedFood[]>([]);
  const { selectedItems, toggleItem } = useCartStore();

  const handleParse = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/parse-food", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Lỗi khi phân tích danh sách");

      setResult(data.foods);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📋 Phân tích danh sách món ăn</h1>

      <Textarea
        placeholder="Nhập danh sách món ăn, phân cách bằng dấu phẩy..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[120px]"
      />

      <Button onClick={handleParse} disabled={loading}>
        {loading ? "Đang phân tích..." : "Phân tích"}
      </Button>

      {result.length > 0 && (
        <>
          <h2 className="text-xl font-semibold">Kết quả:</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {result.map((food) => {
              const isSelected = selectedItems.some((i) => i.id === food.id);

              return (
                <Card
                  key={food.id}
                  onClick={() => toggleItem(food)}
                  className={cn(
                    "cursor-pointer border p-4 rounded-xl transition-all",
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
        </>
      )}
    </main>
  );
}
