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

  return (
    <div
      className="relative flex-none group select-none transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
          className={`relative z-10 w-44 md:w-60 aspect-[16/9] rounded-md overflow-hidden bg-neutral-900 cursor-pointer transition-transform duration-300 ${
            top10Rank ? "w-36 md:w-48 aspect-[2/3]" : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={top10Rank ? movie.posterUrl : movie.backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:brightness-105 transition-all"
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

      {/* Floating Hover Card for Non-Touch Devices */}
      {isHovered && (
        <div
          className="hidden md:block absolute -top-16 left-0 right-0 z-30 w-72 bg-[#181818] rounded-md shadow-2xl overflow-hidden border border-neutral-800 animate-scale-up"
          style={{ transform: "scale(1.08)" }}
        >
          {/* Top Video Preview / Backdrop */}
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={movie.backdropUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />

            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
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
                  className="w-8 h-8 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center transition-colors shadow"
                  title="Play"
                >
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMyList(movie);
                  }}
                  className="w-8 h-8 rounded-full border border-neutral-500 hover:border-white bg-[#2a2a2a]/60 text-white flex items-center justify-center transition-colors"
                  title={isInMyList ? "Remove from My List" : "Add to My List"}
                >
                  {isInMyList ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                </button>

                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-8 h-8 rounded-full border border-neutral-500 hover:border-white bg-[#2a2a2a]/60 text-white flex items-center justify-center transition-colors"
                  title="I like this"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenModal(movie);
                }}
                className="w-8 h-8 rounded-full border border-neutral-500 hover:border-white bg-[#2a2a2a]/60 text-white flex items-center justify-center transition-colors"
                title="More Info"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Resume Time Info if applicable */}
            {progress && progress.currentSeconds > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Resume playback</span>
                  <span>
                    {Math.floor(progress.currentSeconds / 60)}m of {Math.floor(progress.totalSeconds / 60)}m
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
              <span className="text-emerald-400">{movie.matchPercentage}% Match</span>
              <span className="px-1 border border-neutral-600 rounded text-[10px] text-neutral-300">
                {movie.ageRating}
              </span>
              <span className="text-neutral-400 text-[11px]">{movie.duration}</span>
              <span className="text-[10px] px-1 bg-neutral-800 text-neutral-300 rounded">
                {movie.quality}
              </span>
            </div>

            {/* Genre tags */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-300">
              {movie.genres.map((g, idx) => (
                <span key={g} className="flex items-center gap-1.5">
                  {g}
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
