"use client";

import React, { useState } from "react";
import { Play, Plus, Check, ThumbsUp, ChevronDown, Sparkles } from "lucide-react";
import { Movie, WatchProgress } from "@/types";

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

  // Smart horizontal alignment: Never clip off left or right edge of the screen
  const horizontalAlign = isFirst
    ? "left-0 translate-x-0 origin-left"
    : isLast
    ? "right-0 left-auto translate-x-0 origin-right"
    : "left-1/2 -translate-x-1/2 origin-center";

  const hoverPositionClass = top10Rank || aspect === "portrait"
    ? `-top-6 md:-top-10 ${horizontalAlign} w-64 md:w-72`
    : `top-1/2 -translate-y-1/2 ${horizontalAlign} w-60 md:w-72`;

  const isPortrait = top10Rank || aspect === "portrait";

  return (
    <div
      className={`relative flex-none group select-none transition-all duration-300 ${
        isHovered ? "z-40" : "z-10"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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

        {/* Card Base Container (Rounded-2xl matching Image 2) */}
        <div
          onClick={() => onOpenModal(movie)}
          className={`relative z-10 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800/80 hover:border-neutral-600/80 cursor-pointer transition-all duration-300 shadow-md group-hover:shadow-2xl group-hover:scale-[1.03] ${
            isPortrait
              ? "w-36 sm:w-44 md:w-52 aspect-[2/3]"
              : "w-48 sm:w-60 md:w-68 aspect-[16/9]"
          }`}
        >
          {/* Card Poster / Backdrop */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isPortrait ? movie.posterUrl : movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* FilmFlex Original Mini Badge */}
          {movie.isFilmFlexOriginal && (
            <div className="absolute top-2.5 left-2.5 z-20">
              <span className="bg-[#E50914] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">
                FILMFLEX
              </span>
            </div>
          )}

          {/* Red Play Button Badge (Matching Image 2) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onPlay(movie);
            }}
            className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-[#E50914] hover:bg-[#b80710] text-white flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110 active:scale-95 cursor-pointer"
            title="Lecture directe"
          >
            <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
          </div>

          {/* Bottom Gradient Fade with Title & Meta */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-end p-3 pointer-events-none">
            <p className="text-xs sm:text-sm font-bold text-white drop-shadow truncate leading-tight">
              {movie.title}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-300 mt-1 font-mono">
              <span className="text-amber-400 font-bold">★ {(movie.matchPercentage ? (movie.matchPercentage / 10).toFixed(1) : "8.5")}</span>
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

      {/* Floating Netflix-Style Detailed Hover Card (Instant 60fps, Zero Lag, No YouTube Robot Lockouts) */}
      {isHovered && (
        <div
          className={`hidden md:block absolute ${hoverPositionClass} z-50 bg-[#161618] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden border border-neutral-700/80 animate-scale-up`}
        >
          {/* Top Video Preview / Backdrop */}
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={movie.backdropUrl || movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover animate-pulse-slow scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#161618] via-transparent to-transparent pointer-events-none z-20" />

            {/* Play Button Overlay */}
            <div
              onClick={() => onPlay(movie)}
              className="absolute inset-0 flex items-center justify-center cursor-pointer z-20 group/play"
            >
              <div className="w-12 h-12 rounded-full bg-[#E50914]/90 group-hover/play:bg-[#E50914] text-white flex items-center justify-center shadow-xl transition-transform group-hover/play:scale-110">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
            </div>

            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
              <span className="text-xs md:text-sm font-bold text-white drop-shadow truncate">
                {movie.title}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-3.5 space-y-2.5">
            {/* Action Buttons Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay(movie);
                  }}
                  className="w-8 h-8 rounded-full bg-[#E50914] hover:bg-[#b80710] text-white flex items-center justify-center transition-all shadow-md hover:scale-105 cursor-pointer"
                  title="Regarder maintenant"
                >
                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMyList(movie);
                  }}
                  className="w-8 h-8 rounded-full border border-neutral-500 hover:border-white bg-[#2a2a2a]/80 text-white flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
                  title={isInMyList ? "Retirer de Ma Liste" : "Ajouter à Ma Liste"}
                >
                  {isInMyList ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-8 h-8 rounded-full border border-neutral-500 hover:border-white bg-[#2a2a2a]/80 text-white flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
                  title="J'aime"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenModal(movie);
                }}
                className="w-8 h-8 rounded-full border border-neutral-500 hover:border-white bg-[#2a2a2a]/80 text-white flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
                title="Plus d'infos"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Resume Time Info if applicable */}
            {progress && progress.currentSeconds > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>Reprendre</span>
                  <span>
                    {Math.floor(progress.currentSeconds / 60)} min / {Math.floor(progress.totalSeconds / 60)} min
                  </span>
                </div>
                <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E50914]"
                    style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
              <span className="text-emerald-400 font-bold">{movie.matchPercentage}% Match</span>
              <span className="px-1.5 py-0.2 border border-neutral-600 rounded text-[9px] text-neutral-300">
                {movie.ageRating}
              </span>
              <span className="text-neutral-400 text-[10px]">{movie.duration}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-neutral-800 text-neutral-300 rounded font-mono font-semibold">
                {movie.quality}
              </span>
            </div>

            {/* Genre tags */}
            <div className="flex flex-wrap items-center gap-1 text-[10px] text-neutral-400">
              {movie.genres.slice(0, 3).map((g, idx, arr) => (
                <span key={g} className="flex items-center gap-1">
                  <span>{g}</span>
                  {idx < arr.length - 1 && <span className="text-neutral-600">•</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
