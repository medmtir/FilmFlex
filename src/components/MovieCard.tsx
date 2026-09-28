"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Plus, Check, ThumbsUp, ChevronDown } from "lucide-react";
import { Movie, WatchProgress } from "@/types";

interface MovieCardProps {
  movie: Movie;
  progress?: WatchProgress;
  isInMyList: boolean;
  onPlay: (movie: Movie) => void;
  onToggleMyList: (movie: Movie) => void;
  onOpenModal: (movie: Movie) => void;
  top10Rank?: number;
}

export default function MovieCard({
  movie,
  progress,
  isInMyList,
  onPlay,
  onToggleMyList,
  onOpenModal,
  top10Rank,
}: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    // 500ms delay to start trailer preview like Netflix
    hoverTimerRef.current = setTimeout(() => {
      setShowTrailer(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowTrailer(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  return (
    <div
      className="relative flex-none group select-none transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center">
        {/* Stylized Top 10 Rank Number */}
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

        {/* Card Thumbnail */}
        <div
          onClick={() => onOpenModal(movie)}
          className={`relative z-10 w-44 md:w-60 aspect-[16/9] rounded-md overflow-hidden bg-neutral-900 cursor-pointer transition-transform duration-300 hover:brightness-105 ${
            top10Rank ? "w-36 md:w-48 aspect-[2/3]" : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={top10Rank ? movie.posterUrl : movie.backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* FilmFlex Original Mini Badge */}
          {movie.isFilmFlexOriginal && (
            <div className="absolute top-2 left-2 z-10">
              <span className="bg-[#E50914] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                FILMFLEX
              </span>
            </div>
          )}

          {/* Continue Watching Red Progress Bar */}
          {progress && progress.percentage > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800">
              <div
                className="h-full bg-[#E50914]"
                style={{ width: `${Math.min(progress.percentage, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Netflix-Style Hover Card with Video Preview */}
      {isHovered && (
        <div
          className="hidden md:block absolute -top-24 left-1/2 -translate-x-1/2 z-50 w-80 bg-[#181818] rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.95)] overflow-hidden border border-neutral-700/80 animate-scale-up"
        >
          {/* Top Video Preview / Backdrop */}
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
            {showTrailer && movie.trailerYoutubeId ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${movie.trailerYoutubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${movie.trailerYoutubeId}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1`}
                className="w-full h-full object-cover scale-135 pointer-events-none border-0"
                allow="autoplay; encrypted-media"
                tabIndex={-1}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={movie.backdropUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="text-sm font-bold text-white drop-shadow truncate">
                {movie.title}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-3.5 space-y-3">
            {/* Action Buttons Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay(movie);
                  }}
                  className="w-9 h-9 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center transition-all shadow-md hover:scale-105"
                  title="Lecture"
                >
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMyList(movie);
                  }}
                  className="w-9 h-9 rounded-full border border-neutral-500 hover:border-white bg-[#2a2a2a]/80 text-white flex items-center justify-center transition-all hover:scale-105"
                  title={isInMyList ? "Retirer de Ma Liste" : "Ajouter à Ma Liste"}
                >
                  {isInMyList ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                </button>

                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-9 h-9 rounded-full border border-neutral-500 hover:border-white bg-[#2a2a2a]/80 text-white flex items-center justify-center transition-all hover:scale-105"
                  title="J'aime"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenModal(movie);
                }}
                className="w-9 h-9 rounded-full border border-neutral-500 hover:border-white bg-[#2a2a2a]/80 text-white flex items-center justify-center transition-all hover:scale-105"
                title="Plus d'infos"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Resume Time Info if applicable */}
            {progress && progress.currentSeconds > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Reprendre la lecture</span>
                  <span>
                    {Math.floor(progress.currentSeconds / 60)} min / {Math.floor(progress.totalSeconds / 60)} min
                  </span>
                </div>
                <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E50914]"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-emerald-400 font-bold">{movie.matchPercentage}% Match</span>
              <span className="px-1.5 py-0.5 border border-neutral-600 rounded text-[10px] text-neutral-300">
                {movie.ageRating}
              </span>
              <span className="text-neutral-400 text-[11px]">{movie.duration}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded font-mono font-semibold">
                {movie.quality}
              </span>
            </div>

            {/* Genre tags */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-300">
              {movie.genres.map((g, idx) => (
                <span key={g} className="flex items-center gap-1.5">
                  <span>{g}</span>
                  {idx < movie.genres.length - 1 && <span className="text-neutral-600">•</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
