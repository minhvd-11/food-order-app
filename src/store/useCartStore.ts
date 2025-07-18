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
}));
