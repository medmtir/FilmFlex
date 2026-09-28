"use client";

import React, { useState } from "react";
import { X, Lock, Mail, User, ShieldCheck, Sparkles, LogIn, UserPlus, Check } from "lucide-react";
import FilmFlexLogo from "./FilmFlexLogo";
import { UserAccount } from "@/types";
import { loginUser, registerUser } from "@/lib/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
  initialMode?: "login" | "register";
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "login") {
      const res = loginUser(email, password);
      setLoading(false);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.error || "Échec de la connexion.");
      }
    } else {
      if (!name.trim()) {
        setLoading(false);
        setError("Veuillez saisir votre nom.");
        return;
      }
      if (password.length < 6) {
        setLoading(false);
        setError("Le mot de passe doit comporter au moins 6 caractères.");
        return;
      }
      const res = registerUser(email, password, name);
      setLoading(false);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.error || "Échec de l'inscription.");
      }
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    const res = loginUser(demoEmail, demoPass);
    if (res.success && res.user) {
      onSuccess(res.user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="relative w-full max-w-md bg-[#141414] rounded-2xl border border-neutral-800 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden text-white p-6 sm:p-8 animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <FilmFlexLogo size="lg" />
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-neutral-900 p-1 rounded-xl mb-6 border border-neutral-800">
          <button
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === "login"
                ? "bg-[#E50914] text-white shadow-md shadow-red-950"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Se connecter</span>
          </button>
          <button
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === "register"
                ? "bg-[#E50914] text-white shadow-md shadow-red-950"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>S&apos;inscrire</span>
          </button>
        </div>

        <h2 className="text-xl font-bold mb-1">
          {mode === "login" ? "Accédez à votre compte" : "Créer votre compte FilmFlex"}
        </h2>
        <p className="text-xs text-neutral-400 mb-5">
          {mode === "login"
            ? "Regardez vos films et séries préférés en 4K Ultra HD."
            : "Inscrivez-vous pour profiter d'un accès VIP sans engagement."}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/70 border border-red-800/80 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Nom complet
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Mohamed Ali"
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E50914] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E50914] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E50914] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#E50914] hover:bg-[#b81d24] text-white font-bold text-sm transition-all shadow-lg shadow-red-950/40 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span>Patientez...</span>
            ) : mode === "login" ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Se connecter</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Créer mon compte VIP</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        {mode === "login" && (
          <div className="mt-6 pt-5 border-t border-neutral-800">
            <p className="text-[11px] font-bold text-neutral-400 mb-2 uppercase tracking-wider">
              Comptes Démo Rapides :
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@filmflex.tv", "admin123")}
                className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-left transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#E50914]" />
                  <span>Admin FilmFlex</span>
                </div>
                <div className="text-[10px] text-neutral-400 truncate">admin@filmflex.tv</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("subscriber@filmflex.tv", "filmflex2026")}
                className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-left transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Client VIP</span>
                </div>
                <div className="text-[10px] text-neutral-400 truncate">subscriber@filmflex.tv</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
