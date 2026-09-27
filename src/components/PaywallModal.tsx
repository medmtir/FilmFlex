"use client";

import React, { useState } from "react";
import { Check, Shield, Sparkles, X, KeyRound, CreditCard } from "lucide-react";
import FilmFlexLogo from "./FilmFlexLogo";
import { UserAccount } from "@/types";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  onSubscribe: (plan: "VIP_MONTHLY" | "VIP_ANNUAL") => void;
}

export default function PaywallModal({
  isOpen,
  onClose,
  user,
  onSubscribe,
}: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"VIP_MONTHLY" | "VIP_ANNUAL">("VIP_MONTHLY");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const [voucherSuccess, setVoucherSuccess] = useState(false);

  if (!isOpen) return null;

  const handleRedeemVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = voucherCode.trim().toUpperCase();

    // Valid demo vouchers
    if (["FILMFLEX", "VIP2026", "PREMIUM", "TUNISIA"].includes(cleanCode)) {
      setVoucherSuccess(true);
      setVoucherError("");
      setTimeout(() => {
        onSubscribe("VIP_MONTHLY");
      }, 1000);
    } else {
      setVoucherError("Code promo invalide ou expiré.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#181818] rounded-xl border border-neutral-800 shadow-2xl overflow-hidden text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Banner */}
        <div className="bg-gradient-to-b from-[#260507] to-[#181818] px-8 pt-8 pb-4 text-center">
          <div className="flex justify-center mb-3">
            <FilmFlexLogo size="lg" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> FilmFlex VIP Access
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Abonnez-vous pour regarder sans limite
          </h2>
          <p className="text-neutral-400 text-sm mt-1 max-w-md mx-auto">
            Accédez à tous les films et séries en 4K Ultra HD, sans pub et avec reprise automatique.
          </p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Plan Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setSelectedPlan("VIP_MONTHLY")}
              className={`cursor-pointer rounded-lg p-4 border transition-all ${
                selectedPlan === "VIP_MONTHLY"
                  ? "border-[#E50914] bg-[#E50914]/10 shadow-[0_0_15px_rgba(229,9,20,0.2)]"
                  : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-base">VIP Mensuel</span>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedPlan === "VIP_MONTHLY"
                      ? "border-[#E50914] bg-[#E50914]"
                      : "border-neutral-600"
                  }`}
                >
                  {selectedPlan === "VIP_MONTHLY" && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
              <div className="text-2xl font-black text-white">15 DT <span className="text-xs font-normal text-neutral-400">/ mois</span></div>
              <p className="text-xs text-neutral-400 mt-2">
                Sans engagement, résiliable à tout moment. 2 écrans simultanés.
              </p>
            </div>

            <div
              onClick={() => setSelectedPlan("VIP_ANNUAL")}
              className={`relative cursor-pointer rounded-lg p-4 border transition-all ${
                selectedPlan === "VIP_ANNUAL"
                  ? "border-[#E50914] bg-[#E50914]/10 shadow-[0_0_15px_rgba(229,9,20,0.2)]"
                  : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
              }`}
            >
              <div className="absolute -top-2.5 right-3 bg-[#E50914] text-[10px] uppercase font-black px-2 py-0.5 rounded-full text-white">
                Économisez 35%
              </div>
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-base">VIP Annuel</span>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedPlan === "VIP_ANNUAL"
                      ? "border-[#E50914] bg-[#E50914]"
                      : "border-neutral-600"
                  }`}
                >
                  {selectedPlan === "VIP_ANNUAL" && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
              <div className="text-2xl font-black text-white">120 DT <span className="text-xs font-normal text-neutral-400">/ an</span></div>
              <p className="text-xs text-neutral-400 mt-2">
                Le meilleur tarif. Accès 12 mois complets en qualité 4K maximale.
              </p>
            </div>
          </div>

          {/* Features Checklist */}
          <div className="grid grid-cols-2 gap-2.5 text-xs text-neutral-300 bg-neutral-900/60 p-3.5 rounded-lg border border-neutral-800/80">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#E50914]" /> Qualité 4K Ultra HD + HDR
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#E50914]" /> 2 Profils avec code PIN
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#E50914]" /> Sous-titres & Multilingue
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#E50914]" /> Reprise de lecture instantanée
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => onSubscribe(selectedPlan)}
              className="w-full py-3.5 bg-[#E50914] hover:bg-[#b81d24] text-white font-bold rounded-lg text-base transition-colors shadow-lg shadow-[#E50914]/25 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" /> Activer mon abonnement ({selectedPlan === "VIP_MONTHLY" ? "15 DT" : "120 DT"})
            </button>

            {/* Voucher Redemption Option */}
            <div className="pt-2 border-t border-neutral-800">
              <form onSubmit={handleRedeemVoucher} className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => {
                      setVoucherError("");
                      setVoucherCode(e.target.value);
                    }}
                    placeholder="Vous avez un Code de Recharge / Promo ?"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 text-xs rounded text-white uppercase tracking-wider outline-none focus:border-[#E50914]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded text-white transition-colors"
                >
                  Valider
                </button>
              </form>

              {voucherError && (
                <p className="text-red-500 text-xs mt-1.5">{voucherError}</p>
              )}
              {voucherSuccess && (
                <p className="text-green-500 text-xs mt-1.5">Code validé avec succès ! Activation du compte en cours...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
