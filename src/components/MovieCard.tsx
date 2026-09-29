"use client";

import React, { useState } from "react";
import { Play } from "lucide-react";
import { Movie, WatchProgress } from "@/types";
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

        {/* Card Base Container */}
        <div
          onClick={() => onOpenModal(movie)}
          className={`relative z-10 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800/50 hover:border-[#E50914]/60 cursor-pointer transition-all duration-500 ease-out shadow-lg hover:shadow-[0_20px_40px_rgba(229,9,20,0.3)] hover:scale-[1.05] ${
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
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
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
            className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-[#E50914] hover:bg-[#b80710] text-white flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 active:scale-95 cursor-pointer hover:shadow-[#E50914]/50"
            title="Lecture directe"
            aria-label="Play movie"
          >
            <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
          </button>

          {/* Bottom Gradient Fade with Title & Meta */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent flex flex-col justify-end p-3 pointer-events-none">
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

    </div>
  );
}
