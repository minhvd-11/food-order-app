"use client";

import { BackgroundDecorations, OrderSelection } from "@/components";
import GradientText from "@/components/GradientText";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FFFBF0] font-sans text-gray-900 selection:bg-red-200">
      <main className="relative pt-8 pb-20">
        <BackgroundDecorations />

        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-6 text-center mb-8 relative z-10">
          <div className="inline-block mb-4 p-2 bg-red-100 rounded-full">
            <span className="px-4 py-1 bg-red-600 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full">
              Chúc Mừng Năm Mới
            </span>
          </div>
          <GradientText
            colors={["#740A03", "#E6501B", "#C3110C"]}
            animationSpeed={8}
            showBorder={false}
            className="text-5xl md:text-6xl font-black mb-4 tracking-tight"
          >
            Teko Daily Lunch
          </GradientText>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Chào mừng Xuân Bính Ngọ 2026. Cùng đón chào năm mới an khang thịnh
            vượng!
          </p>
        </section>

        {/* Main Content Area */}
        <div className="container mx-auto">
          <OrderSelection />
        </div>
      </main>
    </div>
  );
}
