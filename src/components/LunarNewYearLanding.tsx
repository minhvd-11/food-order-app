"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import GradientText from "@/components/GradientText";

// ─── Firework Canvas Logic ────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  color: string;
  size: number;
  trail: { x: number; y: number }[];
}

interface Firework {
  x: number;
  y: number;
  targetY: number;
  speed: number;
  color: string;
  exploded: boolean;
  trail: { x: number; y: number; alpha: number }[];
}

const FIREWORK_COLORS = [
  "#FF4136", // Red
  "#FFD700", // Gold
  "#FF6B35", // Orange
  "#FF1493", // Deep Pink
  "#FF8C00", // Dark Orange
  "#FF4500", // Orange Red
  "#FFB347", // Pastel Orange
  "#FADA5E", // Royal Gold
  "#E0115F", // Ruby
  "#FF2400", // Scarlet
];

function randomColor() {
  return FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
}

function createParticles(x: number, y: number, color: string): Particle[] {
  const particles: Particle[] = [];
  const count = 60 + Math.floor(Math.random() * 40);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 1.5 + Math.random() * 4;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      decay: 0.008 + Math.random() * 0.012,
      color,
      size: 1.5 + Math.random() * 2,
      trail: [],
    });
  }
  return particles;
}

function FireworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireworksRef = useRef<Firework[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const lastLaunchRef = useRef<number>(0);

  const launchFirework = useCallback((width: number, height: number) => {
    const color = randomColor();
    fireworksRef.current.push({
      x: width * 0.1 + Math.random() * width * 0.8,
      y: height,
      targetY: height * 0.1 + Math.random() * height * 0.35,
      speed: 3 + Math.random() * 2,
      color,
      exploded: false,
      trail: [],
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = (timestamp: number) => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      // Semi-transparent clear for trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(0, 0, w, h);

      // Auto-launch fireworks
      if (timestamp - lastLaunchRef.current > 400 + Math.random() * 800) {
        launchFirework(w, h);
        lastLaunchRef.current = timestamp;
      }

      // Update & draw fireworks (rising)
      fireworksRef.current = fireworksRef.current.filter((fw) => {
        if (fw.exploded) return false;

        fw.trail.push({ x: fw.x, y: fw.y, alpha: 1 });
        if (fw.trail.length > 12) fw.trail.shift();

        fw.y -= fw.speed;
        fw.x += (Math.random() - 0.5) * 0.5;

        // Draw trail
        fw.trail.forEach((t, i) => {
          const a = (i / fw.trail.length) * 0.6;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
          ctx.fill();
        });

        // Draw head
        ctx.beginPath();
        ctx.arc(fw.x, fw.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = fw.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = fw.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (fw.y <= fw.targetY) {
          fw.exploded = true;
          particlesRef.current.push(...createParticles(fw.x, fw.y, fw.color));
          return false;
        }
        return true;
      });

      // Update & draw particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.shift();

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03; // gravity
        p.vx *= 0.99;
        p.alpha -= p.decay;

        // Draw trail
        p.trail.forEach((t, i) => {
          const a = (i / p.trail.length) * p.alpha * 0.4;
          ctx.beginPath();
          ctx.arc(t.x, t.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle =
            p.color.replace(")", `, ${a})`).replace("rgb", "rgba") ||
            `rgba(255, 200, 100, ${a})`;
          ctx.fill();
        });

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        return p.alpha > 0.01;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [launchFirework]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: "transparent" }}
    />
  );
}

// ─── Floating Lantern Component ───────────────────────────────────────

function FloatingLantern({
  delay,
  left,
  size,
}: {
  delay: number;
  left: string;
  size: number;
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{
        y: [-10, 10, -10],
        opacity: [0.4, 0.8, 0.4],
      }}
      transition={{
        duration: 5 + Math.random() * 3,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{ left, fontSize: size }}
      className="absolute pointer-events-none z-10"
    >
      🏮
    </motion.div>
  );
}

// ─── Main Landing Component ───────────────────────────────────────────



export function LunarNewYearLanding() {
  return (
    <section className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#1a0000] via-[#2d0a0a] to-[#0d0000]">
      {/* Firework Canvas */}
      <div className="absolute inset-0 z-0">
        <FireworkCanvas />
      </div>

      {/* Floating Lanterns */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <FloatingLantern delay={0} left="8%" size={36} />
        <FloatingLantern delay={1.5} left="20%" size={28} />
        <FloatingLantern delay={0.8} left="45%" size={32} />
        <FloatingLantern delay={2} left="70%" size={30} />
        <FloatingLantern delay={1} left="88%" size={34} />
      </div>

      {/* Radial glow behind text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red-900/20 blur-[120px] pointer-events-none z-0" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="relative z-20 text-center px-6 max-w-3xl"
      >
        {/* Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="inline-block mb-6"
        >
          <span className="px-5 py-2 bg-gradient-to-r from-red-700 to-red-600 text-white text-xs font-bold uppercase tracking-[0.25em] rounded-full shadow-lg shadow-red-900/50 border border-red-500/30">
            🧧 Chúc Mừng Năm Mới 🧧
          </span>
        </motion.div>

        {/* Title */}
        <GradientText
          colors={["#FFD700", "#FF6B35", "#FF4136", "#FFD700"]}
          animationSpeed={6}
          showBorder={false}
          className="text-5xl md:text-7xl font-black mb-6 tracking-tight drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]"
        >
          Teko Daily Lunch
        </GradientText>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-red-100/80 text-lg md:text-xl mb-4 font-light"
        >
          Chào mừng Xuân Bính Ngọ 2026 🐎
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-red-200/60 text-base md:text-lg mb-10"
        >
          An khang thịnh vượng — Vạn sự như ý
        </motion.p>

        {/* CTA Button */}
        {/* <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 0 40px rgba(255, 215, 0, 0.4)",
          }}
          whileTap={{ scale: 0.97 }}
          className="relative px-10 py-4 bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white font-bold text-lg rounded-2xl shadow-xl shadow-red-900/50 border border-red-500/40 cursor-pointer transition-all duration-300 hover:from-red-600 hover:via-red-500 hover:to-red-600 group"
        >
          <span className="relative z-10 flex items-center gap-3">
            🍽️ Đặt cơm ngay
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </span>
        </motion.button> */}

        {/* Decorative divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="mt-12 flex items-center justify-center gap-4"
        >
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-red-500/50" />
          <span className="text-red-400/60 text-sm">🏮</span>
          <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-red-500/50" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 text-red-200/60 text-base md:text-lg mb-10"
        >
          Thời gian hoạt động trở lại: Mùng 10 Âm lịch (Thứ 5, 26/02/2026)
        </motion.p>
      </motion.div>

      {/* Scroll indicator */}
      {/* <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 cursor-pointer"
        >
          <span className="text-red-300/50 text-xs tracking-widest uppercase">
            Cuộn xuống
          </span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="text-red-400/50"
          >
            <path
              d="M5 8L10 13L15 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </motion.div> */}
    </section>
  );
}
