"use client";

import { useState } from "react";
import { Textarea, Card, Button } from "@/components/ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Food } from "@/types";
import { Navbar, SketchyButton } from "@/components";

export default function AdminParsePage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Food[]>([]);

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

      const foodsWithId: Food[] = data.foods.map(
        (food: { name: string }, index: number) => ({
          id: index,
          name: food.name,
        })
      );

      setResult(foodsWithId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const res = await fetch("/api/admin/foods", {
      method: "POST",
      body: JSON.stringify({
        foods: result.map((item) => item.name),
        date: new Date().toISOString(),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Lỗi khi lưu dữ liệu");
    }

    alert("Đã lưu danh sách món ăn cho ngày hôm nay");
  };

  return (
    <main className="p-6 space-y-6">
      <Navbar />
      <h1 className="text-2xl font-bold">📋 Phân tích danh sách món ăn</h1>

      <Textarea
        placeholder="Nhập danh sách món ăn, phân cách bằng dấu phẩy..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[120px]"
      />

      <SketchyButton onClick={handleParse} disabled={loading}>
        {loading ? "Đang phân tích..." : "Phân tích"}
      </SketchyButton>

      {result.length > 0 && (
        <>
          <h2 className="text-xl font-semibold">Kết quả:</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {result.map((food) => (
              <Card
                key={food.id}
                className={cn(
                  "border p-4 rounded-xl transition-all border-gray-200 hover:border-gray-400"
                )}
              >
                <p className="text-base font-medium">{food.name}</p>
              </Card>
            ))}
          </div>

          <Button onClick={handleSave}>{"Lưu danh sách"}</Button>
        </>
      )}
    </main>
  );
}
