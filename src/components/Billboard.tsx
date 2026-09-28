"use client";

import React, { useState } from "react";
import { Play, Plus, Check, Info, Volume2, VolumeX, Sparkles } from "lucide-react";
import { Movie } from "@/types";

interface BillboardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onMoreInfo: (movie: Movie) => void;
  onToggleMyList?: (movie: Movie) => void;
  isInMyList?: boolean;
}

export default function Billboard({
  movie,
  onPlay,
  onMoreInfo,
  onToggleMyList,
  isInMyList = false,
}: BillboardProps) {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-24 md:pt-28 pb-4 select-none">
      {/* Rounded Showcase Card matching Image 2 */}
      <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-gradient-to-r from-[#18181b] via-[#121216] to-[#0c0c0e] border border-neutral-800/80 shadow-[0_25px_60px_rgba(0,0,0,0.9)] min-h-[380px] md:min-h-[450px] flex flex-col md:flex-row items-center">
        {/* Background / Character Visual on Left Side */}
        <div className="absolute inset-0 md:w-[65%] h-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-center filter brightness-[0.8] md:brightness-95 transition-transform duration-1000 hover:scale-105"
          />

          {/* Smooth radial & directional gradients into the card background */}
          <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-transparent via-[#121216]/70 to-[#121216] z-10" />
          <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-[#121216] via-transparent to-transparent z-10" />
          <div className="md:hidden absolute inset-0 bg-gradient-to-t from-[#121216] via-[#121216]/80 to-transparent z-10" />
        </div>

        {/* Foreground Content on Right Side */}
        <div className="relative z-20 w-full md:w-[52%] md:ml-auto p-6 md:p-12 flex flex-col justify-center space-y-4">
          {/* FilmFlex Exclusive pill */}
          {movie.isFilmFlexOriginal && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#E50914] text-white tracking-widest uppercase shadow-md shadow-red-950/60 w-fit">
              <Sparkles className="w-3 h-3" /> FilmFlex Exclusif
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
            {movie.title}
          </h1>

          {/* Overview */}
          <p className="text-neutral-300 text-xs md:text-sm line-clamp-3 md:line-clamp-4 leading-relaxed max-w-xl drop-shadow">
            {movie.description}
          </p>

          {/* Badges / Pill Tags (Matching Image 2) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {movie.genres.slice(0, 3).map((g) => (
              <span
                key={g}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 text-neutral-200 border border-white/10 transition-colors"
              >
                {g}
              </span>
            ))}
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-neutral-200 border border-white/10">
              {movie.ageRating || "PG-13"}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <span>⭐</span>
              <span>{movie.matchPercentage ? (movie.matchPercentage / 10).toFixed(1) : "8.7"}/10</span>
            </span>
          </div>

          {/* Action Buttons: Watch Now & Add to My List */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onPlay(movie)}
              className="flex items-center gap-2.5 px-7 py-3 bg-[#E50914] hover:bg-[#b80710] text-white font-bold rounded-full text-sm md:text-base transition-all shadow-lg shadow-[#E50914]/40 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                <Play className="w-3 h-3 fill-black text-black ml-0.5" />
              </div>
              <span>Watch Now</span>
            </button>

            {onToggleMyList ? (
              <button
                onClick={() => onToggleMyList(movie)}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold rounded-full text-sm md:text-base backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                {isInMyList ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>In My List</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add to My List</span>
                  </>
                )}
              </button>
            ) : null}

            <button
              onClick={() => onMoreInfo(movie)}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-all hover:scale-105"
              title="Plus d'infos"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mute button on top right */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full border border-white/20 bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-all shadow-md"
          title={isMuted ? "Activer le son" : "Couper le son"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
