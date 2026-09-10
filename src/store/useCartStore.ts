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
  orderPrice?: number;
  setGuestName: (name: string) => void;
  setShortName: (short: string) => void;
  setNote: (note?: string) => void;
  setOrderPrice: (orderPrice: number) => void;
  selectedItems: FoodItem[];
  toggleItem: (item: FoodItem) => void;
  addItems: (items: FoodItem[]) => void;
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
  addItems: (items) => {
    const merged = [...get().selectedItems];
    items.forEach((item) => {
      if (!merged.some((i) => i.id === item.id)) merged.push(item);
    });
    set({ selectedItems: merged });
  },
  loading: false,
  setNote: (val?: string) => set({ note: val }),
  orderPrice: 30000,
  setOrderPrice: (val?: number) => set({ orderPrice: val }),

  submitOrder: async () => {
    const { guestName, shortName, selectedItems, note, orderPrice } = get();

    const isNoToppingOrder = orderPrice === 10000;

    const orderNote = isNoToppingOrder
      ? "Cơm 10k"
      : orderPrice === 30000
        ? note
        : note + ` suất ${orderPrice}đ`;

    if (!guestName.trim() || !shortName.trim()) {
      toast.warning("Vui lòng chọn tên hoặc nhập tên mới!");
      return;
    }

    if (selectedItems.length === 0 && !isNoToppingOrder) {
      toast.warning("Vui lòng chọn ít nhất 1 món!");
      return;
    }

    set({ loading: true });

    try {
      const res = await fetch("/api/orders/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: guestName,
          shortName,
          note: orderNote,
          foodIds: isNoToppingOrder
            ? undefined
            : selectedItems.map((item) => item.id),
          price: orderPrice,
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
