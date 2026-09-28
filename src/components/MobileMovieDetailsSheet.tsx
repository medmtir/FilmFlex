"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  Plus,
  Check,
  ThumbsUp,
  Share2,
  Download,
  ChevronDown,
  Sparkles,
  Info,
  Film,
  Loader2,
} from "lucide-react";
import { Movie, Episode } from "@/types";
import {
  startDownload,
  isItemDownloaded,
  isItemDownloading,
  onDownloadsUpdated,
} from "@/lib/downloadManager";

interface MobileMovieDetailsSheetProps {
  movie: Movie | null;
  onClose: () => void;
  onPlay: (movie: Movie, season?: number, episode?: number) => void;
  isInMyList: boolean;
  onToggleMyList: (movie: Movie) => void;
  onDownload?: (movie: Movie, episode?: Episode) => void;
}

export default function MobileMovieDetailsSheet({
  movie,
  onClose,
  onPlay,
  isInMyList,
  onToggleMyList,
  onDownload,
}: MobileMovieDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState<"episodes" | "trailers">("episodes");
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<string | null>(null);

  const isSeries =
    movie?.type === "series" ||
    movie?.duration.toLowerCase().includes("season") ||
    movie?.duration.toLowerCase().includes("série");

  useEffect(() => {
    if (movie && isSeries) {
      fetch(`/api/episodes/${movie.imdbId || movie.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.episodes && data.episodes.length > 0) {
            setEpisodes(data.episodes);
            setSelectedSeason(data.episodes[0].season || 1);
          } else {
            setEpisodes([
              {
                id: `${movie.id}:1:1`,
                season: 1,
                episode: 1,
                title: "1. Épisode 1",
                overview: movie.description,
                thumbnail: movie.backdropUrl,
              },
              {
                id: `${movie.id}:1:2`,
                season: 1,
                episode: 2,
                title: "2. Épisode 2",
                overview: "La suite de l'aventure avec de nouvelles révélations.",
                thumbnail: movie.backdropUrl,
              },
              {
                id: `${movie.id}:1:3`,
                season: 1,
                episode: 3,
                title: "3. Épisode 3",
                overview: "Un affrontement décisif et inattendu.",
                thumbnail: movie.backdropUrl,
              },
            ]);
            setSelectedSeason(1);
          }
        })
        .catch(() => {
          setEpisodes([]);
        });
    } else {
      setEpisodes([]);
    }
  }, [movie, isSeries]);

  const [, setDownloadVersion] = useState(0);

  useEffect(() => {
    const unsub = onDownloadsUpdated(() => {
      setDownloadVersion((v) => v + 1);
    });
    return () => unsub();
  }, []);

  if (!movie) return null;

  const isMovieDownloaded = isItemDownloaded(movie.id);
  const isMovieDownloading = isItemDownloading(movie.id);

  const currentSeasonEpisodes = episodes.filter((e) => e.season === selectedSeason);
  const availableSeasons = Array.from(new Set(episodes.map((e) => e.season))).sort(
    (a, b) => a - b
  );

  const handleDownloadClick = async (ep?: Episode) => {
    const downloadId = ep ? `${movie.id}:${ep.season}:${ep.episode}` : movie.id;
    const itemTitle = ep ? `${movie.title} (${ep.title})` : movie.title;

    if (isItemDownloaded(downloadId)) {
      setDownloadSuccessNotice(`"${itemTitle}" est déjà prêt dans l'application pour le visionnage hors-ligne !`);
      setTimeout(() => setDownloadSuccessNotice(null), 3500);
      return;
    }

    setDownloadSuccessNotice(`Téléchargement de "${itemTitle}" dans l'application en cours...`);
    setTimeout(() => setDownloadSuccessNotice(null), 3500);

    if (onDownload) {
      onDownload(movie, ep);
    }

    await startDownload(movie, ep);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-end sm:justify-center overflow-hidden animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg mx-auto bg-[#141418] rounded-t-3xl sm:rounded-3xl border-t sm:border border-neutral-800 text-white max-h-[92vh] flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.9)] overflow-hidden animate-slide-up"
      >
        {/* Top Header Bar with Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800/80 sticky top-0 bg-[#141418]/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-widest text-[#E50914] uppercase">
              FILMFLEX
            </span>
            <span className="text-[10px] text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded-full">
              {movie.quality || "4K UHD"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Details Body */}
        <div className="overflow-y-auto px-4 sm:px-6 py-4 space-y-4 no-scrollbar">
          {/* Centered Poster Thumbnail (Exact match to Screen 2) */}
          <div className="flex justify-center pt-2">
            <div className="relative w-36 h-52 sm:w-40 sm:h-56 rounded-xl overflow-hidden shadow-2xl shadow-black border border-neutral-700/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-emerald-950/80 text-emerald-400 font-black text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30">
                {movie.matchPercentage}%
              </div>
            </div>
          </div>

          {/* Metadata Row matching Screenshot: 👍 Year TV-MA Duration */}
          <div className="flex items-center justify-center gap-2.5 text-xs text-neutral-300 font-semibold pt-1">
            <span className="flex items-center gap-1 text-white">
              <ThumbsUp className="w-3.5 h-3.5 fill-white" />
            </span>
            <span>{movie.releaseYear}</span>
            <span className="bg-neutral-800 text-neutral-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-neutral-700">
              {movie.ageRating || "TV-MA"}
            </span>
            <span>{movie.duration}</span>
          </div>

          {/* Big Red Full-Width ▶ PLAY Button (Exact match to media_1790623064106.png) */}
          <button
            onClick={() => onPlay(movie, selectedSeason, 1)}
            className="w-full py-3 bg-[#E50914] hover:bg-[#b80710] active:scale-[0.98] text-white font-black text-sm uppercase tracking-wider rounded-md shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>PLAY</span>
          </button>

          {/* Full-Width ⬇ TÉLÉCHARGER Button */}
          <button
            onClick={() => handleDownloadClick()}
            disabled={isMovieDownloading}
            className={`w-full py-2.5 font-bold text-xs uppercase tracking-wider rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              isMovieDownloaded
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-400"
                : isMovieDownloading
                ? "bg-neutral-800 text-neutral-300 border-neutral-700 animate-pulse"
                : "bg-neutral-800/90 hover:bg-neutral-750 text-white border-neutral-700"
            }`}
          >
            {isMovieDownloaded ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Téléchargé (Prêt hors-ligne)</span>
              </>
            ) : isMovieDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#E50914]" />
                <span>Téléchargement dans l&apos;application...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>Télécharger</span>
              </>
            )}
          </button>

          {/* Download Notification */}
          {downloadSuccessNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadSuccessNotice}</span>
            </div>
          )}

          {/* Episode Info & Synopsis Description */}
          <div className="space-y-1.5 text-left pt-1">
            {isSeries && currentSeasonEpisodes.length > 0 && (
              <h3 className="text-sm font-extrabold text-white">
                S{selectedSeason}:E1 {currentSeasonEpisodes[0].title.replace(/^\d+\.\s*/, "")}
              </h3>
            )}
            <p className="text-xs text-neutral-300 leading-relaxed">
              {movie.description}
            </p>
            {(movie.cast || movie.director) && (
              <div className="text-[11px] text-neutral-400 space-y-0.5 pt-1">
                {movie.cast && movie.cast.length > 0 && (
                  <p>
                    <span className="text-neutral-500 font-medium">Cast: </span>
                    {movie.cast.slice(0, 3).join(", ")}
                  </p>
                )}
                {movie.director && (
                  <p>
                    <span className="text-neutral-500 font-medium">Creator: </span>
                    {movie.director}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Row: + My List | 👍 Rated | ↗ Share (Exact 3 items matching screenshot) */}
          <div className="flex items-center justify-around py-3 border-y border-neutral-800 text-neutral-400">
            {/* My List */}
            <button
              onClick={() => onToggleMyList(movie)}
              className="flex flex-col items-center gap-1 hover:text-white transition-colors cursor-pointer"
            >
              {isInMyList ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <Plus className="w-5 h-5 text-neutral-300" />
              )}
              <span className="text-[10px] font-medium">My List</span>
            </button>

            {/* Rated */}
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                isLiked ? "text-white font-bold" : "hover:text-white"
              }`}
            >
              <ThumbsUp className={`w-5 h-5 ${isLiked ? "fill-white text-white" : "text-neutral-300"}`} />
              <span className="text-[10px] font-medium">{isLiked ? "Rated" : "Rate"}</span>
            </button>

            {/* Share */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator
                    .share({
                      title: movie.title,
                      text: `Regardez ${movie.title} sur FilmFlex !`,
                      url: window.location.href,
                    })
                    .catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  setDownloadSuccessNotice("Lien copié dans le presse-papier !");
                  setTimeout(() => setDownloadSuccessNotice(null), 3000);
                }
              }}
              className="flex flex-col items-center gap-1 hover:text-white transition-colors cursor-pointer"
            >
              <Share2 className="w-5 h-5 text-neutral-300" />
              <span className="text-[10px] font-medium">Share</span>
            </button>
          </div>

          {/* Red Accent Divider matching media_1790623064106.png */}
          <div className="w-full h-[2px] bg-[#E50914] -mt-2 mb-1" />

          {/* Tabs: ÉPISODES | BANDES-ANNONCES & PLUS */}
          <div className="pt-2">
            <div className="flex border-b border-neutral-800">
              {isSeries && (
                <button
                  onClick={() => setActiveTab("episodes")}
                  className={`pb-2.5 px-4 text-xs font-black uppercase tracking-wider relative transition-colors cursor-pointer ${
                    activeTab === "episodes"
                      ? "text-white"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <span>Épisodes</span>
                  {activeTab === "episodes" && (
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#E50914] rounded-t-full" />
                  )}
                </button>
              )}

              <button
                onClick={() => setActiveTab("trailers")}
                className={`pb-2.5 px-4 text-xs font-black uppercase tracking-wider relative transition-colors cursor-pointer ${
                  activeTab === "trailers" || !isSeries
                    ? "text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <span>Bandes-annonces & Plus</span>
                {(activeTab === "trailers" || !isSeries) && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#E50914] rounded-t-full" />
                )}
              </button>
            </div>

            {/* TAB CONTENT: EPISODES */}
            {isSeries && activeTab === "episodes" && (
              <div className="pt-4 space-y-3">
                {/* Season Dropdown */}
                {availableSeasons.length > 1 && (
                  <div className="relative inline-block mb-2">
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(Number(e.target.value))}
                      className="appearance-none bg-neutral-800 text-white text-xs font-bold py-2 pl-3 pr-8 rounded-lg outline-none border border-neutral-700 cursor-pointer"
                    >
                      {availableSeasons.map((s) => (
                        <option key={s} value={s}>
                          Saison {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}

                {/* Episodes List (Exact match to Screen 2) */}
                <div className="space-y-3">
                  {currentSeasonEpisodes.map((ep) => (
                    <div
                      key={ep.id}
                      onClick={() => onPlay(movie, ep.season, ep.episode)}
                      className="p-2.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 border border-neutral-800/80 transition-all flex items-start gap-3 cursor-pointer group"
                    >
                      {/* Thumbnail with centered circular play icon */}
                      <div className="relative w-28 aspect-video rounded-lg overflow-hidden shrink-0 bg-neutral-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ep.thumbnail || movie.backdropUrl}
                          alt={ep.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-black/70 border border-white/40 flex items-center justify-center text-white group-hover:bg-[#E50914] group-hover:border-transparent transition-all">
                            <Play className="w-3 h-3 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Episode details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-[#E50914] transition-colors">
                            {ep.title}
                          </h4>
                          {/* Download Episode Button */}
                          {(() => {
                            const epDownloadId = `${movie.id}:${ep.season}:${ep.episode}`;
                            const isEpDownloaded = isItemDownloaded(epDownloadId);
                            const isEpDownloading = isItemDownloading(epDownloadId);
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadClick(ep);
                                }}
                                disabled={isEpDownloading}
                                className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
                                title={isEpDownloaded ? "Épisode téléchargé dans l'application" : "Télécharger l'épisode hors-ligne"}
                              >
                                {isEpDownloaded ? (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                ) : isEpDownloading ? (
                                  <Loader2 className="w-4 h-4 text-[#E50914] animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </button>
                            );
                          })()}
                        </div>

                        <span className="text-[10px] text-neutral-400 font-mono">
                          {ep.duration || "45m"}
                        </span>

                        {ep.overview && (
                          <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-normal">
                            {ep.overview}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: TRAILERS & MORE */}
            {(activeTab === "trailers" || !isSeries) && (
              <div className="pt-4 space-y-4">
                {movie.trailerYoutubeId ? (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-neutral-800">
                    <iframe
                      src={`https://www.youtube.com/embed/${movie.trailerYoutubeId}?modestbranding=1&rel=0`}
                      title="Bande-annonce"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="py-8 text-center text-neutral-500 text-xs">
                    Aucune bande-annonce supplémentaire disponible.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
