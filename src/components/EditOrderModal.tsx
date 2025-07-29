"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  Checkbox,
  Button,
} from "@/components/ui";
import { useEffect, useState } from "react";

type EditOrderModalProps = {
  open: boolean;
  onClose: () => void;
  userName: string;
  foodNames: string[];
  availableFoods: string[];
  onSave: (newFoodNames: string[]) => void;
};

export function EditOrderModal({
  open,
  onClose,
  userName,
  foodNames,
  availableFoods,
  onSave,
}: EditOrderModalProps) {
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedFoods(foodNames);
    }
  }, [open, foodNames]);

  const toggleFood = (food: string) => {
    setSelectedFoods((prev) =>
      prev.includes(food) ? prev.filter((f) => f !== food) : [...prev, food]
    );
  };

  const handleSave = () => {
    onSave(selectedFoods);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>✏️ Chỉnh sửa đơn của {userName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 max-h-[300px] overflow-y-auto">
          {availableFoods.map((food) => (
            <label
              key={food}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={selectedFoods.includes(food)}
                onCheckedChange={() => toggleFood(food)}
              />
              <span>{food}</span>
            </label>
          ))}
        </div>
        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button variant="secondary">Hủy</Button>
          </DialogClose>
          <Button onClick={handleSave}>Lưu thay đổi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
