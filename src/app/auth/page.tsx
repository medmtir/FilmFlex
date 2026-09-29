"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
} from "lucide-react";
import FilmFlexLogo from "@/components/FilmFlexLogo";
import { loginUser, registerUser } from "@/lib/auth";
import { saveUser } from "@/lib/storage";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (mode === "login") {
      const res = loginUser(email, password);
      setLoading(false);
      if (res.success && res.user) {
        saveUser(res.user);
        setSuccessMsg("Connexion réussie ! Redirection...");
        setTimeout(() => {
          router.push("/");
        }, 600);
      } else {
        setError(res.error || "Email ou mot de passe incorrect.");
      }
    } else {
      if (!name.trim()) {
        setLoading(false);
        setError("Veuillez saisir votre nom et prénom.");
        return;
      }
      if (password.length < 6) {
        setLoading(false);
        setError("Le mot de passe doit comporter au moins 6 caractères.");
        return;
      }
      if (password !== confirmPassword) {
        setLoading(false);
        setError("Les mots de passe ne correspondent pas.");
        return;
      }

      const res = registerUser(email, password, name);
      setLoading(false);
      if (res.success && res.user) {
        saveUser(res.user);
        setSuccessMsg("Compte créé avec succès ! Bienvenue sur FilmFlex.");
        setTimeout(() => {
          router.push("/");
        }, 800);
      } else {
        setError(res.error || "Échec de l'inscription.");
      }
    }
  };

  // 1-Click Fast Demo Login Fillers
  const handleQuickDemo = (demoType: "admin" | "vip") => {
    if (demoType === "admin") {
      setEmail("admin@filmflex.tv");
      setPassword("admin123");
      setMode("login");
      setError(null);
    } else {
      setEmail("subscriber@filmflex.tv");
      setPassword("filmflex2026");
      setMode("login");
      setError(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-between selection:bg-[#E50914] selection:text-white overflow-hidden">
      {/* Cinematic Background Collage with Dark Gradient */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-sm scale-105 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1920&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/60 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-20 max-w-7xl mx-auto w-full px-6 py-6 sm:py-8 flex items-center justify-between">
        <Link href="/" className="hover:scale-105 transition-transform">
          <FilmFlexLogo size="lg" />
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-semibold transition-all border border-white/15 backdrop-blur-md cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au catalogue</span>
        </Link>
      </header>

      {/* Main Form Center Box */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-[#141416]/95 backdrop-blur-3xl border border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.95)] animate-scale-up">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {mode === "login" ? "Bon retour sur FilmFlex" : "Créer votre compte"}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              {mode === "login"
                ? "Connectez-vous pour profiter de tout le streaming en 4K"
                : "Rejoignez la communauté VIP FilmFlex en quelques secondes"}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex bg-[#1f1f23] p-1 rounded-xl mb-6 border border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === "login"
                  ? "bg-[#E50914] text-white shadow-lg shadow-red-950/60"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Connexion</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === "register"
                  ? "bg-[#E50914] text-white shadow-lg shadow-red-950/60"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>S&apos;inscrire</span>
            </button>
          </div>

          {/* Error & Success Alerts */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-[#E50914] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  Nom et prénom
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex. Mohamed Ali"
                    className="w-full bg-[#1b1b1e] border border-neutral-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E50914] transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Adresse Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full bg-[#1b1b1e] border border-neutral-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E50914] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300">
                  Mot de passe
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("vip")}
                    className="text-[11px] text-[#E50914] hover:underline cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1b1b1e] border border-neutral-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E50914] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-neutral-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  Confirmer le mot de passe
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-neutral-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#1b1b1e] border border-neutral-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E50914] transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white text-sm font-bold shadow-xl shadow-red-950/50 hover:shadow-red-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? "Vérification en cours..."
                : mode === "login"
                ? "Se connecter"
                : "Créer mon compte FilmFlex"}
            </button>
          </form>

          {/* Quick Demo Accounts Helper */}
          <div className="mt-6 pt-5 border-t border-neutral-800">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-center mb-2.5">
              Accès Rapide ⚡ (Comptes Démo)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo("vip")}
                className="py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Client VIP</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo("admin")}
                className="py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#E50914]" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 text-center py-6 text-xs text-neutral-500">
        <p>© 2026 FilmFlex. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
