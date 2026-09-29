"use client";

import React, { useState, useEffect } from "react";

export default function FlixerSplash({ onFinish }: { onFinish?: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Only show once per browser session
    const hasSeenSplash = sessionStorage.getItem("filmflex_splash_seen");
    if (hasSeenSplash) {
      setIsVisible(false);
      onFinish?.();
      return;
    }

    sessionStorage.setItem("filmflex_splash_seen", "true");

    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 1600);

    const removeTimer = setTimeout(() => {
      setIsVisible(false);
      onFinish?.();
    }, 2200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-black flex items-center justify-center select-none transition-opacity duration-700 ease-out pointer-events-none ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Background Soft Red Radial Glow */}
      <div className="absolute w-[450px] h-[300px] rounded-full bg-[#E50914]/15 blur-[120px] pointer-events-none animate-pulse" />

      {/* Center Cinematic Flixer-style Logo */}
      <div className="relative flex flex-col items-center justify-center animate-scale-up">
        <h1
          className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter text-[#E50914] select-none uppercase drop-shadow-[0_0_35px_rgba(229,9,20,0.8)]"
          style={{
            fontFamily: "Impact, 'Bebas Neue', 'Arial Black', sans-serif",
            letterSpacing: "0.04em",
            transform: "scaleY(1.08)",
          }}
        >
          FILMFLEX
        </h1>
      </div>

      {/* Bottom Left: Flixer-style Build Stamp matching media_1790694005196.png */}
      <div className="absolute bottom-6 left-6 flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-neutral-400">
        <span className="w-2 h-2 rounded-full bg-[#E50914] animate-ping" />
        <span className="text-neutral-300 font-semibold">BUILD 0929-1602</span>
      </div>
    </div>
  );
}
