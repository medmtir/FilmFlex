"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  ChevronDown,
  Lock,
  User,
  CreditCard,
  LogOut,
  ShieldCheck,
  LogIn,
  X,
  Smartphone,
  Settings,
  Globe,
} from "lucide-react";
import FilmFlexLogo from "./FilmFlexLogo";
import NotificationsDrawer from "./NotificationsDrawer";
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
  onSelectMovie?: (movieId: string) => void;
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
  onSelectMovie,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<"fr" | "ar" | "en">("fr");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    const saved = localStorage.getItem("filmflex_lang");
    if (saved === "ar" || saved === "en" || saved === "fr") {
      setCurrentLang(saved);
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const changeLanguage = (lang: "fr" | "ar" | "en") => {
    setCurrentLang(lang);
    localStorage.setItem("filmflex_lang", lang);
    setIsLangMenuOpen(false);
    window.dispatchEvent(new Event("filmflex_lang_changed"));
  };

  const navLinks = [
    { id: "home", label: currentLang === "ar" ? "الرئيسية" : currentLang === "en" ? "Home" : "Accueil" },
    { id: "movies", label: currentLang === "ar" ? "الأفلام" : currentLang === "en" ? "Movies" : "Films" },
    { id: "series", label: currentLang === "ar" ? "المسلسلات" : currentLang === "en" ? "TV Shows" : "Séries" },
    { id: "mylist", label: currentLang === "ar" ? "قائمتي" : currentLang === "en" ? "My List" : "Ma Liste" },
    { id: "turkish", label: currentLang === "ar" ? "تركي 🇹🇷" : "Turc 🇹🇷" },
    { id: "tunisien", label: currentLang === "ar" ? "تونسي 🇹🇳" : "Tunisien 🇹🇳" },
    { id: "anime", label: currentLang === "ar" ? "أنمي 🎌" : "Anime 🎌" },
  ];

  const remaining = user?.subscriptionExpiresAt
    ? getRemainingDays(user.subscriptionExpiresAt)
    : { days: 0, text: "Non abonné", expired: true };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out select-none ${
        isScrolled
          ? "bg-black/95 backdrop-blur-md border-b border-neutral-800/80 shadow-2xl"
          : "bg-gradient-to-b from-black/80 via-black/30 to-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-18 flex items-center justify-between gap-4">
        {/* Left Section: Logo & Nav Links */}
        <div className="flex items-center gap-6 lg:gap-8">
          <button
            onClick={() => onTabChange("home")}
            className="focus:outline-none flex items-center shrink-0 cursor-pointer hover:scale-105 transition-transform duration-300"
          >
            <FilmFlexLogo size="md" />
          </button>

          <nav className="hidden lg:flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onTabChange(link.id)}
                className={`transition-colors duration-200 font-medium cursor-pointer relative py-1 ${
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

        {/* Right Section: Exact Flixer Matching Layout (media_1790694030195.png) */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* 1. Sleek Search Button / Input */}
          <div className="relative flex items-center">
            {isSearchExpanded ? (
              <div className="flex items-center bg-[#1c1c1e] border border-neutral-700 rounded-full pl-3 pr-1 py-1 animate-scale-up shadow-lg">
                <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search movies, series..."
                  value={searchQuery}
                  autoFocus
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder-neutral-500 outline-none px-2 w-32 sm:w-48"
                />
                <button
                  onClick={() => {
                    setIsSearchExpanded(false);
                    onSearchChange("");
                  }}
                  className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchExpanded(true)}
                className="text-neutral-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Search"
                aria-label="Search"
              >
                <Search className="w-5 h-5 stroke-[2]" />
              </button>
            )}
          </div>

          {/* 2. Notification Bell with Tiny Red Dot matching Flixer */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative text-neutral-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 stroke-[2]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E50914]" />
          </button>

          {/* 3. Language Selector (FR / AR / EN) */}
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1 text-neutral-300 hover:text-white px-2.5 py-1 rounded-full hover:bg-white/10 text-xs font-bold transition-colors cursor-pointer border border-neutral-700/60"
              title="Changer de langue / Change language / تغيير اللغة"
            >
              <Globe className="w-3.5 h-3.5 text-[#E50914]" />
              <span className="uppercase text-[11px]">{currentLang}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isLangMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isLangMenuOpen && (
              <div
                onMouseLeave={() => setIsLangMenuOpen(false)}
                className="absolute right-0 top-9 w-36 bg-[#18181b]/98 backdrop-blur-2xl border border-neutral-800 rounded-xl shadow-2xl py-1.5 z-50 animate-scale-up text-xs"
              >
                <button
                  onClick={() => changeLanguage("fr")}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-neutral-800 transition-colors cursor-pointer ${
                    currentLang === "fr" ? "text-[#E50914] font-bold" : "text-neutral-300"
                  }`}
                >
                  <span>🇫🇷 Français</span>
                  {currentLang === "fr" && <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]" />}
                </button>
                <button
                  onClick={() => changeLanguage("ar")}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-neutral-800 transition-colors cursor-pointer ${
                    currentLang === "ar" ? "text-[#E50914] font-bold" : "text-neutral-300"
                  }`}
                >
                  <span>🇹🇳 العربية</span>
                  {currentLang === "ar" && <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]" />}
                </button>
                <button
                  onClick={() => changeLanguage("en")}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-neutral-800 transition-colors cursor-pointer ${
                    currentLang === "en" ? "text-[#E50914] font-bold" : "text-neutral-300"
                  }`}
                >
                  <span>🇺🇸 English</span>
                  {currentLang === "en" && <span className="w-1.5 h-1.5 rounded-full bg-[#E50914]" />}
                </button>
              </div>
            )}
          </div>

          {/* 3. Settings Gear */}
          <button
            onClick={() => {
              if (user) {
                setIsProfileMenuOpen(!isProfileMenuOpen);
              } else {
                onOpenAuthModal();
              }
            }}
            className="text-neutral-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer hidden sm:block"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 stroke-[2]" />
          </button>

          {/* 4. Flixer-style Red Sign In Button or User Avatar */}
          {!user ? (
            <Link
              href="/auth"
              className="px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-[#E50914] hover:bg-[#b80710] text-white transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            >
              Sign In
            </Link>
          ) : (
            /* Logged-In Mode: Avatar Dropdown */
            <div className="relative">
              <div
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#E50914] transition-all shadow-md">
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
                  className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-transform ${
                    isProfileMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Profile Popup Menu */}
              {isProfileMenuOpen && (
                <div
                  onMouseLeave={() => setIsProfileMenuOpen(false)}
                  className="absolute right-0 top-11 w-64 bg-[#18181b]/98 backdrop-blur-2xl border border-neutral-800 rounded-2xl shadow-2xl py-2 z-50 animate-scale-up"
                >
                  <div className="px-4 py-2.5 border-b border-neutral-800">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-neutral-400">Compte FilmFlex</p>
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
                      <span>{remaining.text}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    {/* Admin Dashboard Page Link */}
                    <Link
                      href="/admin"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="w-full px-4 py-2.5 text-left text-xs text-red-300 hover:text-white hover:bg-red-950/40 flex items-center gap-2.5 transition-colors font-semibold cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#E50914]" />
                      <span>Netflix Studio Admin (/admin)</span>
                    </Link>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenProfileGate();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/60 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#E50914]" />
                      <span>Changer de Profil</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenPaywall();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/60 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                      <span>Gérer mon Abonnement</span>
                    </button>

                    <Link
                      href="/auth"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/60 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogIn className="w-4 h-4 text-blue-400" />
                      <span>Changer de Compte</span>
                    </Link>

                    <a
                      href="/download"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/60 flex items-center gap-2.5 transition-colors cursor-pointer"
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
                      className="w-full px-4 py-2 text-left text-xs text-red-400 hover:text-red-300 hover:bg-neutral-800/60 flex items-center gap-2.5 transition-colors font-semibold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Links Row */}
      <div className="lg:hidden flex items-center gap-4 overflow-x-auto no-scrollbar px-4 py-2 bg-black/80 border-t border-neutral-800/60 text-xs">
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

      {/* Interactive Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onOpenPaymentModal={onOpenPaywall}
        onSelectMovie={onSelectMovie}
      />
    </header>
  );
}
