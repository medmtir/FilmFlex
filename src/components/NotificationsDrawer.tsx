"use client";

import React, { useState } from "react";
import { Bell, Check, CheckCheck, Trash2, X, Sparkles, CreditCard, Film, Tv, ShieldCheck, ExternalLink } from "lucide-react";
import { Movie } from "@/types";

export interface NotificationItem {
  id: string;
  type: "payment" | "new_content" | "system";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  paymentMethod?: "ClickToPay" | "D17" | "Virement Bancaire";
  movieId?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "payment",
    title: "Abonnement VIP Actif 🎉",
    message: "Votre paiement a été validé avec succès. Accès illimité à tout le catalogue 4K Ultra HD débloqué.",
    time: "Il y a 5 min",
    isRead: false,
    paymentMethod: "ClickToPay",
  },
  {
    id: "notif-2",
    type: "payment",
    title: "Validation D17 La Poste Tunisienne 🇹🇳",
    message: "Transfert D17 de 35.000 TND confirmé par le serveur de facturation FilmFlex.",
    time: "Il y a 2h",
    isRead: false,
    paymentMethod: "D17",
  },
  {
    id: "notif-3",
    type: "new_content",
    title: "Nouveau : Kuruluş: Osman (Saison 5)",
    message: "Le nouvel épisode est maintenant en ligne avec sous-titres arabes et français en 4K.",
    time: "Il y a 4h",
    isRead: false,
    movieId: "tt10705474",
  },
  {
    id: "notif-4",
    type: "new_content",
    title: "Nouveau Film : Dune - Deuxième Partie",
    message: "Le chef-d'œuvre de Denis Villeneuve est disponible en streaming instantané multi-serveurs.",
    time: "Hier",
    isRead: true,
    movieId: "tt15239678",
  },
  {
    id: "notif-5",
    type: "payment",
    title: "Reçu Virement Bancaire Approuvé",
    message: "Votre justificatif bancaire a été validé par l'équipe d'administration. Compte prolongé de 90 jours.",
    time: "Il y a 2 jours",
    isRead: true,
    paymentMethod: "Virement Bancaire",
  },
  {
    id: "notif-6",
    type: "system",
    title: "Optimisation des serveurs de streaming ⚡",
    message: "Les 8 serveurs Flixer (Ares, Balder, Circe, etc.) fonctionnent à pleine vitesse avec zéro buffering.",
    time: "Il y a 3 jours",
    isRead: true,
  },
];

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie?: (movieId: string) => void;
  onOpenPaymentModal?: () => void;
}

export default function NotificationsDrawer({
  isOpen,
  onClose,
  onSelectMovie,
  onOpenPaymentModal,
}: NotificationsDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread" | "payment">("all");

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "payment") return n.type === "payment";
    return true;
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md h-full bg-[#141416] border-l border-neutral-800 text-white shadow-2xl flex flex-col animate-slide-left"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800/80 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="relative p-2 rounded-xl bg-[#E50914]/15 text-[#E50914] border border-[#E50914]/30">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E50914] text-[10px] font-black text-white flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-[11px] font-medium text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full">
                    {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Paiements ClickToPay, D17 & Nouvelles sorties
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills & Actions Bar */}
        <div className="px-4 py-2.5 bg-neutral-900/60 border-b border-neutral-800/80 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium ${
                filter === "all"
                  ? "bg-white text-black font-bold"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              Toutes ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium ${
                filter === "unread"
                  ? "bg-white text-black font-bold"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              Non lues ({unreadCount})
            </button>
            <button
              onClick={() => setFilter("payment")}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium ${
                filter === "payment"
                  ? "bg-[#E50914] text-white font-bold"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              💳 Paiements
            </button>
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={clearAll}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                title="Tout effacer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {filteredNotifs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
              <Bell className="w-12 h-12 stroke-[1.2] mb-3 text-neutral-600" />
              <p className="text-sm font-medium text-neutral-300">Aucune notification pour le moment</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                Vous recevrez ici les confirmations de paiement (ClickToPay, D17) et les nouvelles sorties de films.
              </p>
            </div>
          ) : (
            filteredNotifs.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  toggleRead(item.id);
                  if (item.movieId && onSelectMovie) {
                    onSelectMovie(item.movieId);
                    onClose();
                  } else if (item.type === "payment" && onOpenPaymentModal) {
                    onOpenPaymentModal();
                  }
                }}
                className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  item.isRead
                    ? "bg-[#18181b]/70 border-neutral-800/80 hover:border-neutral-700 opacity-80 hover:opacity-100"
                    : "bg-[#1f1f23] border-[#E50914]/40 hover:border-[#E50914] shadow-lg shadow-[#E50914]/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      item.type === "payment"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : item.type === "new_content"
                        ? "bg-[#E50914]/15 text-[#E50914] border border-[#E50914]/30"
                        : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {item.type === "payment" ? (
                      <CreditCard className="w-4 h-4" />
                    ) : item.type === "new_content" ? (
                      <Film className="w-4 h-4" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs font-bold leading-tight truncate ${
                          item.isRead ? "text-neutral-300" : "text-white"
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-neutral-500 shrink-0 font-mono">
                        {item.time}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2">
                      {item.message}
                    </p>

                    {/* Badges */}
                    <div className="flex items-center gap-2 pt-1">
                      {item.paymentMethod && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          <Check className="w-3 h-3" /> {item.paymentMethod}
                        </span>
                      )}
                      {item.movieId && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#E50914] bg-[#E50914]/10 border border-[#E50914]/30 px-2 py-0.5 rounded-md group-hover:bg-[#E50914] group-hover:text-white transition-colors">
                          Regarder <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#E50914] shrink-0 mt-2" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Quick Action */}
        <div className="p-4 border-t border-neutral-800/80 bg-black/40 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400">
            Support Paiements Tunisie 🇹🇳
          </div>
          <button
            onClick={() => {
              if (onOpenPaymentModal) onOpenPaymentModal();
              onClose();
            }}
            className="text-xs font-bold text-white bg-[#E50914] hover:bg-[#b80710] px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Gérer l&apos;Abonnement</span>
          </button>
        </div>
      </div>
    </div>
  );
}
