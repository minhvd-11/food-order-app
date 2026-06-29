"use client";

import { useState } from "react";
import { Textarea, Card, Input } from "@/components/ui";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SketchyButton } from "@/components";
import { Food } from "@/types";

export default function AdminParsePage() {
  const [text, setText] = useState("");
  const [loadingParse, setLoadingParse] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [announcing, setAnnouncing] = useState(false);
  const [result, setResult] = useState<Food[]>([]);
  const [saved, setSaved] = useState(false);
  const [savedFoods, setSavedFoods] = useState<string[]>([]);
  const [savedDate, setSavedDate] = useState<string | null>(null);
  const [savedTime, setSaveTime] = useState<string>("11h");

  const handleParse = async () => {
    setLoadingParse(true);
    try {
      const res = await fetch("/api/admin/parse-food", {
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
        }),
      );

      setResult(foodsWithId);
      setSaved(false); // reset saved status after new parse
      setSavedFoods([]);
      setSavedDate(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    } finally {
      setLoadingParse(false);
    }
  };

  const handleSave = async () => {
    setLoadingSave(true);
    try {
      const payload = {
        foods: result.map((item) => item.name),
        date: new Date().toISOString(),
      };

      const res = await fetch("/api/admin/foods", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lỗi khi lưu dữ liệu");
      }

      toast.success("Đã lưu danh sách món ăn cho ngày hôm nay");
      setSaved(true);
      setSavedFoods(payload.foods);
      setSavedDate(payload.date);
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi lưu dữ liệu");
    } finally {
      setLoadingSave(false);
    }
  };

  const handleAnnounce = async () => {
    if (!saved || savedFoods.length === 0) {
      toast.error("Chưa có danh sách đã lưu để thông báo");
      return;
    }

    setAnnouncing(true);
    try {
      const res = await fetch("/api/admin/announce", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: savedDate,
          foods: savedFoods,
          time: savedTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lỗi khi gọi workflow");
      }

      toast.success("Đã gửi thông báo");
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi gửi thông báo");
    } finally {
      setAnnouncing(false);
    }
  };

  return (
    <main className="p-6 mb-12 space-y-6">
      <h1 className="text-2xl font-bold">📋 Phân tích danh sách món ăn</h1>

      <Textarea
        placeholder="Nhập danh sách món ăn, phân cách bằng dấu phẩy..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[120px]"
      />

      <SketchyButton onClick={handleParse} disabled={loadingParse || !text}>
        {loadingParse ? "Đang phân tích..." : "Phân tích"}
      </SketchyButton>

      {result.length > 0 && (
        <>
          <h2 className="text-xl font-semibold">Kết quả:</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {result.map((food) => (
              <Card
                key={food.id}
                className={cn(
                  "border p-4 rounded-xl transition-all border-gray-200 hover:border-gray-400",
                )}
              >
                <p className="text-base font-medium">{food.name}</p>
              </Card>
            ))}
          </div>

          <div className="flex gap-3 items-center">
            <SketchyButton onClick={handleSave} disabled={loadingSave}>
              {loadingSave ? "Đang lưu..." : "Lưu"}
            </SketchyButton>

            <SketchyButton
              onClick={handleAnnounce}
              disabled={!saved || announcing}
            >
              {announcing ? "Đang gửi..." : "Thông báo"}
            </SketchyButton>

            {
              <Input
                placeholder="Thời gian chốt"
                type="text"
                value={savedTime}
                onChange={(e) => setSaveTime(e.target.value)}
                className="max-w-24"
              />
            }

            {saved && <span className="text-sm text-green-600">Đã lưu</span>}
          </div>
        </>
      )}
    </main>
  );
}
