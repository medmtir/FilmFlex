"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Play,
  Trash2,
  HardDrive,
  CheckCircle2,
  WifiOff,
  Sparkles,
  Loader2,
  Film,
  Tv,
} from "lucide-react";
import { Movie, DownloadedItem } from "@/types";
import {
  getDownloadedItems,
  deleteDownload,
  getTotalStorageFormatted,
  onDownloadsUpdated,
  startDownload,
} from "@/lib/downloadManager";

interface DownloadsViewProps {
  movies: Movie[];
  onPlay: (movie: Movie, season?: number, episode?: number) => void;
  onOpenModal: (movie: Movie) => void;
}

export default function DownloadsView({
  movies,
  onPlay,
  onOpenModal,
}: DownloadsViewProps) {
  const [downloadedItems, setDownloadedItems] = useState<DownloadedItem[]>([]);
  const [storageUsed, setStorageUsed] = useState<string>("0 Mo");
  const [notice, setNotice] = useState<string | null>(null);

  const refreshDownloads = () => {
    let items = getDownloadedItems();
    // If first time opening downloads and nothing has been downloaded yet, pre-populate 2 favorites
    if (items.length === 0 && movies.length > 0) {
      const dune = movies.find((m) => m.id === "m_dune2") || movies[0];
      const choufly = movies.find((m) => m.id.includes("choufly")) || movies[1];
      if (dune) startDownload(dune);
      if (choufly) startDownload(choufly);
      items = getDownloadedItems();
    }
    setDownloadedItems(items);
    setStorageUsed(getTotalStorageFormatted());
  };

  useEffect(() => {
    refreshDownloads();
    const unsubscribe = onDownloadsUpdated(() => {
      refreshDownloads();
    });
    return () => unsubscribe();
  }, [movies]);

  const handleRemove = async (id: string, title: string) => {
    await deleteDownload(id);
    setNotice(`"${title}" a été supprimé de la mémoire de l'application.`);
    setTimeout(() => setNotice(null), 3500);
    refreshDownloads();
  };

  const handlePlayDownloaded = (item: DownloadedItem) => {
    // Find the corresponding movie object or build a playback instance
    let targetMovie = movies.find((m) => m.id === item.movieId);
    if (!targetMovie) {
      targetMovie = {
        id: item.movieId,
        title: item.title,
        description: "Visionnage hors-ligne depuis le stockage local de l'application.",
        backdropUrl: item.backdropUrl,
        posterUrl: item.posterUrl,
        trailerYoutubeId: "",
        videoUrl: "/sample.mp4",
        duration: item.duration,
        durationSeconds: 7200,
        releaseYear: 2024,
        matchPercentage: 99,
        ageRating: "ALL",
        quality: "HD",
        genres: ["Téléchargé", "Hors-Ligne"],
        cast: [],
        subtitles: [],
        audioTracks: [],
      };
    }
    if (targetMovie) {
      onPlay(targetMovie, item.season, item.episode);
    }
  };

  return (
    <div className="pt-24 pb-28 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto select-none animate-fade-in text-white">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center">
              <Download className="w-5 h-5 text-[#E50914]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Mes Téléchargements Hors-Ligne
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fichiers stockés exclusivement dans l&apos;application • Visionnables sans aucune connexion Internet ni Wi-Fi.</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
            <HardDrive className="w-3.5 h-3.5 text-[#E50914]" />
            <span>Stockage App : <strong className="text-white font-mono">{storageUsed}</strong></span>
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-3 mb-6 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Downloads List */}
      {downloadedItems.length === 0 ? (
        <div className="py-20 text-center text-neutral-500 space-y-4 bg-neutral-900/30 rounded-3xl border border-neutral-800/60 p-6">
          <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 mx-auto flex items-center justify-center text-neutral-600">
            <Download className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-200">
              Aucun téléchargement dans l&apos;application
            </h3>
            <p className="text-xs max-w-md mx-auto text-neutral-400 leading-relaxed">
              Ouvrez n&apos;importe quel film ou épisode, puis appuyez sur le bouton <strong className="text-white">⬇ Télécharger</strong> pour l&apos;enregistrer dans l&apos;application et le regarder en voyage ou sans Internet.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {downloadedItems.map((item) => {
            const isDownloading = item.status === "downloading";
            const displayTitle = item.episodeTitle
              ? `${item.title} (S${item.season}:E${item.episode} - ${item.episodeTitle})`
              : item.title;

            return (
              <div
                key={item.id}
                className="p-3 sm:p-4 rounded-2xl bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all shadow-md group"
              >
                {/* Left: Thumbnail & Title */}
                <div
                  onClick={() => !isDownloading && handlePlayDownloaded(item)}
                  className={`flex items-center gap-3 sm:gap-4 flex-1 min-w-0 ${
                    !isDownloading ? "cursor-pointer" : ""
                  }`}
                >
                  <div className="relative w-24 sm:w-32 aspect-video rounded-xl overflow-hidden shrink-0 bg-neutral-950 border border-neutral-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.backdropUrl || item.posterUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {!isDownloading ? (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-[#E50914] animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#E50914] transition-colors">
                      {displayTitle}
                    </h4>

                    {isDownloading ? (
                      <div className="mt-2 space-y-1.5 max-w-xs">
                        <div className="flex items-center justify-between text-[10px] text-neutral-400">
                          <span className="text-[#E50914] font-semibold flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Téléchargement en cours...</span>
                          </span>
                          <span className="font-mono">{item.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#E50914] rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center flex-wrap gap-2 text-[10px] text-neutral-400 mt-1.5">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Prêt hors-ligne</span>
                        </span>
                        <span>•</span>
                        <span>{item.quality}</span>
                        <span>•</span>
                        <span>{item.duration}</span>
                        <span>•</span>
                        <span className="font-mono text-neutral-300">{item.sizeFormatted}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
                  {!isDownloading && (
                    <button
                      onClick={() => handlePlayDownloaded(item)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#E50914] hover:bg-[#b80710] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-[#E50914]/20 cursor-pointer active:scale-95"
                      title="Lire hors-ligne sans connexion"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Lire</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleRemove(item.id, displayTitle)}
                    className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Supprimer du stockage de l'application"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
