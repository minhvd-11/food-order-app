import { create } from "zustand";

type FoodItem = {
  id: string;
  name: string;
};

interface CartStore {
  guestName: string;
  setGuestName: (name: string) => void;
  selectedItems: FoodItem[];
  toggleItem: (item: FoodItem) => void;
  submitOrder: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  guestName: "",
  setGuestName: (name) => set({ guestName: name }),
  selectedItems: [],
  toggleItem: (item) => {
    const current = get().selectedItems;
    const exists = current.some((i) => i.id === item.id);
    const updated = exists
      ? current.filter((i) => i.id !== item.id)
      : [...current, item];
    set({ selectedItems: updated });
  },

  submitOrder: async () => {
    const { guestName, selectedItems } = get();

    if (!guestName.trim()) {
      alert("Vui lòng nhập tên!");
      return;
    }

    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất 1 món!");
      return;
    }

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: guestName,
          foodIds: selectedItems.map((item) => item.id),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Đặt đơn thất bại");
      }

      alert("🧾 Đơn đã được gửi thành công!");

      // Reset form
      set({ guestName: "", selectedItems: [] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      alert("🚨 Lỗi: " + error.message);
    }
  },
}));
