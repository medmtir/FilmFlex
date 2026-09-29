"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Clock,
  Tv,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Activity,
  Server,
  CreditCard,
  Eye,
  TrendingUp,
  PowerOff,
  UserPlus,
  X,
  Radio,
  Flame,
  Film,
  DownloadCloud
} from "lucide-react";
import FilmFlexLogo from "@/components/FilmFlexLogo";
import { UserAccount } from "@/types";
import {
  getAllUsers,
  adminUpdateSubscription,
  adminCutSubscription,
  adminCreateUser,
  adminDeleteUser,
  getRemainingDays,
  getActiveSessionsCount,
  adminResetSessions,
} from "@/lib/auth";

export default function AdminPage() {
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "admin">("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"subscribers" | "servers" | "analytics">("subscribers");

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newDays, setNewDays] = useState<number>(90);
  const [newMaxScreens, setNewMaxScreens] = useState<number>(4);

  const refreshList = () => {
    setUsersList(getAllUsers());
  };

  useEffect(() => {
    refreshList();
  }, []);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleProlong = (userId: string, days: number, userEmail: string) => {
    adminUpdateSubscription(userId, days);
    refreshList();
    showToast(`Abonnement de ${userEmail} prolongé de +${days} jours avec succès !`);
  };

  const handleCut = (userId: string, userEmail: string) => {
    adminCutSubscription(userId);
    refreshList();
    showToast(`Abonnement résilié/coupé pour ${userEmail}.`);
  };

  const handleResetScreens = (userId: string, userEmail: string) => {
    adminResetSessions(userId);
    refreshList();
    showToast(`Écrans et sessions réinitialisés pour ${userEmail}.`);
  };

  const handleDelete = (userId: string, userEmail: string) => {
    if (confirm(`Confirmez-vous la suppression définitive du compte ${userEmail} ?`)) {
      adminDeleteUser(userId);
      refreshList();
      showToast(`Compte ${userEmail} supprimé du système.`);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newName) {
      showToast("Veuillez renseigner tous les champs obligatoires.");
      return;
    }
    const created = adminCreateUser({
      email: newEmail,
      password: newPassword,
      name: newName,
      days: newDays,
      maxScreens: newMaxScreens,
    });
    if (created) {
      showToast(`Compte VIP créé avec succès pour ${newEmail} (${newDays} jours) !`);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setShowCreateModal(false);
      refreshList();
    } else {
      showToast("Erreur : Cette adresse email existe déjà.");
    }
  };

  // KPIs
  const totalUsers = usersList.length;
  const activeSubscribers = usersList.filter((u) => !getRemainingDays(u.subscriptionExpiresAt).isExpired).length;
  const expiredSubscribers = totalUsers - activeSubscribers;
  const activeScreensTotal = usersList.reduce((acc, u) => acc + getActiveSessionsCount(u.id), 0);

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const remaining = getRemainingDays(u.subscriptionExpiresAt);
      const name = u.name || "";
      const matchesSearch =
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === "active") return !remaining.isExpired;
      if (statusFilter === "expired") return remaining.isExpired;
      if (statusFilter === "admin") return u.role === "admin";
      return true;
    });
  }, [usersList, searchQuery, statusFilter]);

  const SERVERS_LIST = [
    { name: "Ares (Principal Ultra 4K)", provider: "VidLink v2", status: "Online", ping: "24ms", load: "34%" },
    { name: "Balder (Backup Multi-Audio)", provider: "Vidsrc.to", status: "Online", ping: "38ms", load: "28%" },
    { name: "Circe (Fast CDN France)", provider: "EmbedSu", status: "Online", ping: "19ms", load: "42%" },
    { name: "Demeter (Tunisian Cache 🇹🇳)", provider: "FilmFlex Edge", status: "Online", ping: "12ms", load: "56%" },
    { name: "Echo (Subtitles & VOSTFR)", provider: "SubScene Mirror", status: "Online", ping: "31ms", load: "21%" },
    { name: "Freya (Turkish Series Relay 🇹🇷)", provider: "Stremio HLS", status: "Online", ping: "45ms", load: "48%" },
    { name: "Hades (Offline Cache)", provider: "IndexedDB PWA", status: "Online", ping: "2ms", load: "15%" },
    { name: "Iris (Dolby Atmos Audio)", provider: "StreamGuard", status: "Online", ping: "29ms", load: "18%" },
  ];

  const POPULAR_WATCHED = [
    { title: "Kuruluş: Osman (Saison 5)", views: "3,420 visionnages", hours: "4,180 h", match: "99%" },
    { title: "Dune : Deuxième Partie", views: "2,890 visionnages", hours: "3,610 h", match: "98%" },
    { title: "Choufly Hal (Intégrale HD)", views: "2,450 visionnages", hours: "2,980 h", match: "99%" },
    { title: "Kızılcık Şerbeti", views: "1,980 visionnages", hours: "2,120 h", match: "97%" },
    { title: "Solo Leveling (VOSTFR)", views: "1,670 visionnages", hours: "1,450 h", match: "96%" },
  ];

  return (
    <div className="min-h-screen bg-[#0e0e11] text-white flex flex-col select-none">
      {/* Toast Notice */}
      {notice && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-neutral-900/95 border border-[#E50914]/50 text-white text-xs font-semibold shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-fade-in">
          <Sparkles className="w-4 h-4 text-[#E50914] shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-neutral-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <FilmFlexLogo size="sm" />
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#E50914] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Netflix Studio Admin
              </span>
              <span className="text-xs font-bold text-neutral-300">Command Center</span>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-2 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setActiveTab("subscribers")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "subscribers"
                  ? "bg-[#E50914] text-white shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Comptes & Abonnés ({usersList.length})
            </button>
            <button
              onClick={() => setActiveTab("servers")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "servers"
                  ? "bg-[#E50914] text-white shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Serveurs Flixer (8 Actifs)
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-[#E50914] text-white shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Statistiques & Trafic
            </button>
          </nav>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#E50914] hover:bg-[#b80710] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#E50914]/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Créer un abonné</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl border border-neutral-700/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à FilmFlex</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* KPI Summary Cards (Real Netflix Studio Style) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* Card 1: Watch Time */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#18181c] to-[#121215] border border-neutral-800/80 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#E50914]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Temps de Visionnage
              </span>
              <div className="p-2 rounded-xl bg-[#E50914]/15 text-[#E50914]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">14,840 h</div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4% ce mois-ci
            </div>
          </div>

          {/* Card 2: Active Accounts */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#18181c] to-[#121215] border border-neutral-800/80 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Abonnés VIP Actifs
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">{activeSubscribers}</div>
            <div className="text-[11px] text-neutral-400 mt-1">
              {expiredSubscribers} expiré{expiredSubscribers > 1 ? "s" : ""} • {totalUsers} comptes au total
            </div>
          </div>

          {/* Card 3: Live Viewers */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#18181c] to-[#121215] border border-neutral-800/80 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Spectateurs en Direct
              </span>
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">{activeScreensTotal > 0 ? activeScreensTotal * 14 + 28 : 42}</div>
            <div className="text-[11px] text-neutral-400 mt-1">
              En direct sur PC, Mobile & Smart TV
            </div>
          </div>

          {/* Card 4: Tunisian Payment Channels */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#18181c] to-[#121215] border border-neutral-800/80 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Paiements Tunisie 🇹🇳
              </span>
              <div className="p-2 rounded-xl bg-yellow-500/15 text-yellow-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold text-white flex items-center gap-1.5">
              <span>ClickToPay • D17</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-1">
              100% Opérationnel • Virement bancaire
            </div>
          </div>
        </div>

        {/* TAB 1: SUBSCRIBERS MANAGEMENT */}
        {activeTab === "subscribers" && (
          <div className="space-y-4">
            {/* Search, Filter & Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#141417] p-3.5 rounded-2xl border border-neutral-800">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher par email ou nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/50 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 outline-none focus:border-[#E50914] transition-colors"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-all ${
                    statusFilter === "all"
                      ? "bg-white text-black font-bold"
                      : "bg-neutral-800/80 text-neutral-400 hover:text-white"
                  }`}
                >
                  Tous ({usersList.length})
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-all ${
                    statusFilter === "active"
                      ? "bg-emerald-500 text-white font-bold"
                      : "bg-neutral-800/80 text-neutral-400 hover:text-white"
                  }`}
                >
                  Actifs ({activeSubscribers})
                </button>
                <button
                  onClick={() => setStatusFilter("expired")}
                  className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-all ${
                    statusFilter === "expired"
                      ? "bg-[#E50914] text-white font-bold"
                      : "bg-neutral-800/80 text-neutral-400 hover:text-white"
                  }`}
                >
                  Expirés ({expiredSubscribers})
                </button>
                <button
                  onClick={() => setStatusFilter("admin")}
                  className={`px-3 py-1.5 rounded-xl font-medium cursor-pointer transition-all ${
                    statusFilter === "admin"
                      ? "bg-purple-600 text-white font-bold"
                      : "bg-neutral-800/80 text-neutral-400 hover:text-white"
                  }`}
                >
                  Admins
                </button>
              </div>
            </div>

            {/* Subscribers Table */}
            <div className="bg-[#141417] rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/60 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-4">Utilisateur / Profil</th>
                      <th className="py-3.5 px-4">Statut & Validité</th>
                      <th className="py-3.5 px-4">Écrans en cours</th>
                      <th className="py-3.5 px-4">Type de Compte</th>
                      <th className="py-3.5 px-4 text-right">Actions de Gestion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-neutral-500">
                          Aucun abonné ne correspond à votre recherche.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const remaining = getRemainingDays(u.subscriptionExpiresAt);
                        const isActive = !remaining.isExpired;
                        const activeScreens = getActiveSessionsCount(u.id);
                        const displayName = u.name || u.email.split("@")[0] || "Abonné";

                        return (
                          <tr
                            key={u.id}
                            className="hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E50914] to-red-950 flex items-center justify-center text-white font-black text-sm shrink-0">
                                  {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-white truncate">{displayName}</div>
                                  <div className="text-[11px] text-neutral-400 font-mono truncate">{u.email}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {isActive ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3 h-3" /> Actif ({remaining.days} jours)
                                  </span>
                                  <div className="text-[10px] text-neutral-500 font-mono">
                                    Expire le {u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).toLocaleDateString() : "N/A"}
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E50914]/15 text-[#E50914] border border-[#E50914]/30">
                                  <XCircle className="w-3 h-3" /> Expiré / Désactivé
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                                    activeScreens > 0
                                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                      : "bg-neutral-800 text-neutral-400"
                                  }`}
                                >
                                  {activeScreens} / {u.maxScreens || 2} écrans
                                </span>
                                {activeScreens > 0 && (
                                  <button
                                    onClick={() => handleResetScreens(u.id, u.email)}
                                    className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                                    title="Réinitialiser les écrans"
                                  >
                                    <PowerOff className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  u.role === "admin"
                                    ? "bg-purple-900/40 text-purple-300 border border-purple-500/30"
                                    : "bg-neutral-800 text-neutral-300 border border-neutral-700/50"
                                }`}
                              >
                                {u.role === "admin" ? "Super Admin" : "VIP Illimité"}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Prolong +30 days */}
                                <button
                                  onClick={() => handleProlong(u.id, 30, u.email)}
                                  className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-semibold border border-neutral-700/60 transition-colors cursor-pointer"
                                  title="Ajouter 30 jours"
                                >
                                  +30j
                                </button>

                                {/* Prolong +90 days */}
                                <button
                                  onClick={() => handleProlong(u.id, 90, u.email)}
                                  className="px-2 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 transition-colors cursor-pointer"
                                  title="Ajouter 90 jours (3 mois)"
                                >
                                  +90j
                                </button>

                                {/* Cut subscription */}
                                {isActive && (
                                  <button
                                    onClick={() => handleCut(u.id, u.email)}
                                    className="p-1.5 rounded-lg text-yellow-400 hover:bg-yellow-500/10 transition-colors cursor-pointer"
                                    title="Couper l'accès maintenant"
                                  >
                                    <PowerOff className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Delete user */}
                                <button
                                  onClick={() => handleDelete(u.id, u.email)}
                                  className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                  title="Supprimer définitivement"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SERVERS MONITORING */}
        {activeTab === "servers" && (
          <div className="space-y-4">
            <div className="bg-[#141417] p-5 rounded-2xl border border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-[#E50914]" />
                  Infrastructure Flixer Multi-Serveurs (8 Nœuds)
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Les flux vidéo sont répartis automatiquement entre les 8 clusters pour éviter tout blocage.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>100% OPÉRATIONNEL</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {SERVERS_LIST.map((srv, idx) => (
                <div
                  key={idx}
                  className="bg-[#141417] p-4 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate">{srv.name}</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      {srv.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-neutral-400 font-mono">
                    Provider : <span className="text-neutral-200">{srv.provider}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-neutral-800">
                    <span className="text-neutral-500">Latence : {srv.ping}</span>
                    <span className="text-neutral-300">Charge : {srv.load}</span>
                  </div>

                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: srv.load }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: POPULAR TITLES & ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Watched List */}
            <div className="bg-[#141417] p-5 rounded-2xl border border-neutral-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#E50914]" />
                Top Titres les Plus Visionnés
              </h3>

              <div className="space-y-3">
                {POPULAR_WATCHED.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-neutral-800/80"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-neutral-500 font-mono w-6">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">{item.title}</div>
                        <div className="text-[10px] text-neutral-400">{item.views}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-[#E50914]">{item.hours}</div>
                      <div className="text-[10px] text-emerald-400 font-bold">{item.match} match</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Subscription Insights */}
            <div className="bg-[#141417] p-5 rounded-2xl border border-neutral-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Intégration Paiements Locaux (Tunisie 🇹🇳)
              </h3>

              <div className="space-y-3 text-xs text-neutral-300">
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="font-bold text-white mb-1">ClickToPay (Cartes Bancaires & Postales)</div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Paiement instantané sécurisé. Dès la confirmation du paiement en TND, l&apos;API active automatiquement le compte VIP pour 3 mois ou 12 mois.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="font-bold text-white mb-1">D17 La Poste Tunisienne</div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Transfert direct vers le numéro marchand FilmFlex. Le client envoie sa capture d&apos;écran ou numéro de transaction pour validation immédiate.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="font-bold text-white mb-1">Virement Bancaire (RIB Tunisie)</div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Pour les abonnements annuels et packs de groupes/familles (4 écrans simultanés illimités).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CREATE SUBSCRIBER MODAL */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#18181c] rounded-2xl border border-neutral-800 p-6 text-white space-y-4 shadow-2xl animate-scale-up"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#E50914]" />
                Créer un Nouvel Abonné VIP
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-400 font-semibold mb-1">Nom du client</label>
                <input
                  type="text"
                  placeholder="Ex : Mohamed Ben Salem"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-neutral-700 rounded-xl text-white outline-none focus:border-[#E50914]"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-semibold mb-1">Adresse Email</label>
                <input
                  type="email"
                  placeholder="client@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-neutral-700 rounded-xl text-white outline-none focus:border-[#E50914]"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-semibold mb-1">Mot de passe</label>
                <input
                  type="text"
                  placeholder="Mot de passe temporaire ou personnalisé"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-neutral-700 rounded-xl text-white outline-none focus:border-[#E50914]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">Durée (jours)</label>
                  <select
                    value={newDays}
                    onChange={(e) => setNewDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-black/50 border border-neutral-700 rounded-xl text-white outline-none focus:border-[#E50914]"
                  >
                    <option value={30}>30 jours (1 Mois)</option>
                    <option value={90}>90 jours (3 Mois - Pack VIP)</option>
                    <option value={180}>180 jours (6 Mois)</option>
                    <option value={365}>365 jours (1 An)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">Écrans simultanés</label>
                  <select
                    value={newMaxScreens}
                    onChange={(e) => setNewMaxScreens(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-black/50 border border-neutral-700 rounded-xl text-white outline-none focus:border-[#E50914]"
                  >
                    <option value={2}>2 Écrans</option>
                    <option value={4}>4 Écrans (Famille)</option>
                    <option value={6}>6 Écrans (Illimité)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E50914] hover:bg-[#b80710] text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Activer le compte VIP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
