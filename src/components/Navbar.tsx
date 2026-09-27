"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Bell, ChevronDown, Lock, CheckCircle2, User, CreditCard, LogOut, Sparkles } from "lucide-react";
import FilmFlexLogo from "./FilmFlexLogo";
import { Profile, UserAccount } from "@/types";

interface NavbarProps {
  user: UserAccount;
  activeProfile: Profile;
  onOpenProfileGate: () => void;
  onOpenPaywall: () => void;
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
    { id: "home", label: "Home" },
    { id: "movies", label: "Movies" },
    { id: "series", label: "TV Shows" },
    { id: "popular", label: "New & Popular" },
    { id: "mylist", label: "My List" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-400 select-none ${
        isScrolled
          ? "bg-[#141414]/95 backdrop-blur-md shadow-lg border-b border-neutral-900"
          : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
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

        {/* Right Section: Search, Subscription Badge, Profile Menu */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Animated Search Box */}
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <div className="flex items-center bg-black/80 border border-white/60 rounded px-2.5 py-1 animate-fade-in">
                <Search className="w-4 h-4 text-neutral-400 mr-2" />
                <input
                  type="text"
                  placeholder="Titles, people, genres..."
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

          {/* Subscription VIP Pill */}
          {user.isSubscribed ? (
            <div
              onClick={onOpenPaywall}
              className="cursor-pointer hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E50914]/20 border border-[#E50914]/40 text-white hover:bg-[#E50914]/30 transition-all shadow-[0_0_10px_rgba(229,9,20,0.2)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E50914]" />
              <span>VIP 4K</span>
            </div>
          ) : (
            <button
              onClick={onOpenPaywall}
              className="px-3 py-1 bg-[#E50914] hover:bg-[#b81d24] text-white text-xs font-bold rounded uppercase tracking-wider transition-colors shadow-md shadow-[#E50914]/30"
            >
              S&apos;abonner
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
                className="absolute right-0 top-12 w-56 bg-[#181818]/95 backdrop-blur-md border border-neutral-800 rounded-lg shadow-2xl py-2 z-50 animate-scale-up"
              >
                <div className="px-4 py-2 border-b border-neutral-800">
                  <p className="text-xs text-neutral-400">Signed in as</p>
                  <p className="text-sm font-semibold text-white truncate">{activeProfile.name}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenProfileGate();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/60 flex items-center gap-2.5 transition-colors"
                  >
                    <User className="w-4 h-4 text-[#E50914]" />
                    <span>Switch Profiles (Max 2)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenPaywall();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/60 flex items-center gap-2.5 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    <span>Manage Subscription</span>
                  </button>
                </div>

                <div className="border-t border-neutral-800 pt-1">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenProfileGate();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs text-neutral-400 hover:text-white hover:bg-neutral-800/60 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of FilmFlex</span>
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
