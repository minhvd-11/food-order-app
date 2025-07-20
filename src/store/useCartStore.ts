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

  submitOrder: () => {
    const { guestName, selectedItems } = get();

    if (!guestName.trim()) {
      alert("Vui lòng nhập tên!");
      return;
    }

    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất 1 món!");
      return;
    }

    const order = {
      guestName,
      items: selectedItems,
      time: new Date().toISOString(),
    };

    const saved = JSON.parse(localStorage.getItem("orders") || "[]");
    saved.push(order);
    localStorage.setItem("orders", JSON.stringify(saved));

    alert("🧾 Đơn đã được lưu!");

    set({ guestName: "", selectedItems: [] });
  },
}));
