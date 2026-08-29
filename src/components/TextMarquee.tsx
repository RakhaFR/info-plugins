'use client';

import React from 'react';

interface TextMarqueeProps {
  items: string[];
}

export function TextMarquee({ items }: TextMarqueeProps) {
  if (!items || items.length === 0) return null;

  const row1 = [...items, ...items];
  const row2 = [...items].reverse().concat([...items].reverse());

  return (
    <section className="w-full overflow-hidden bg-[#0a0c10] border-y border-white/[0.06] py-8 sm:py-12 select-none space-y-3 sm:space-y-4">
      {/* Row 1: ke kanan */}
      <div className="flex whitespace-nowrap">
        <div className="flex items-center gap-6 sm:gap-10 shrink-0 font-display font-black text-3xl sm:text-5xl lg:text-6xl tracking-[-0.05em] uppercase text-white/90 animate-[marquee-right_50s_linear_infinite] will-change-transform">
          {row1.map((item, idx) => (
            <React.Fragment key={`r1-${idx}`}>
              <span className="hover:text-red-500 transition-colors cursor-default">{item}</span>
              <span className="text-red-500 opacity-70">•</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Row 2: ke kiri */}
      <div className="flex whitespace-nowrap">
        <div className="flex items-center gap-6 sm:gap-10 shrink-0 font-display font-black text-3xl sm:text-5xl lg:text-6xl tracking-[-0.05em] uppercase text-white/40 animate-[marquee-left_50s_linear_infinite] will-change-transform">
          {row2.map((item, idx) => (
            <React.Fragment key={`r2-${idx}`}>
              <span className="hover:text-lime-400 transition-colors cursor-default">{item}</span>
              <span className="text-lime-400 opacity-50">•</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
