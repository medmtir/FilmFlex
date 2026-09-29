"use client";

import React, { useState, useMemo, useRef } from "react";
import { Play, Plus, Check, Info } from "lucide-react";
import { Movie, WatchProgress } from "@/types";
import { INITIAL_MOVIES, TURKISH_MOVIES } from "@/lib/constants";
import OptimizedImage from "@/components/OptimizedImage";

interface MovieCardProps {
  movie: Movie;
  progress?: WatchProgress;
  isInMyList: boolean;
  onPlay: (movie: Movie) => void;
  onToggleMyList: (movie: Movie) => void;
  onOpenModal: (movie: Movie) => void;
  top10Rank?: number;
  isFirst?: boolean;
  isLast?: boolean;
  aspect?: "portrait" | "landscape";
}

export default function MovieCard({
  movie,
  progress,
  isInMyList,
  onPlay,
  onToggleMyList,
  onOpenModal,
  top10Rank,
  isFirst = false,
  isLast = false,
  aspect = "portrait",
}: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Compute 5 related items for the Flixer RELATED section (Exact match to media_1790694083171.png)
  const relatedMovies = useMemo(() => {
    const pool = [...TURKISH_MOVIES, ...INITIAL_MOVIES];
    const sameGenre = pool.filter(
      (m) => m.id !== movie.id && m.genres?.some((g) => movie.genres?.includes(g))
    );
    return sameGenre.length >= 5
      ? sameGenre.slice(0, 5)
      : pool.filter((m) => m.id !== movie.id).slice(0, 5);
  }, [movie]);

  const isPortrait = top10Rank || aspect === "portrait";

  // Debounced hover handlers so mouse transitions are silky smooth
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 180);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  // Horizontal alignment matching Flixer so it never clips off-screen
  const horizontalAlign = isFirst
    ? "left-0 origin-left"
    : isLast
    ? "right-0 origin-right"
    : "left-1/2 -translate-x-1/2 origin-center";

  const isSeries =
    movie.type === "series" ||
    (movie.duration && movie.duration.toLowerCase().includes("saison")) ||
    (movie.duration && movie.duration.toLowerCase().includes("season"));

  return (
    <div
      className={`relative flex-none group select-none ${
        isHovered ? "z-50" : "z-10"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center">
        {/* Stylized Top 10 Rank Number if Top 10 */}
        {top10Rank && (
          <div className="flex-none -mr-4 z-0">
            <span
              className="text-7xl md:text-9xl font-black tracking-tighter text-transparent select-none"
              style={{
                WebkitTextStroke: "4px #595959",
                color: "#141414",
              }}
            >
              {top10Rank}
            </span>
          </div>
        )}

        {/* Card Base Container */}
        <div
          onClick={() => onOpenModal(movie)}
          className={`relative z-10 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800/60 hover:border-[#E50914]/60 cursor-pointer transition-all duration-300 ease-out shadow-lg hover:shadow-[0_15px_35px_rgba(229,9,20,0.25)] ${
            isPortrait
              ? "w-36 sm:w-44 md:w-52 aspect-[2/3]"
              : "w-48 sm:w-60 md:w-68 aspect-[16/9]"
          }`}
        >
          {/* Card Poster / Backdrop */}
          <OptimizedImage
            src={isPortrait ? movie.posterUrl : movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            fill
            priority={false}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* FilmFlex Original Mini Badge */}
          {movie.isFilmFlexOriginal && (
            <div className="absolute top-2.5 left-2.5 z-20">
              <span className="bg-[#E50914] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">
                FILMFLEX
              </span>
            </div>
          )}

          {/* Red Play Button Badge */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(movie);
            }}
            className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-[#E50914] hover:bg-[#b80710] text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer hover:shadow-[#E50914]/50"
            title="Lecture directe"
            aria-label="Play movie"
          >
            <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
          </button>

          {/* Bottom Gradient Fade with Title & Meta */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-3 pointer-events-none">
            <p className="text-xs sm:text-sm font-bold text-white drop-shadow truncate leading-tight">
              {movie.title}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-300 mt-1 font-mono">
              <span className="text-amber-400 font-bold">
                ★ {movie.matchPercentage ? (movie.matchPercentage / 10).toFixed(1) : "8.5"}
              </span>
              <span>•</span>
              <span className="text-neutral-400">{movie.ageRating}</span>
              <span>•</span>
              <span className="text-neutral-400">{movie.duration}</span>
            </div>
          </div>

          {/* Continue Watching Red Progress Bar */}
          {progress && progress.percentage > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800 z-30">
              <div
                className="h-full bg-[#E50914]"
                style={{ width: `${Math.min(progress.percentage, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* EXACT FLIXER HOVER POPUP CARD (MATCHING media_1790694083171) */}
      {/* ============================================================ */}
      {isHovered && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`hidden md:block absolute -top-8 ${horizontalAlign} w-80 z-50 bg-[#18181b] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden border border-neutral-700/70 transition-all duration-300 ease-out animate-scale-up backdrop-blur-2xl`}
        >
          {/* Top Video Preview / Backdrop */}
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            <OptimizedImage
              src={movie.backdropUrl || movie.posterUrl}
              alt={movie.title}
              fill
              priority={false}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-[#18181b]/30 to-transparent pointer-events-none z-10" />

            {/* Title & Episode info directly over lower preview matching Flixer */}
            <div className="absolute bottom-2.5 left-4 right-4 z-20 pointer-events-none">
              <h4 className="text-sm font-bold text-white truncate drop-shadow-md">
                {movie.title}
              </h4>
              <p className="text-[11px] text-neutral-300 font-mono mt-0.5">
                {isSeries
                  ? progress
                    ? `S1:E1 • ${Math.round(progress.percentage)}% complete`
                    : "S1:E1 • Nouveauté"
                  : movie.duration}
              </p>
            </div>
          </div>

          {/* Card Body matching media_1790694083171.png */}
          <div className="p-4 space-y-3">
            {/* Action Buttons Row: White Play (▶), Dark Plus (+), Dark Info (i) */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay(movie);
                  }}
                  className="w-9 h-9 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                  title="Regarder"
                  aria-label="Regarder"
                >
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMyList(movie);
                  }}
                  className="w-9 h-9 rounded-full bg-[#27272a] hover:bg-[#3f3f46] text-white border border-neutral-600/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  title={isInMyList ? "Retirer de Ma Liste" : "Ajouter à Ma Liste"}
                >
                  {isInMyList ? (
                    <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                  ) : (
                    <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                  )}
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenModal(movie);
                }}
                className="w-9 h-9 rounded-full bg-[#27272a] hover:bg-[#3f3f46] text-white border border-neutral-600/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
                title="Plus d'informations"
              >
                <Info className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Badges Row: 83% Match, HD, Year */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-[#46d369] font-bold">
                {movie.matchPercentage}% Match
              </span>
              <span className="border border-neutral-500/80 px-1.5 py-0.2 rounded text-[10px] text-neutral-300 font-bold uppercase">
                {movie.quality || "HD"}
              </span>
              <span className="text-neutral-400 text-xs font-medium">
                {movie.releaseYear}
              </span>
            </div>

            {/* 2 Lines Overview Description */}
            <p className="text-[11px] text-neutral-300 line-clamp-2 leading-relaxed">
              {movie.description}
            </p>

            {/* ============================================================ */}
            {/* RELATED SECTION: 5 Mini Thumbnails (Exact Flixer Match)     */}
            {/* ============================================================ */}
            {relatedMovies.length > 0 && (
              <div className="pt-2 border-t border-neutral-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                  RELATED
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {relatedMovies.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenModal(rel);
                      }}
                      className="aspect-[2/3] rounded-md overflow-hidden bg-neutral-800 border border-neutral-700/60 hover:border-white transition-all cursor-pointer hover:scale-105 shadow"
                      title={rel.title}
                    >
                      <OptimizedImage
                        src={rel.posterUrl || rel.backdropUrl}
                        alt={rel.title}
                        fill
                        priority={false}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
