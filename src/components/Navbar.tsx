"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  Lock,
  User,
  CreditCard,
  LogOut,
  Sparkles,
  ShieldCheck,
  LogIn,
  AlertCircle,
  X,
  Smartphone,
} from "lucide-react";
import FilmFlexLogo from "./FilmFlexLogo";
import { Profile, UserAccount } from "@/types";
import { getRemainingDays } from "@/lib/auth";

interface NavbarProps {
  user: UserAccount | null;
  activeProfile: Profile | null;
  onOpenProfileGate: () => void;
  onOpenPaywall: () => void;
  onOpenAdminDashboard: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Navbar({
  user,
  activeProfile,
  onOpenProfileGate,
  onOpenPaywall,
  onOpenAdminDashboard,
  onOpenAuthModal,
  onLogout,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { id: "home", label: "Home" },
    { id: "series", label: "TV Shows" },
    { id: "movies", label: "Movies" },
    { id: "anime", label: "Anime 🎌" },
    { id: "tunisien", label: "Tunisien 🇹🇳" },
    { id: "popular", label: "New & Popular" },
    { id: "mylist", label: "My List" },
  ];

  const remaining = user?.subscriptionExpiresAt
    ? getRemainingDays(user.subscriptionExpiresAt)
    : { days: 0, text: "Non abonné", expired: true };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 select-none ${
        isScrolled
          ? "bg-[#0e0e12]/95 backdrop-blur-md shadow-lg border-b border-neutral-800/80"
          : "bg-gradient-to-b from-black/90 via-black/50 to-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-4">
        {/* Left Section: Logo & Nav Links */}
        <div className="flex items-center gap-6 lg:gap-8">
          <button
            onClick={() => onTabChange("home")}
            className="focus:outline-none flex items-center shrink-0 cursor-pointer"
          >
            <FilmFlexLogo size="md" />
          </button>

          <nav className="hidden lg:flex items-center gap-5 text-sm">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onTabChange(link.id)}
                className={`transition-colors font-medium cursor-pointer ${
                  activeTab === link.id
                    ? "text-white font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Section: Image 2 Pill Search, Notification Bell, User Avatar / Login */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Sleek Pill Search Bar (Matching Image 2 with red round search button) */}
          <div className="relative flex items-center bg-white/10 hover:bg-white/15 focus-within:bg-black/80 focus-within:border-white/40 border border-white/15 rounded-full pl-3.5 pr-1 py-1 transition-all">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent text-xs md:text-sm text-white placeholder-neutral-400 outline-none w-24 sm:w-44 md:w-56"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="p-1 text-neutral-400 hover:text-white mr-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#E50914] text-white flex items-center justify-center shrink-0 shadow-md">
              <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
            </div>
          </div>

          {/* Admin Dashboard Quick Button if User is Admin */}
          {user?.role === "admin" && (
            <button
              onClick={onOpenAdminDashboard}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-950/80 hover:bg-red-900 border border-red-600/70 text-red-300 transition-all shadow-lg hover:scale-105 cursor-pointer"
              title="Ouvrir le tableau de bord Administrateur"
            >
              <ShieldCheck className="w-4 h-4 text-[#E50914]" />
              <span>Admin Dashboard</span>
            </button>
          )}

          {/* App Android Button */}
          <a
            href="/download"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/15 text-neutral-200 hover:text-white transition-all shadow-md hover:scale-105 cursor-pointer"
            title="Télécharger l'application Android FilmFlex (.apk)"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#E50914]" />
            <span className="hidden md:inline">App Android</span>
            <span className="md:hidden">APK</span>
          </a>

          {/* Notifications Bell */}
          <button
            className="text-neutral-300 hover:text-white transition-colors p-1.5 hidden sm:block cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>

          {/* User Account / Profile or Guest Login Button */}
          {!user ? (
            /* Guest Mode: Red Pill Connexion Button */
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-bold bg-[#E50914] hover:bg-[#b80710] text-white transition-all shadow-md shadow-[#E50914]/40 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connexion</span>
            </button>
          ) : (
            /* Logged-In Mode: Avatar Dropdown */
            <div className="relative">
              <div
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#E50914] transition-all shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeProfile?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80"}
                    alt={activeProfile?.name || user.name || "User"}
                    className="w-full h-full object-cover"
                  />
                  {activeProfile?.pinCode && (
                    <div className="absolute bottom-0 right-0 bg-black/90 p-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-neutral-300 group-hover:text-white transition-transform ${
                    isProfileMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Profile Popup Menu */}
              {isProfileMenuOpen && (
                <div
                  onMouseLeave={() => setIsProfileMenuOpen(false)}
                  className="absolute right-0 top-12 w-64 bg-[#181818]/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-2xl py-2 z-50 animate-scale-up"
                >
                  <div className="px-4 py-2.5 border-b border-neutral-800">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-neutral-400">Connecté en tant que</p>
                      {user.role === "admin" && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 font-bold border border-red-800">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white truncate">{user.name || activeProfile?.name || "Client FilmFlex"}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                    <div className="mt-1 text-[10px] text-neutral-300 flex items-center gap-1 font-mono">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.isSubscribed ? "bg-emerald-400" : "bg-red-400"
                        }`}
                      />
                      <span>{remaining.text} (Max 2 Écrans)</span>
                    </div>
                  </div>

                  <div className="py-1">
                    {/* Admin Dashboard Option */}
                    {user.role === "admin" && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenAdminDashboard();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs text-red-300 hover:text-white hover:bg-red-950/40 flex items-center gap-2.5 transition-colors font-semibold"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#E50914]" />
                        <span>Gestion des Abonnés (Admin)</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenProfileGate();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/60 flex items-center gap-2.5 transition-colors"
                    >
                      <User className="w-4 h-4 text-[#E50914]" />
                      <span>Changer de Profil (Max 2)</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenPaywall();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/60 flex items-center gap-2.5 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                      <span>Gérer mon Abonnement</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenAuthModal();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/60 flex items-center gap-2.5 transition-colors"
                    >
                      <LogIn className="w-4 h-4 text-blue-400" />
                      <span>Changer de Compte</span>
                    </button>

                    <a
                      href="/download"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/60 flex items-center gap-2.5 transition-colors"
                    >
                      <Smartphone className="w-4 h-4 text-[#E50914]" />
                      <span>Télécharger l&apos;App Android (.apk)</span>
                    </a>
                  </div>

                  {/* Clean Logout (Se déconnecter) */}
                  <div className="border-t border-neutral-800 pt-1">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-red-400 hover:text-red-300 hover:bg-neutral-800/60 flex items-center gap-2.5 transition-colors font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Se déconnecter (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Links Row */}
      <div className="lg:hidden flex items-center gap-4 overflow-x-auto no-scrollbar px-4 py-2 bg-black/60 border-t border-neutral-800/60 text-xs">
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => onTabChange(link.id)}
            className={`whitespace-nowrap px-2 py-1 rounded transition-colors ${
              activeTab === link.id
                ? "text-white font-bold bg-white/10"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </header>
  );
}
