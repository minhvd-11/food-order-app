"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RotateCcw, Volume2, VolumeX, X } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { playTick, playWin, startSpinBed, unlockAudio } from "@/lib/wheelSound";
import { cn } from "@/lib/utils";
import { Food } from "@/types";

const ROW_HEIGHT = 64;
const SPIN_MS = 5000;
/**
 * Rows the reel aims to travel, whatever the pool size. Keeping the distance
 * (and therefore the peak speed) constant means a 25-dish list blurs instead
 * of strobing, and a 3-dish list still gets a proper long spin.
 */
const TARGET_ROWS = 46;
/** Always show every option go past at least once. */
const MIN_LOOPS = 1;
/** Rendered rows, top to bottom. Slot 0 sits in the highlighted window. */
const SLOTS = [2, 1, 0, -1];
const FADE =
  "linear-gradient(to bottom, transparent 0%, #000 22%, #000 78%, transparent 100%)";

const mod = (value: number, size: number) => ((value % size) + size) % size;

/**
 * Distance travelled at `progress` (0 → 1): a long dramatic slow-down plus a
 * tiny settle-back so the reel drops into its notch instead of freezing.
 */
const reelOffset = (progress: number, distance: number) => {
  const eased = 1 - Math.pow(1 - progress, 5);
  const settle = (progress - 0.8) / 0.2;
  const overshoot = settle <= 0 ? 0 : Math.sin(Math.PI * settle) * 10;
  return eased * distance + overshoot;
};

const pickIndex = (size: number) => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] % size;
  }
  return Math.floor(Math.random() * size);
};

type FoodWheelModalProps = {
  open: boolean;
  foods: Food[];
  onClose: () => void;
  onConfirm: (picked: Food[]) => void;
};

export function FoodWheelModal({
  open,
  foods,
  onClose,
  onConfirm,
}: FoodWheelModalProps) {
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [winners, setWinners] = useState<Food[]>([]);
  /** Snapshot of the pool the reel is rendering — frozen while it spins. */
  const [reelPool, setReelPool] = useState<Food[]>([]);
  const [base, setBase] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Food | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  const stripRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const stopBedRef = useRef<(() => void) | null>(null);
  /** Mirrored so a spin already in flight honours a mid-spin mute. */
  const soundRef = useRef(soundOn);

  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  /** Dishes still up for grabs: kept in the wheel and not already won. */
  const eligible = useMemo(
    () =>
      foods.filter(
        (food) =>
          !excludedIds.includes(food.id) &&
          !winners.some((winner) => winner.id === food.id),
      ),
    [foods, excludedIds, winners],
  );

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    stopBedRef.current?.();
    stopBedRef.current = null;
  }, []);

  // Keep the idle reel in sync with the pool, but never disturb a spin or the
  // dish currently being shown off as the result.
  useEffect(() => {
    if (spinning || result) return;
    setReelPool(eligible);
    setBase(0);
    if (stripRef.current) stripRef.current.style.transform = "translateY(0px)";
  }, [eligible, spinning, result]);

  useEffect(() => {
    if (!open) {
      stopAnimation();
      setSpinning(false);
      return;
    }
    setExcludedIds([]);
    setWinners([]);
    setResult(null);
    setBase(0);
  }, [open, stopAnimation]);

  useEffect(() => stopAnimation, [stopAnimation]);

  const spin = () => {
    if (spinning || eligible.length === 0) return;

    const pool = eligible;
    const size = pool.length;
    const winnerIndex = pickIndex(size);
    // Land exactly on the winner: a whole number of rows, winner last.
    const loops = Math.max(MIN_LOOPS, Math.round(TARGET_ROWS / size));
    const rows = loops * size + winnerIndex;
    const distance = rows * ROW_HEIGHT;

    setResult(null);
    setReelPool(pool);
    setBase(0);
    setSpinning(true);

    if (soundRef.current) {
      unlockAudio();
      stopBedRef.current = startSpinBed(SPIN_MS);
    }

    const startedAt = performance.now();
    let lastBase = 0;

    const frame = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / SPIN_MS);
      const offset = reelOffset(progress, distance);
      const nextBase = Math.floor(offset / ROW_HEIGHT);

      if (stripRef.current) {
        stripRef.current.style.transform = `translateY(${
          offset - nextBase * ROW_HEIGHT
        }px)`;
      }

      if (nextBase !== lastBase) {
        lastBase = nextBase;
        setBase(nextBase);
        if (soundRef.current) playTick(1 - progress);
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      rafRef.current = null;
      stopBedRef.current?.();
      stopBedRef.current = null;

      const winner = pool[winnerIndex];
      setBase(rows);
      setSpinning(false);
      setResult(winner);
      setWinners((prev) =>
        prev.some((item) => item.id === winner.id) ? prev : [...prev, winner],
      );
      if (soundRef.current) playWin();
    };

    rafRef.current = requestAnimationFrame(frame);
  };

  const toggleFood = (id: string) =>
    setExcludedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );

  const removeWinner = (id: string) => {
    setWinners((prev) => prev.filter((winner) => winner.id !== id));
    if (result?.id === id) setResult(null);
  };

  const reset = () => {
    setWinners([]);
    setResult(null);
  };

  const toggleSound = () => {
    setSoundOn((prev) => {
      if (prev) {
        stopBedRef.current?.();
        stopBedRef.current = null;
      }
      return !prev;
    });
  };

  const inWheelCount = foods.filter(
    (food) => !excludedIds.includes(food.id),
  ).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !spinning) onClose();
      }}
    >
      <DialogContent
        showCloseButton={!spinning}
        className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-xl">🎰 Vòng quay món ăn</DialogTitle>
          <DialogDescription>
            Bỏ bớt món không thích, bấm quay rồi chốt danh sách khi ưng ý.
          </DialogDescription>
        </DialogHeader>

        {/* Reel */}
        <div
          className="relative overflow-hidden rounded-2xl border-2 border-amber-300 dark:border-amber-500/40 bg-gradient-to-b from-amber-50 via-white to-amber-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 shadow-inner"
          style={{ height: ROW_HEIGHT * 3 }}
        >
          {reelPool.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Không còn món nào trong vòng quay. Chọn thêm món bên dưới nhé!
            </div>
          ) : (
            <div
              className="absolute inset-0"
              style={{ maskImage: FADE, WebkitMaskImage: FADE }}
            >
              <div
                ref={stripRef}
                className="absolute inset-x-0 top-0 will-change-transform"
              >
                {SLOTS.map((slot) => {
                  const food = reelPool[mod(base + slot, reelPool.length)];
                  const landed = !spinning && slot === 0;

                  return (
                    <div
                      key={slot}
                      className="absolute inset-x-0 flex items-center justify-center px-12"
                      style={{
                        top: (1 - slot) * ROW_HEIGHT,
                        height: ROW_HEIGHT,
                      }}
                    >
                      <span
                        className={cn(
                          "truncate text-center transition-all duration-200",
                          landed
                            ? "text-2xl font-black text-red-700 dark:text-amber-300"
                            : "text-lg font-semibold text-gray-500 dark:text-gray-400",
                        )}
                      >
                        {food.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Window that marks the winning row */}
          {reelPool.length > 0 && (
            <div
              className="pointer-events-none absolute inset-x-0 flex items-center justify-between rounded-lg border-y-2 border-red-400/70 dark:border-amber-400/60 bg-amber-300/10"
              style={{ top: ROW_HEIGHT, height: ROW_HEIGHT }}
            >
              <span className="pl-2 text-lg text-red-500 dark:text-amber-400">
                ▶
              </span>
              <span className="pr-2 text-lg text-red-500 dark:text-amber-400">
                ◀
              </span>
            </div>
          )}
        </div>

        {/* Result + spin */}
        <div className="mt-4 flex flex-col items-center gap-3">
          <AnimatePresence mode="wait">
            {result && !spinning && (
              <motion.p
                key={result.id}
                initial={{ opacity: 0, scale: 0.85, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                className="text-sm font-semibold text-green-700 dark:text-green-400"
              >
                🎉 Trúng món <strong>{result.name}</strong>!
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={spin}
            disabled={spinning || eligible.length === 0}
            className={cn(
              "w-full max-w-xs rounded-full px-8 py-3 text-lg font-black uppercase tracking-wider text-white shadow-lg transition-all",
              "bg-gradient-to-r from-red-600 via-orange-500 to-amber-500",
              spinning || eligible.length === 0
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:brightness-110 active:scale-[0.97]",
            )}
          >
            {spinning
              ? "Đang quay..."
              : winners.length > 0
                ? "🎲 Quay tiếp"
                : "🎲 Quay ngay"}
          </button>
        </div>

        {/* Pool picker */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              🍱 Món trong vòng quay ({inWheelCount}/{foods.length})
            </h3>
            <button
              type="button"
              onClick={() =>
                setExcludedIds(
                  excludedIds.length ? [] : foods.map((food) => food.id),
                )
              }
              disabled={spinning}
              className="text-xs text-gray-500 dark:text-gray-400 underline underline-offset-2 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 cursor-pointer"
            >
              {excludedIds.length ? "Chọn tất cả" : "Bỏ chọn tất cả"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {foods.map((food) => {
              const won = winners.some((winner) => winner.id === food.id);
              const inWheel = !excludedIds.includes(food.id);

              return (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => toggleFood(food.id)}
                  disabled={spinning || won}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-all disabled:cursor-not-allowed",
                    won
                      ? "border-green-500 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900/50 dark:text-green-200"
                      : inWheel
                        ? "cursor-pointer border-red-300 bg-red-50 text-red-800 hover:border-red-500 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                        : "cursor-pointer border-gray-200 bg-transparent text-gray-400 line-through dark:border-neutral-700 dark:text-neutral-500",
                  )}
                >
                  {won ? "🎉 " : ""}
                  {food.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Winners */}
        {winners.length > 0 && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/40">
            <h3 className="mb-2 text-sm font-semibold text-green-800 dark:text-green-300">
              🛒 Món đã quay được ({winners.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {winners.map((winner) => (
                <span
                  key={winner.id}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm text-green-900 shadow-sm dark:bg-neutral-800 dark:text-green-200"
                >
                  {winner.name}
                  <button
                    type="button"
                    onClick={() => removeWinner(winner.id)}
                    disabled={spinning}
                    aria-label={`Bỏ ${winner.name}`}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-50 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="mt-6 sm:justify-between">
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleSound}
              aria-label={soundOn ? "Tắt âm thanh" : "Bật âm thanh"}
            >
              {soundOn ? <Volume2 /> : <VolumeX />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={reset}
              disabled={spinning || winners.length === 0}
            >
              <RotateCcw /> Quay lại từ đầu
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={spinning}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => onConfirm(winners)}
              disabled={spinning || winners.length === 0}
            >
              Chốt {winners.length} món
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
