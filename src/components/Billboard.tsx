"use client";

import React, { useState } from "react";
import { Play, Info, Volume2, VolumeX, Sparkles } from "lucide-react";
import { Movie } from "@/types";

interface BillboardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onMoreInfo: (movie: Movie) => void;
}

export default function Billboard({ movie, onPlay, onMoreInfo }: BillboardProps) {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <div className="relative h-[65vh] md:h-[85vh] w-full select-none">
      {/* Background Image with Netflix cinematic vignettes */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-[0.75]"
        />

        {/* Cinematic Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/40 to-transparent w-full md:w-[70%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30" />
      </div>

      {/* Hero Content */}
      <div className="relative max-w-7xl mx-auto px-4 md:px-8 h-full flex flex-col justify-center pb-12 md:pb-24">
        <div className="max-w-xl md:max-w-2xl space-y-4">
          {/* FilmFlex Original Pill */}
          {movie.isFilmFlexOriginal && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#E50914] text-white tracking-widest uppercase">
              <Sparkles className="w-3 h-3" /> FilmFlex Exclusive
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg">
            {movie.title}
          </h1>

          {/* Badges: Match, Year, Age, Quality */}
          <div className="flex items-center gap-3 text-sm font-semibold">
            <span className="text-emerald-400">{movie.matchPercentage}% Match</span>
            <span className="text-neutral-400">{movie.releaseYear}</span>
            <span className="px-1.5 py-0.5 border border-neutral-600 rounded text-xs text-neutral-300">
              {movie.ageRating}
            </span>
            <span className="px-1.5 py-0.5 bg-neutral-800 rounded text-xs text-neutral-200">
              {movie.quality}
            </span>
            <span className="text-neutral-400 text-xs">{movie.duration}</span>
          </div>

          {/* Overview */}
          <p className="text-neutral-300 text-sm md:text-base line-clamp-3 leading-relaxed drop-shadow-md">
            {movie.description}
          </p>

          {/* Buttons: Play & More Info */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onPlay(movie)}
              className="flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3 bg-white hover:bg-white/90 text-black font-bold rounded text-sm md:text-base transition-colors shadow-xl"
            >
              <Play className="w-5 h-5 fill-black" />
              <span>Play</span>
            </button>

            <button
              onClick={() => onMoreInfo(movie)}
              className="flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3 bg-neutral-600/70 hover:bg-neutral-600/50 text-white font-semibold rounded text-sm md:text-base backdrop-blur-sm transition-colors"
            >
              <Info className="w-5 h-5" />
              <span>More Info</span>
            </button>
          </div>
        </div>

        {/* Right side Mute & Age Rating Badge */}
        <div className="absolute right-0 bottom-24 hidden md:flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 rounded-full border border-neutral-500 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="bg-neutral-800/80 border-l-4 border-neutral-400 py-1 px-4 text-xs font-semibold text-white">
            {movie.ageRating}
          </div>
        </div>
      </div>
    </div>
  );
}
