"use client";

import React from "react";
import { Home, Sparkles, Clapperboard, Film, User, LogIn } from "lucide-react";
import { UserAccount } from "@/types";

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: UserAccount | null;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
}

export default function MobileBottomNav({
  activeTab,
  onTabChange,
  user,
  onOpenProfile,
  onOpenAuth,
}: MobileBottomNavProps) {
  const tabs = [
    {
      id: "home",
      label: "Accueil",
      icon: Home,
    },
    {
      id: "anime",
      label: "Animés 🎌",
      icon: Sparkles,
      badge: "Anime",
    },
    {
      id: "tunisien",
      label: "Tunisien 🇹🇳",
      icon: Clapperboard,
      badge: "TN",
    },
    {
      id: "movies",
      label: "Films",
      icon: Film,
    },
  ];

  return (
    <nav
      aria-label="Navigation Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e0e12]/95 backdrop-blur-2xl border-t border-neutral-800/90 px-2 py-1.5 flex items-center justify-around select-none shadow-[0_-10px_30px_rgba(0,0,0,0.8)] pb-[max(0.375rem,env(safe-area-inset-bottom))]"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
              isActive
                ? "text-[#E50914] font-bold scale-105"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E50914] shadow-[0_0_8px_#E50914]" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1 truncate max-w-[64px]">
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* Account / Login Tab */}
      <button
        onClick={() => {
          if (user) {
            onOpenProfile();
          } else {
            onOpenAuth();
          }
        }}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all text-neutral-400 hover:text-white cursor-pointer"
      >
        {user ? (
          <div className="w-5 h-5 rounded-full bg-[#E50914] flex items-center justify-center text-[10px] font-black text-white shadow">
            {user.name ? user.name[0].toUpperCase() : "U"}
          </div>
        ) : (
          <LogIn className="w-5 h-5 stroke-[1.8]" />
        )}
        <span className="text-[10px] tracking-tight mt-1 truncate max-w-[64px]">
          {user ? "Compte" : "Connexion"}
        </span>
      </button>
    </nav>
  );
}
