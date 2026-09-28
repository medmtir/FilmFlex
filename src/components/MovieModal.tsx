"use client";

import React, { useState, useEffect } from "react";
import { X, Play, Plus, Check, ThumbsUp, Volume2, VolumeX, Sparkles, ChevronDown, Share2, Download, Loader2 } from "lucide-react";
import { Movie, Episode } from "@/types";
import { startDownload, isItemDownloaded, isItemDownloading, onDownloadsUpdated } from "@/lib/downloadManager";

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
  onPlay: (movie: Movie, season?: number, episode?: number) => void;
  isInMyList: boolean;
  onToggleMyList: (movie: Movie) => void;
  allMovies: Movie[];
}

export default function MovieModal({
  movie,
  onClose,
  onPlay,
  isInMyList,
  onToggleMyList,
  allMovies,
}: MovieModalProps) {
  const [showTrailer, setShowTrailer] = useState(true);
  const [isTrailerMuted, setIsTrailerMuted] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  const handleDownload = async (ep?: Episode) => {
    if (!movie) return;
    const itemTitle = ep ? `${movie.title} - S${ep.season}E${ep.episode}` : movie.title;
    const downloadId = ep ? `${movie.id}:${ep.season}:${ep.episode}` : movie.id;
    if (isItemDownloaded(downloadId)) {
      setNotice(`"${itemTitle}" est déjà prêt dans l'application pour le visionnage hors-ligne.`);
      setTimeout(() => setNotice(null), 3500);
      return;
    }
    setNotice(`Téléchargement de "${itemTitle}" dans l'application en cours...`);
    setTimeout(() => setNotice(null), 3500);
    await startDownload(movie, ep);
  };

  const handleShare = () => {
    if (!movie) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: movie.title,
        text: `Regardez ${movie.title} en 4K Ultra HD sur FilmFlex !`,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setNotice("Lien du film copié dans le presse-papier !");
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const isSeries = movie?.type === "series" || movie?.duration.toLowerCase().includes("season") || movie?.duration.toLowerCase().includes("série");

  // Fetch episodes if it's a TV series
  useEffect(() => {
    if (movie && isSeries) {
      setIsLoadingEpisodes(true);
      fetch(`/api/episodes/${movie.imdbId || movie.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.episodes && data.episodes.length > 0) {
            setEpisodes(data.episodes);
            setSelectedSeason(data.episodes[0].season);
          } else {
            // Generate fallback default season 1 episodes
            setEpisodes([
              { id: `${movie.id}:1:1`, season: 1, episode: 1, title: "Épisode 1 : Le Début", overview: movie.description, thumbnail: movie.backdropUrl },
              { id: `${movie.id}:1:2`, season: 1, episode: 2, title: "Épisode 2 : L'Inconnu", overview: "La quête se poursuit alors que de nouvelles révélations émergent.", thumbnail: movie.backdropUrl },
              { id: `${movie.id}:1:3`, season: 1, episode: 3, title: "Épisode 3 : La Confrontation", overview: "Des forces opposées s'affrontent dans une bataille décisive.", thumbnail: movie.backdropUrl },
            ]);
            setSelectedSeason(1);
          }
        })
        .catch(() => {
          setEpisodes([]);
        })
        .finally(() => setIsLoadingEpisodes(false));
    } else {
      setEpisodes([]);
    }
  }, [movie, isSeries]);

  if (!movie) return null;

  // Available seasons
  const seasonsList = Array.from(new Set(episodes.map((e) => e.season))).sort((a, b) => a - b);
  const currentSeasonEpisodes = episodes.filter((e) => e.season === selectedSeason);

  const similarMovies = allMovies
    .filter((m) => m.id !== movie.id && m.genres.some((g) => movie.genres.includes(g)))
    .slice(0, 6);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-center overflow-y-auto p-0 sm:p-4 md:p-8 animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#181818] rounded-none sm:rounded-xl overflow-hidden shadow-2xl border-0 sm:border border-neutral-800 text-white min-h-screen sm:min-h-0 my-0 sm:my-auto animate-scale-up"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-neutral-800 flex items-center justify-center text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Notice Toast */}
        {notice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-2xl animate-fade-in backdrop-blur-md">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Top Media: Trailer or High-Res Backdrop */}
        <div className="relative aspect-[16/9] w-full bg-black">
          {showTrailer && movie.trailerYoutubeId ? (
            <div className="relative w-full h-full pointer-events-auto">
              <iframe
                src={`https://www.youtube.com/embed/${movie.trailerYoutubeId}?autoplay=1&mute=${
                  isTrailerMuted ? 1 : 0
                }&controls=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`}
                title={movie.title}
                className="w-full h-full object-cover"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={movie.backdropUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          )}

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />

          {/* Overlay Content */}
          <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 flex items-end justify-between z-10">
            <div className="space-y-2 sm:space-y-3">
              {movie.isFilmFlexOriginal && (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold tracking-widest text-[#E50914] uppercase">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> FilmFlex Exclusive
                </span>
              )}
              <h1 className="text-xl sm:text-2xl md:text-4xl font-black drop-shadow-md">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  onClick={() => onPlay(movie, isSeries ? selectedSeason : undefined, isSeries ? 1 : undefined)}
                  className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 bg-[#E50914] hover:bg-[#b80710] text-white font-black rounded-xl text-xs sm:text-sm tracking-wider uppercase transition-all shadow-xl shadow-[#E50914]/40 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isSeries ? "Lancer la série" : "PLAY"}</span>
                </button>

                <button
                  onClick={() => onToggleMyList(movie)}
                  className="w-10 h-10 rounded-full border border-neutral-400 hover:border-white bg-black/50 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  title={isInMyList ? "Retirer de Ma Liste" : "Ajouter à Ma Liste"}
                >
                  {isInMyList ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`w-10 h-10 rounded-full border transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center ${
                    isLiked
                      ? "bg-white text-black border-white"
                      : "border-neutral-400 hover:border-white bg-black/50 text-white"
                  }`}
                  title="J'aime ce titre"
                >
                  <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-black" : ""}`} />
                </button>

                <button
                  onClick={() => handleDownload()}
                  className="w-10 h-10 rounded-full border border-neutral-400 hover:border-white bg-black/50 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  title="Télécharger en 1080p Full HD"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full border border-neutral-400 hover:border-white bg-black/50 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  title="Partager"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {movie.trailerYoutubeId && (
              <button
                onClick={() => setIsTrailerMuted(!isTrailerMuted)}
                className="w-9 h-9 rounded-full border border-neutral-500 bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
              >
                {isTrailerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Modal Info Section */}
        <div className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3 text-sm font-semibold">
                <span className="text-emerald-400">{movie.matchPercentage}% Match</span>
                <span className="text-neutral-400">{movie.releaseYear}</span>
                <span className="px-1.5 py-0.5 border border-neutral-600 rounded text-xs text-neutral-300">
                  {movie.ageRating}
                </span>
                <span className="text-neutral-400 text-xs">{movie.duration}</span>
                <span className="px-1.5 py-0.5 bg-neutral-800 rounded text-xs text-neutral-200">
                  {movie.quality}
                </span>
              </div>

              <p className="text-neutral-300 text-sm leading-relaxed">
                {movie.description}
              </p>
            </div>

            <div className="space-y-3 text-xs text-neutral-400">
              <div>
                <span className="text-neutral-500">Distribution : </span>
                <span className="text-neutral-200">{movie.cast.join(", ")}</span>
              </div>
              {movie.director && (
                <div>
                  <span className="text-neutral-500">Réalisateur : </span>
                  <span className="text-neutral-200">{movie.director}</span>
                </div>
              )}
              <div>
                <span className="text-neutral-500">Genres : </span>
                <span className="text-neutral-200">{movie.genres.join(", ")}</span>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SEASONS & EPISODES SECTION FOR SERIES                        */}
          {/* ============================================================ */}
          {isSeries && (
            <div className="pt-6 border-t border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="w-12 h-1 bg-[#E50914] rounded-full mb-1.5" />
                  <h3 className="text-xl font-black text-white tracking-wide uppercase">Épisodes</h3>
                </div>

                {seasonsList.length > 1 && (
                  <div className="relative">
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(Number(e.target.value))}
                      className="bg-neutral-800 border border-neutral-700 text-white text-xs font-semibold px-4 py-2 rounded-md appearance-none pr-8 cursor-pointer outline-none focus:border-white"
                    >
                      {seasonsList.map((s) => (
                        <option key={s} value={s}>
                          Saison {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
              </div>

              {isLoadingEpisodes ? (
                <div className="py-8 text-center text-neutral-500 text-xs">
                  Chargement des épisodes en direct...
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 no-scrollbar">
                  {currentSeasonEpisodes.map((ep) => (
                    <div
                      key={ep.id}
                      onClick={() => onPlay(movie, ep.season, ep.episode)}
                      className="group flex items-center justify-between p-3 rounded-lg bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800/80 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-base font-bold text-neutral-500 w-6 text-center group-hover:text-white">
                          {ep.episode}
                        </span>

                        <div className="relative w-28 md:w-36 aspect-[16/9] rounded overflow-hidden bg-neutral-800 flex-none">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ep.thumbnail || movie.backdropUrl}
                            alt={ep.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-white/90 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white group-hover:text-[#E50914] transition-colors line-clamp-1">
                            {ep.title}
                          </h4>
                          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                            {ep.overview || "Regardez cet épisode en streaming HD."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <div className="hidden sm:block text-xs text-neutral-500 font-mono">
                          ~45m
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(ep);
                          }}
                          className="w-8 h-8 rounded-full border border-neutral-700 hover:border-white bg-black/40 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                          title="Télécharger cet épisode en 1080p Full HD"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* More Like This (Similar Titles) */}
          {similarMovies.length > 0 && (
            <div className="pt-6 border-t border-neutral-800">
              <h3 className="text-lg font-bold mb-4">Titres similaires</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {similarMovies.map((similar) => (
                  <div
                    key={similar.id}
                    onClick={() => onPlay(similar)}
                    className="group bg-neutral-900 rounded-lg overflow-hidden cursor-pointer border border-neutral-800 hover:border-neutral-600 transition-all"
                  >
                    <div className="relative aspect-[16/9] w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={similar.backdropUrl}
                        alt={similar.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                        <div className="w-10 h-10 rounded-full bg-white/90 group-hover:bg-white text-black flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                          <Play className="w-4 h-4 fill-black ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-start text-xs font-semibold mb-1">
                        <span className="text-emerald-400">{similar.matchPercentage}% Match</span>
                        <span className="text-neutral-500">{similar.duration}</span>
                      </div>
                      <p className="text-xs text-neutral-300 font-bold truncate">{similar.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
