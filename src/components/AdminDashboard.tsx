"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Calendar,
  Tv,
  Search,
  RefreshCw,
  PowerOff,
  UserPlus,
  X,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import FilmFlexLogo from "./FilmFlexLogo";
import { UserAccount } from "@/types";
import {
  getAllUsers,
  saveAllUsers,
  adminUpdateSubscription,
  adminCutSubscription,
  adminCreateUser,
  adminDeleteUser,
  getRemainingDays,
  getActiveSessionsCount,
  adminResetSessions,
} from "@/lib/auth";

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
}

export default function AdminDashboard({
  isOpen,
  onClose,
  currentUser,
}: AdminDashboardProps) {
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "admin">("all");
  const [notice, setNotice] = useState<string | null>(null);

  // New User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newDays, setNewDays] = useState<number>(30);
  const [newMaxScreens, setNewMaxScreens] = useState<number>(2);

  const refreshList = () => {
    setUsersList(getAllUsers());
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Quick prolong action
  const handleProlong = (userId: string, days: number, userEmail: string) => {
    adminUpdateSubscription(userId, days);
    refreshList();
    showToast(`Abonnement de ${userEmail} prolongé de +${days} jours avec succès !`);
  };

  // Immediate cut action
  const handleCut = (userId: string, userEmail: string) => {
    adminCutSubscription(userId);
    refreshList();
    showToast(`Abonnement coupé immédiatement pour ${userEmail}.`);
  };

  // Reset active sessions
  const handleResetSessions = (userId: string, userEmail: string) => {
    adminResetSessions(userId);
    refreshList();
    showToast(`Sessions et écrans réinitialisés pour ${userEmail}.`);
  };

  // Delete user
  const handleDelete = (userId: string, userEmail: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le compte ${userEmail} ?`)) {
      adminDeleteUser(userId);
      refreshList();
      showToast(`Compte ${userEmail} supprimé.`);
    }
  };

  // Create new user submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    adminCreateUser({
      email: newEmail,
      password: newPassword || "filmflex123",
      name: newName,
      days: newDays,
      maxScreens: newMaxScreens,
    });

    setShowCreateModal(false);
    setNewEmail("");
    setNewPassword("");
    setNewName("");
    setNewDays(30);
    refreshList();
    showToast(`Nouveau client VIP créé avec succès pour ${newDays} jours !`);
  };

  // Stats
  const totalUsers = usersList.length;
  const activeSubs = usersList.filter((u) => u.isSubscribed && u.role !== "admin").length;
  const expiredSubs = usersList.filter((u) => !u.isSubscribed && u.role !== "admin").length;
  const totalActiveScreens = usersList.reduce((acc, u) => acc + getActiveSessionsCount(u.id), 0);

  // Filtered list
  const filteredUsers = usersList.filter((u) => {
    const matchesQuery =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesQuery) return false;

    if (statusFilter === "active") return u.isSubscribed && u.role !== "admin";
    if (statusFilter === "expired") return !u.isSubscribed && u.role !== "admin";
    if (statusFilter === "admin") return u.role === "admin";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 select-none animate-fade-in">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-[#121212] rounded-2xl border border-neutral-800 shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-white animate-scale-up">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-800 bg-[#161616]">
          <div className="flex items-center gap-3">
            <FilmFlexLogo size="md" />
            <div className="h-6 w-px bg-neutral-700 mx-1 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-red-950/80 border border-red-600/60 text-[#E50914] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Panneau Administration VIP</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notice */}
        {notice && (
          <div className="bg-[#E50914] text-white text-xs font-bold px-4 py-2 text-center animate-fade-in flex items-center justify-center gap-2 shadow-lg">
            <Sparkles className="w-4 h-4" />
            <span>{notice}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 no-scrollbar">
          {/* Top Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#181818] border border-neutral-800 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-blue-950/60 border border-blue-700/40 flex items-center justify-center text-blue-400 flex-none">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-medium">Comptes Totaux</p>
                <p className="text-xl sm:text-2xl font-black text-white">{totalUsers}</p>
              </div>
            </div>

            <div className="bg-[#181818] border border-neutral-800 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-emerald-950/60 border border-emerald-700/40 flex items-center justify-center text-emerald-400 flex-none">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-medium">Abonnements Actifs</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400">{activeSubs}</p>
              </div>
            </div>

            <div className="bg-[#181818] border border-neutral-800 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-red-950/60 border border-red-700/40 flex items-center justify-center text-red-400 flex-none">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-medium">Abonnements Expirés</p>
                <p className="text-xl sm:text-2xl font-black text-red-400">{expiredSubs}</p>
              </div>
            </div>

            <div className="bg-[#181818] border border-neutral-800 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-purple-950/60 border border-purple-700/40 flex items-center justify-center text-purple-400 flex-none">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-medium">Écrans en Direct</p>
                <p className="text-xl sm:text-2xl font-black text-purple-300">
                  {totalActiveScreens}{" "}
                  <span className="text-xs text-neutral-400 font-normal">flux actifs</span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar: Search, Filters & New User Button */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par e-mail ou nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#181818] border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#E50914] transition-colors"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-lg border border-neutral-800 text-xs">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded ${
                    statusFilter === "all" ? "bg-[#E50914] text-white font-bold" : "text-neutral-400"
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`px-2.5 py-1 rounded ${
                    statusFilter === "active" ? "bg-emerald-600 text-white font-bold" : "text-neutral-400"
                  }`}
                >
                  Actifs
                </button>
                <button
                  onClick={() => setStatusFilter("expired")}
                  className={`px-2.5 py-1 rounded ${
                    statusFilter === "expired" ? "bg-red-600 text-white font-bold" : "text-neutral-400"
                  }`}
                >
                  Expirés
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="py-2 px-4 rounded-lg bg-[#E50914] hover:bg-[#b81d24] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nouveau Compte Client</span>
            </button>
          </div>

          {/* Accounts Table */}
          <div className="bg-[#181818] rounded-xl border border-neutral-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#202020] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-3">Statut</th>
                    <th className="py-3 px-3">Date Activation</th>
                    <th className="py-3 px-3">Expiration</th>
                    <th className="py-3 px-3">Temps Restant</th>
                    <th className="py-3 px-3 text-center">Écrans (Max 2)</th>
                    <th className="py-3 px-4 text-right">Actions Adhérents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {filteredUsers.map((u) => {
                    const remaining = getRemainingDays(u.subscriptionExpiresAt);
                    const activeScreens = getActiveSessionsCount(u.id);
                    const startDate = u.subscriptionStartedAt
                      ? new Date(u.subscriptionStartedAt).toLocaleDateString("fr-FR")
                      : "—";
                    const expireDate = u.subscriptionExpiresAt
                      ? new Date(u.subscriptionExpiresAt).toLocaleDateString("fr-FR")
                      : "—";

                    return (
                      <tr key={u.id} className="hover:bg-neutral-800/40 transition-colors">
                        {/* User Column */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white font-bold flex-none">
                              {u.name?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate flex items-center gap-1.5">
                                <span>{u.name || "Client VIP"}</span>
                                {u.role === "admin" && (
                                  <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-700 text-[9px] font-bold">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-neutral-400 truncate">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Status Column */}
                        <td className="py-3 px-3">
                          {u.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-700/50 font-semibold text-[10px]">
                              Illimité
                            </span>
                          ) : u.isSubscribed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/50 font-semibold text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-700/50 font-semibold text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              Expiré (Coupé)
                            </span>
                          )}
                        </td>

                        {/* Activation Date */}
                        <td className="py-3 px-3 text-neutral-300 font-mono text-[11px]">
                          {startDate}
                        </td>

                        {/* Expiration Date */}
                        <td className="py-3 px-3 text-neutral-300 font-mono text-[11px]">
                          {expireDate}
                        </td>

                        {/* Remaining Time */}
                        <td className="py-3 px-3">
                          {u.role === "admin" ? (
                            <span className="text-neutral-400 font-mono text-[11px]">Toujours actif</span>
                          ) : (
                            <span
                              className={`font-semibold font-mono text-[11px] ${
                                remaining.isExpired ? "text-red-400" : "text-emerald-400"
                              }`}
                            >
                              {remaining.text}
                            </span>
                          )}
                        </td>

                        {/* Active Screens (Max 2) */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                              activeScreens >= (u.maxScreens || 2)
                                ? "bg-amber-950 text-amber-300 border border-amber-600/50"
                                : activeScreens > 0
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-700/50"
                                : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                            }`}
                          >
                            <Tv className="w-3 h-3" />
                            {activeScreens}/{u.maxScreens || 2}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Prolong 30 Days */}
                            <button
                              onClick={() => handleProlong(u.id, 30, u.email)}
                              className="px-2 py-1 rounded bg-neutral-800 hover:bg-emerald-900/60 hover:text-emerald-300 text-neutral-300 border border-neutral-700 text-[10px] font-bold transition-colors"
                              title="Prolonger de 30 jours (+1 Mois)"
                            >
                              +30j
                            </button>

                            {/* Prolong 90 Days */}
                            <button
                              onClick={() => handleProlong(u.id, 90, u.email)}
                              className="px-2 py-1 rounded bg-neutral-800 hover:bg-emerald-900/60 hover:text-emerald-300 text-neutral-300 border border-neutral-700 text-[10px] font-bold transition-colors hidden sm:inline-block"
                              title="Prolonger de 90 jours (+3 Mois)"
                            >
                              +90j
                            </button>

                            {/* Cut Subscription immediately */}
                            {u.isSubscribed && u.role !== "admin" && (
                              <button
                                onClick={() => handleCut(u.id, u.email)}
                                className="px-2 py-1 rounded bg-neutral-800 hover:bg-red-900/70 hover:text-red-300 text-neutral-300 border border-neutral-700 text-[10px] font-bold transition-colors"
                                title="Couper l'accès immédiatement (y9oss 3lih)"
                              >
                                <PowerOff className="w-3 h-3 text-red-500 inline mr-0.5" />
                                Couper
                              </button>
                            )}

                            {/* Reset Screens */}
                            <button
                              onClick={() => handleResetSessions(u.id, u.email)}
                              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
                              title="Réinitialiser les sessions d'écrans"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete User */}
                            {u.role !== "admin" && (
                              <button
                                onClick={() => handleDelete(u.id, u.email)}
                                className="p-1 rounded bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 border border-neutral-700 transition-colors"
                                title="Supprimer le compte"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal: Créer Nouveau Compte VIP */}
        {showCreateModal && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-[#181818] rounded-xl border border-neutral-700 p-6 shadow-2xl text-white space-y-4 animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#E50914]" />
                  <span>Ajouter un Nouvel Abonné VIP</span>
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Nom du Client
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Yassine Ben Salah"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Adresse E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Mot de passe
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ex: filmflex2026"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Durée d&apos;abonnement
                    </label>
                    <select
                      value={newDays}
                      onChange={(e) => setNewDays(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#E50914]"
                    >
                      <option value={30}>1 Mois (30 jours)</option>
                      <option value={90}>3 Mois (90 jours)</option>
                      <option value={180}>6 Mois (180 jours)</option>
                      <option value={365}>1 An (365 jours)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Écrans Simultanés
                    </label>
                    <select
                      value={newMaxScreens}
                      onChange={(e) => setNewMaxScreens(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#E50914]"
                    >
                      <option value={2}>2 Écrans (Standard)</option>
                      <option value={4}>4 Écrans (Famille)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#E50914] hover:bg-[#b81d24] text-white font-bold text-xs rounded-lg transition-colors"
                  >
                    Valider et Créer le Compte
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs rounded-lg"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
