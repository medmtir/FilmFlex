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
} from "lucide-react";
import FilmFlexLogo from "./FilmFlexLogo";
import { Profile, UserAccount } from "@/types";
import { getRemainingDays } from "@/lib/auth";

interface NavbarProps {
  user: UserAccount;
  activeProfile: Profile;
  onOpenProfileGate: () => void;
  onOpenPaywall: () => void;
  onOpenAdminDashboard: () => void;
  onOpenAuthModal: () => void;
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
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { id: "home", label: "Accueil" },
    { id: "movies", label: "Films" },
    { id: "series", label: "Séries" },
    { id: "popular", label: "Nouveautés & Populaires" },
    { id: "mylist", label: "Ma Liste" },
  ];

  const remaining = getRemainingDays(user.subscriptionExpiresAt);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-400 select-none ${
        isScrolled
          ? "bg-[#141414]/95 backdrop-blur-md shadow-lg border-b border-neutral-900"
          : "bg-gradient-to-b from-black/85 via-black/45 to-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
        {/* Left Section: Logo & Nav Links */}
        <div className="flex items-center gap-6 md:gap-10">
          <button
            onClick={() => onTabChange("home")}
            className="focus:outline-none flex items-center"
          >
            <FilmFlexLogo size="md" />
          </button>

          <nav className="hidden md:flex items-center gap-5 text-sm">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onTabChange(link.id)}
                className={`transition-colors font-medium ${
                  activeTab === link.id
                    ? "text-white font-bold"
                    : "text-neutral-300 hover:text-white"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Section: Search, Admin Button, Subscription Badge, Profile Menu */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Animated Search Box */}
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <div className="flex items-center bg-black/80 border border-white/60 rounded px-2.5 py-1 animate-fade-in">
                <Search className="w-4 h-4 text-neutral-400 mr-2" />
                <input
                  type="text"
                  placeholder="Titres, acteurs, genres..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoFocus
                  onBlur={() => {
                    if (!searchQuery) setIsSearchOpen(false);
                  }}
                  className="bg-transparent text-sm text-white placeholder-neutral-500 outline-none w-36 md:w-56"
                />
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-white hover:text-neutral-300 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Admin Dashboard Quick Button if User is Admin */}
          {user.role === "admin" && (
            <button
              onClick={onOpenAdminDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-950/80 hover:bg-red-900 border border-red-600/70 text-red-300 transition-all shadow-lg hover:scale-105"
              title="Ouvrir le tableau de bord Administrateur"
            >
              <ShieldCheck className="w-4 h-4 text-[#E50914]" />
              <span className="hidden sm:inline">Admin Dashboard</span>
              <span className="sm:hidden">Admin</span>
            </button>
          )}

          {/* Subscription Status Pill */}
          {user.role === "admin" ? (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/40 border border-purple-700/50 text-purple-300">
              <span>ADMIN VIP</span>
            </div>
          ) : user.isSubscribed ? (
            <div
              onClick={onOpenPaywall}
              className="cursor-pointer hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E50914]/20 border border-[#E50914]/40 text-white hover:bg-[#E50914]/30 transition-all shadow-[0_0_10px_rgba(229,9,20,0.2)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
              <span>VIP ({remaining.days}j)</span>
            </div>
          ) : (
            <button
              onClick={onOpenPaywall}
              className="px-3 py-1 bg-[#E50914] hover:bg-[#b81d24] text-white text-xs font-bold rounded uppercase tracking-wider transition-colors shadow-md shadow-[#E50914]/30 flex items-center gap-1"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>S&apos;abonner</span>
            </button>
          )}

          {/* Notifications Bell */}
          <button className="text-white hover:text-neutral-300 transition-colors hidden sm:block">
            <Bell className="w-5 h-5" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <div
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="relative w-8 h-8 rounded overflow-hidden border border-transparent group-hover:border-white transition-all">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeProfile.avatar}
                  alt={activeProfile.name}
                  className="w-full h-full object-cover"
                />
                {activeProfile.pinCode && (
                  <div className="absolute bottom-0 right-0 bg-black/90 p-0.5 rounded-tl">
                    <Lock className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-white transition-transform ${
                  isProfileMenuOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {/* Profile Popup Menu */}
            {isProfileMenuOpen && (
              <div
                onMouseLeave={() => setIsProfileMenuOpen(false)}
                className="absolute right-0 top-12 w-64 bg-[#181818]/95 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl py-2 z-50 animate-scale-up"
              >
                <div className="px-4 py-2 border-b border-neutral-800">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-400">Connecté en tant que</p>
                    {user.role === "admin" && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 font-bold border border-red-800">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{user.name || activeProfile.name}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                  <div className="mt-1 text-[10px] text-neutral-400 flex items-center gap-1 font-mono">
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
                    <span>Changer de Compte / Connexion</span>
                  </button>
                </div>

                <div className="border-t border-neutral-800 pt-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-neutral-400 hover:text-white hover:bg-neutral-800/60 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
