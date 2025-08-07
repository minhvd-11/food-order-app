import { create } from "zustand";
import { toast } from "sonner";

type FoodItem = {
  id: string;
  name: string;
};

interface CartStore {
  guestName: string;
  shortName: string;
  note?: string;
  setGuestName: (name: string) => void;
  setShortName: (short: string) => void;
  setNote: (note?: string) => void;
  selectedItems: FoodItem[];
  toggleItem: (item: FoodItem) => void;
  submitOrder: () => void;
  loading: boolean;
}

export const useCartStore = create<CartStore>((set, get) => ({
  guestName: "",
  shortName: "",
  note: "",
  setGuestName: (name) => set({ guestName: name }),
  setShortName: (short) => set({ shortName: short }),
  selectedItems: [],
  toggleItem: (item) => {
    const current = get().selectedItems;
    const exists = current.some((i) => i.id === item.id);
    const updated = exists
      ? current.filter((i) => i.id !== item.id)
      : [...current, item];
    set({ selectedItems: updated });
  },
  loading: false,
  setNote: (val?: string) => set({ note: val }),

  submitOrder: async () => {
    const { guestName, shortName, selectedItems, note } = get();

    if (!guestName.trim() || !shortName.trim()) {
      toast.warning("Vui lòng nhập đầy đủ tên và tên viết tắt!");
      return;
    }

    if (selectedItems.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 món!");
      return;
    }

    set({ loading: true });

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: guestName,
          shortName,
          note,
          foodIds: selectedItems.map((item) => item.id),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Đặt đơn thất bại");
      }

      toast.success("🧾 Đơn đã được gửi thành công!");
      set({ guestName: "", shortName: "", note: "", selectedItems: [] });
    } catch (error: any) {
      toast.error("🚨 Lỗi: " + error.message);
    } finally {
      set({ loading: false }); // Stop loading no matter what
    }
  },
}));
