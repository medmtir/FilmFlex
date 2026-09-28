"use client";

import React, { useState } from "react";
import {
  Download,
  Play,
  Trash2,
  HardDrive,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Film,
  Tv,
} from "lucide-react";
import { Movie } from "@/types";

interface DownloadsViewProps {
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onOpenModal: (movie: Movie) => void;
}

export default function DownloadsView({
  movies,
  onPlay,
  onOpenModal,
}: DownloadsViewProps) {
  // Pre-selected offline favorites (Dune 2, Choufly Hal, Attack on Titan, Dachra)
  const [downloadedItems, setDownloadedItems] = useState<Movie[]>(() => {
    return movies.slice(0, 4);
  });
  const [notice, setNotice] = useState<string | null>(null);

  const handleRemove = (id: string, title: string) => {
    setDownloadedItems((prev) => prev.filter((m) => m.id !== id));
    setNotice(`"${title}" supprimé des téléchargements.`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleDownloadDirect = (movie: Movie) => {
    const downloadUrl = `/api/stream/${movie.imdbId || movie.id}?quality=1080p`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${movie.title.replace(/\s+/g, "_")}_1080p.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setNotice(`Téléchargement direct lancé pour ${movie.title} (1080p Ultra HD)`);
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="pt-24 pb-24 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto select-none animate-fade-in text-white">
      {/* Top Banner */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Download className="w-6 h-6 text-[#E50914]" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Mes Téléchargements (Stremio & Netflix)
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Regardez vos films, animés et séries hors-ligne sans connexion Internet.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
          <HardDrive className="w-3.5 h-3.5 text-[#E50914]" />
          <span>Stockage : 3.8 Go utilisés</span>
        </div>
      </div>

      {notice && (
        <div className="p-3 mb-6 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Downloads List */}
      {downloadedItems.length === 0 ? (
        <div className="py-20 text-center text-neutral-500 space-y-3">
          <Download className="w-12 h-12 mx-auto text-neutral-600 stroke-[1.5]" />
          <h3 className="text-base font-bold text-neutral-300">
            Aucun téléchargement pour le moment
          </h3>
          <p className="text-xs max-w-sm mx-auto text-neutral-500">
            Cliquez sur l&apos;icône ⬇ sur n&apos;importe quel film ou épisode pour le sauvegarder et le visionner hors-ligne.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {downloadedItems.map((movie) => (
            <div
              key={movie.id}
              className="p-3 rounded-2xl bg-neutral-900/70 hover:bg-neutral-850 border border-neutral-800/80 flex items-center justify-between gap-3 sm:gap-4 transition-all"
            >
              {/* Thumbnail & Title */}
              <div
                onClick={() => onPlay(movie)}
                className="flex items-center gap-3 sm:gap-4 cursor-pointer flex-1 min-w-0"
              >
                <div className="relative w-24 sm:w-32 aspect-video rounded-xl overflow-hidden shrink-0 bg-neutral-950 border border-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={movie.backdropUrl || movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg">
                      <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate hover:text-[#E50914] transition-colors">
                    {movie.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-1">
                    <span className="text-emerald-400 font-bold">Téléchargé • 1080p</span>
                    <span>•</span>
                    <span>{movie.duration}</span>
                    <span>•</span>
                    <span className="font-mono">1.2 Go</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {/* 1-Click Direct Download to Storage */}
                <button
                  onClick={() => handleDownloadDirect(movie)}
                  className="px-3 py-1.5 rounded-lg bg-[#E50914]/20 hover:bg-[#E50914] text-[#ff4d58] hover:text-white border border-[#E50914]/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Télécharger fichier MP4"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Télécharger MP4</span>
                </button>

                {/* Remove */}
                <button
                  onClick={() => handleRemove(movie.id, movie.title)}
                  className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Supprimer du stockage"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
