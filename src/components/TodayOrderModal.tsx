"use client";

import { FoodOrder } from "@/types";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { isOrderAdmin } from "@/lib/orderAdmin";
import { ClipboardList, Lock, LockOpen, Trash2, X } from "lucide-react";

interface TodayOrderModalProps {
  onClose: () => void;
  locked: boolean;
  onLockedChange: (locked: boolean) => void;
}

export function TodayOrderModal({
  onClose,
  locked,
  onLockedChange,
}: TodayOrderModalProps) {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);

  const { user } = useUser();
  const canManageLock = isOrderAdmin(user?.email);

  useEffect(() => {
    setMounted(true);
    fetchTodayOrders();
  }, []);

  const fetchTodayOrders = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = now.toISOString();
      const res = await fetch(`/api/orders/orders?groupBy=day&value=${today}`);
      const data = await res.json();
      const todayGroup = data?.data?.[0];
      setOrders(todayGroup?.orders ?? []);
    } finally {
      setLoading(false);
    }
  };

  const removeOrder = async (orderId: string) => {
    const confirm = window.confirm("❗ Bạn có chắc muốn xóa đơn này?");
    if (!confirm) return;

    await fetch(`/api/orders/manage-orders`, {
      method: "DELETE",
      body: JSON.stringify({ orderId }),
      headers: { "Content-Type": "application/json" },
    });

    fetchTodayOrders();
  };

  const handleCopy = async () => {
    const text = orders
      .map((o, index) => {
        const items = o.foodNames?.join(", ") || "";
        const note = o.note?.trim() ? ` (${o.note})` : "";
        return `${index + 1}. ${o.userName}: ${items}${note}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);

      toast.success("📋 Đã sao chép danh sách đơn đặt hôm nay!");
    } catch {
      toast.error("❌ Lỗi khi sao chép vào clipboard.");
    }
  };

  const updateLock = async (nextLocked: boolean) => {
    setLockLoading(true);
    try {
      const res = await fetch("/api/orders/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked: nextLocked }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Cập nhật trạng thái thất bại");
      }
      onLockedChange(nextLocked);
      setShowConfirm(false);
      toast.success(
        nextLocked
          ? "🔒 Đã chốt đơn hôm nay! Mọi người không thể đặt thêm."
          : "🔓 Đã mở lại đặt đơn!",
      );
    } catch (error) {
      toast.error(
        "🚨 " + (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setLockLoading(false);
    }
  };

  const totalPrice = orders.reduce((sum, o) => sum + (o.price ?? 0), 0);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-neutral-800">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              🗓️ Đơn đặt hôm nay
              <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                {orders.length} đơn
              </span>
              {locked && (
                <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 flex items-center gap-1">
                  <Lock size={12} /> Đã chốt
                </span>
              )}
            </h2>
            {!loading && orders.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Tổng tiền:{" "}
                <span className="font-semibold text-lime-600 dark:text-lime-400">
                  {totalPrice.toLocaleString()} đ
                </span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {loading ? (
            <p className="text-gray-500 dark:text-gray-400 py-6 text-center">
              ⏳ Đang tải...
            </p>
          ) : orders.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-6 text-center">
              Chưa có đơn đặt nào hôm nay.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {orders.map((o, index) => (
                <li
                  key={o.id}
                  className="border border-gray-200 dark:border-neutral-700 rounded-xl p-3 bg-gray-50 dark:bg-neutral-800 text-sm flex justify-between items-start gap-3 hover:border-gray-300 dark:hover:border-neutral-600 transition"
                >
                  <div className="flex gap-3 min-w-0">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 text-xs font-bold flex items-center justify-center mt-0.5">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <strong>
                        {o.userName} ({o.userShortName})
                        {!!o.price && (
                          <span>
                            {` - `}
                            <span className="text-lime-600 dark:text-lime-400">
                              {o.price / 1000}k
                            </span>
                          </span>
                        )}
                      </strong>
                      <p className="text-gray-700 dark:text-gray-300 break-words">
                        {o.foodNames?.join(", ") || ""}
                        {o.note?.trim() && (
                          <span className="text-gray-500 dark:text-gray-400">
                            {" "}
                            ({o.note})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeOrder(o.id)}
                    aria-label="Xóa đơn"
                    className="shrink-0 p-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-6 pb-5 pt-3 border-t border-gray-100 dark:border-neutral-800 space-y-2.5">
            {orders.length > 0 && (
              <button
                type="button"
                onClick={handleCopy}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
              >
                <ClipboardList size={16} /> Sao chép danh sách
              </button>
            )}

            {canManageLock && (
              <>
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  disabled={locked || lockLoading}
                  className="w-full px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock size={16} />
                  {locked ? "Đã chốt đơn" : "Chốt đơn"}
                </button>

                {locked && (
                  <button
                    type="button"
                    onClick={() => updateLock(false)}
                    disabled={lockLoading}
                    className="w-full px-4 py-2.5 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <LockOpen size={16} />
                    {lockLoading ? "Đang mở lại..." : "Mở lại đặt đơn"}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Lock confirmation popup */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-neutral-800 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-300">
              <Lock size={22} />
            </div>
            <h3 className="text-lg font-bold mb-1.5">Chốt đơn hôm nay?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Sau khi chốt, mọi người sẽ không thể chọn món hay đặt thêm đơn
              mới.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={lockLoading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-medium"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => updateLock(true)}
                disabled={lockLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                {lockLoading ? "Đang chốt..." : "Đồng ý"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
