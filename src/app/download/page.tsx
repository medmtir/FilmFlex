"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Download, ShieldCheck, Zap, Sparkles, CheckCircle2, Tv, Smartphone } from "lucide-react";
import FilmFlexLogo from "@/components/FilmFlexLogo";

export default function DownloadPage() {
  const apkDownloadUrl = "/FilmFlex.apk";

  return (
    <div className="min-h-screen bg-[#0e0e12] text-white flex flex-col items-center justify-center p-4 selection:bg-[#E50914] selection:text-white">
      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold transition-all backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l&apos;accueil</span>
        </Link>
      </div>

      <div className="w-full max-w-xl bg-gradient-to-b from-[#18181c] to-[#121216] border border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.9)] text-center relative overflow-hidden my-12">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#E50914]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex justify-center mb-6 relative z-10">
          <FilmFlexLogo size="lg" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E50914]/20 text-[#ff4d58] border border-[#E50914]/40 mb-4 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Application Android Officielle (v1.0.3)</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3">
          FilmFlex sur Android & TV
        </h1>

        <p className="text-neutral-400 text-xs sm:text-sm max-w-md mx-auto mb-8 leading-relaxed">
          Installez FilmFlex sur votre smartphone, tablette ou Android TV Box pour profiter du streaming 4K Ultra HD avec le moteur Torrentio sans coupure et zéro publicité.
        </p>

        {/* Primary Download Button */}
        <div className="space-y-3 mb-8">
          <a
            href={apkDownloadUrl}
            download="FilmFlex.apk"
            className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-[#E50914] hover:bg-[#b80710] text-white font-black text-base sm:text-lg rounded-full shadow-xl shadow-[#E50914]/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-6 h-6" />
            <span>Télécharger l&apos;APK (FilmFlex.apk)</span>
          </a>
          <p className="text-[11px] text-neutral-500 font-mono">
            Taille : ~4.6 Mo • Version : 1.0.3 • 100% Gratuit & Sécurisé
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8 pt-6 border-t border-neutral-800/80">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
            <Zap className="w-4 h-4 text-[#E50914] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Moteur Torrentio 4K</p>
              <p className="text-[11px] text-neutral-400">Sélection automatique du meilleur flux sans coupure</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
            <Tv className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Compatible Android TV</p>
              <p className="text-[11px] text-neutral-400">Interface adaptée aux télécommandes TV et Box</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
            <Smartphone className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Cinéma Tunisien & Anime</p>
              <p className="text-[11px] text-neutral-400">Catalogue complet avec sous-titres arabes et français</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
            <ShieldCheck className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Synchronisation Supabase</p>
              <p className="text-[11px] text-neutral-400">Reprise de lecture et abonnements synchronisés</p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="pt-6 border-t border-neutral-800/80 flex flex-col items-center">
          <p className="text-xs text-neutral-400 mb-3 font-medium">
            Scannez ce QR Code avec votre téléphone Android pour télécharger :
          </p>
          <div className="p-3 bg-white rounded-2xl shadow-lg inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(apkDownloadUrl)}`}
              alt="QR Code Téléchargement FilmFlex APK"
              className="w-36 h-36"
            />
          </div>
        </div>

        {/* Installation Steps */}
        <div className="mt-8 pt-6 border-t border-neutral-800/80 text-left space-y-2 text-xs text-neutral-400">
          <p className="font-bold text-neutral-200">Comment installer l&apos;APK sur Android ?</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Téléchargez le fichier <span className="text-white font-mono">FilmFlex.apk</span>.</li>
            <li>Ouvrez le fichier téléchargé et appuyez sur <strong className="text-white">Installer</strong>.</li>
            <li>Si Android demande l&apos;autorisation, activez <strong className="text-white">Sources inconnues</strong> dans vos paramètres.</li>
            <li>Connectez-vous avec votre compte FilmFlex et profitez du streaming en 4K !</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
