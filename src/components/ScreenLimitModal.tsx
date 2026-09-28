"use client";

import React from "react";
import { MonitorX, X, RefreshCw, ShieldAlert } from "lucide-react";
import FilmFlexLogo from "./FilmFlexLogo";

interface ScreenLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  activeCount: number;
  maxScreens: number;
}

export default function ScreenLimitModal({
  isOpen,
  onClose,
  onRetry,
  activeCount,
  maxScreens,
}: ScreenLimitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#181818] rounded-xl border border-neutral-800 shadow-2xl overflow-hidden text-white p-6 sm:p-8 text-center animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Logo */}
        <div className="flex justify-center mb-4">
          <FilmFlexLogo size="md" />
        </div>

        <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-600/40 flex items-center justify-center mx-auto mb-4 text-[#E50914] shadow-lg shadow-red-900/20">
          <MonitorX className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30 mb-3">
          <ShieldAlert className="w-3.5 h-3.5" /> Limite d&apos;écrans atteinte ({activeCount}/{maxScreens})
        </span>

        <h2 className="text-xl sm:text-2xl font-black mb-2">
          Trop d&apos;appareils regardent en même temps
        </h2>

        <p className="text-neutral-300 text-sm leading-relaxed mb-6">
          Votre compte FilmFlex permet de regarder sur un maximum de{" "}
          <strong className="text-white">{maxScreens} écrans simultanés</strong>. Deux appareils sont actuellement en train de lire une vidéo.
        </p>

        <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-400 text-left space-y-1 mb-6">
          <p className="font-semibold text-neutral-200">Pour continuer à regarder :</p>
          <p>1. Arrêtez la lecture sur votre autre appareil ou fermez l&apos;autre onglet.</p>
          <p>2. Cliquez ensuite sur &quot;Réessayer&quot; ci-dessous.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRetry}
            className="flex-1 py-3 px-4 rounded-lg bg-[#E50914] hover:bg-[#b81d24] text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réessayer</span>
          </button>
          <button
            onClick={onClose}
            className="py-3 px-6 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-sm transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
