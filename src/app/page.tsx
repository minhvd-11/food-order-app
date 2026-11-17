"use client";

import { BackgroundDecorations, OrderSelection } from "@/components";
import GradientText from "@/components/GradientText";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FFFBF0] dark:bg-neutral-950 font-sans text-gray-900 dark:text-gray-100 selection:bg-red-200 dark:selection:bg-red-900">
      <main className="relative pt-8 pb-20">
        <BackgroundDecorations />

        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-6 text-center mb-8 relative z-10">
          <GradientText
            colors={["#740A03", "#E6501B", "#C3110C"]}
            animationSpeed={8}
            showBorder={false}
            className="text-5xl md:text-6xl font-black mb-4 tracking-tight"
          >
            Teko Daily Lunch
          </GradientText>
        </section>

        {/* Main Content Area */}
        <div className="container mx-auto">
          <OrderSelection />
        </div>
      </main>
    </div>
  );
}
