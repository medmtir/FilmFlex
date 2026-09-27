"use client";

import React from "react";
import Image from "next/image";

interface FilmFlexLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function FilmFlexLogo({
  className = "",
  iconOnly = false,
  size = "md",
}: FilmFlexLogoProps) {
  const heightClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
    xl: "h-16",
  };

  if (iconOnly) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-xl bg-black border border-neutral-800 p-1.5 shadow-lg overflow-hidden ${className}`}
      >
        <div className="relative w-8 h-8 flex items-center justify-center">
          {/* F shape with inner Play arrow */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M20 15 H80 V32 H42 V46 H70 V62 H42 V90 H20 Z"
              fill="white"
            />
            {/* Red Play triangle */}
            <polygon points="36,26 62,39 36,52" fill="#E50914" />
            {/* Red brush swoosh */}
            <path
              d="M15 88 Q 50 78 85 92 Q 50 84 15 88"
              fill="#E50914"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center select-none ${heightClasses[size]} ${className}`}>
      {/* High-res Image of the Logo with smooth fallback */}
      <div className="relative flex items-center h-full">
        {/* Crisp vector logo replica */}
        <div className="flex items-center font-black tracking-tighter text-white">
          <div className="relative flex items-center">
            {/* Stylized 'F' with red play button inside */}
            <div className="relative mr-0.5 w-7 h-8 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_2px_8px_rgba(229,9,20,0.4)]">
                <path
                  d="M15 12 H82 V30 H38 V48 H72 V64 H38 V92 H15 Z"
                  fill="white"
                />
                <polygon points="32,24 62,38 32,52" fill="#E50914" />
              </svg>
            </div>
            {/* Sliced letters text: ilmFlex */}
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-300 bg-clip-text text-transparent">
              ilm<span className="text-white">Flex</span>
            </span>
          </div>
        </div>
        {/* Red swoosh underline */}
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E50914] to-transparent rounded-full shadow-[0_0_10px_#E50914]" />
      </div>
    </div>
  );
}
