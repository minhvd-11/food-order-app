import React from "react";
import { motion } from "motion/react";

const Blossom = ({
  delay,
  left,
  size,
}: {
  delay: number;
  left: string;
  size: number;
}) => (
  <motion.div
    initial={{ y: -20, opacity: 0, rotate: 0 }}
    animate={{
      y: "100vh",
      opacity: [0, 1, 1, 0],
      rotate: 360,
      x: [0, 20, -20, 0],
    }}
    transition={{
      duration: 10 + Math.random() * 10,
      delay,
      repeat: Infinity,
      ease: "linear",
    }}
    style={{ left, width: size, height: size }}
    className="fixed pointer-events-none z-0"
  >
    <div className="w-full h-full bg-pink-300 rounded-full opacity-60 blur-[1px]" />
  </motion.div>
);

export const BackgroundDecorations = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <Blossom delay={0} left="5%" size={12} />
      <Blossom delay={2} left="15%" size={8} />
      <Blossom delay={5} left="25%" size={14} />
      <Blossom delay={1} left="40%" size={10} />
      <Blossom delay={4} left="60%" size={12} />
      <Blossom delay={7} left="75%" size={9} />
      <Blossom delay={3} left="85%" size={15} />
      <Blossom delay={6} left="95%" size={11} />

      {/* Decorative Corners */}
      {/* <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
        <img
          src="https://images.unsplash.com/photo-1732381201456-b97e72b5e78e"
          alt="pattern"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-0 left-0 w-64 h-64 opacity-10 rotate-180">
        <img
          src="https://images.unsplash.com/photo-1732381201456-b97e72b5e78e"
          alt="pattern"
          className="w-full h-full object-cover"
        />
      </div> */}
    </div>
  );
};
