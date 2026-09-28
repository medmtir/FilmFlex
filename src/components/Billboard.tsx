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
  return (
    <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-20 md:pt-28 pb-2 select-none">
      {/* ============================================================ */}
      {/* 1. MOBILE VERTICAL BILLBOARD (EXACT MATCH TO NETFLIX SCREEN 1) */}
      {/* ============================================================ */}
      <div className="md:hidden relative w-full h-[65vh] rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border border-neutral-800">
        {/* Full portrait poster image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={movie.posterUrl || movie.backdropUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-[0.9]"
        />

        {/* FilmFlex Film badge on top */}
        <div className="absolute top-4 left-4 z-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-[#E50914] text-white tracking-widest uppercase shadow-md shadow-red-950">
            <Sparkles className="w-3 h-3" /> FilmFlex Original
          </div>
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e12] via-[#0e0e12]/60 to-transparent z-10" />

        {/* Bottom controls & info */}
        <div className="absolute bottom-4 left-0 right-0 z-20 px-4 text-center space-y-3">
          {/* Title */}
          <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-lg uppercase leading-tight">
            {movie.title}
          </h1>

          {/* Genre tags separated by dots */}
          <p className="text-xs text-neutral-300 font-medium truncate max-w-xs mx-auto">
            {movie.genres.join(" • ")}
          </p>

          {/* 3 Buttons: + My List | Big White ▶ Play | ⓘ Info (Exact Match to Screen 1) */}
          <div className="flex items-center justify-around max-w-xs mx-auto pt-1">
            {/* My List */}
            {onToggleMyList && (
              <button
                onClick={() => onToggleMyList(movie)}
                className="flex flex-col items-center gap-1 text-white hover:text-neutral-300 transition-colors cursor-pointer w-16"
              >
                {isInMyList ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                <span className="text-[10px] font-bold">Ma Liste</span>
              </button>
            )}

            {/* Big White Play Button (Screen 1) */}
            <button
              onClick={() => onPlay(movie)}
              className="flex items-center gap-2 px-7 py-2.5 bg-white text-black font-black text-sm rounded-lg hover:bg-neutral-200 transition-all shadow-xl active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Lecture</span>
            </button>

            {/* Info */}
            <button
              onClick={() => onMoreInfo(movie)}
              className="flex flex-col items-center gap-1 text-white hover:text-neutral-300 transition-colors cursor-pointer w-16"
            >
              <Info className="w-5 h-5" />
              <span className="text-[10px] font-bold">Infos</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. DESKTOP WIDE SHOWCASE CARD (SCREEN 2/DESKTOP DESIGN)       */}
      {/* ============================================================ */}
      <div className="hidden md:flex relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-[#18181b] via-[#121216] to-[#0c0c0e] border border-neutral-800/80 shadow-[0_25px_60px_rgba(0,0,0,0.9)] min-h-[440px] items-center">
        {/* Background / Character Visual on Left Side */}
        <div className="absolute inset-0 w-[65%] h-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-center filter brightness-95 transition-transform duration-1000 hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#121216]/70 to-[#121216] z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-transparent to-transparent z-10" />
        </div>

        {/* Foreground Content on Right Side */}
        <div className="relative z-20 w-[52%] ml-auto p-12 flex flex-col justify-center space-y-4">
          {movie.isFilmFlexOriginal && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#E50914] text-white tracking-widest uppercase shadow-md shadow-red-950/60 w-fit">
              <Sparkles className="w-3 h-3" /> FilmFlex Exclusif
            </div>
          )}

          <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
            {movie.title}
          </h1>

          <p className="text-neutral-300 text-sm line-clamp-4 leading-relaxed max-w-xl drop-shadow">
            {movie.description}
          </p>

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
              <span>
                {movie.matchPercentage
                  ? (movie.matchPercentage / 10).toFixed(1)
                  : "8.7"}
                /10
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onPlay(movie)}
              className="flex items-center gap-2.5 px-7 py-3 bg-[#E50914] hover:bg-[#b80710] text-white font-bold rounded-full text-base transition-all shadow-lg shadow-[#E50914]/40 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                <Play className="w-3 h-3 fill-black text-black ml-0.5" />
              </div>
              <span>Lecture</span>
            </button>

            {onToggleMyList && (
              <button
                onClick={() => onToggleMyList(movie)}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold rounded-full text-base backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                {isInMyList ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Dans Ma Liste</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Ajouter à Ma Liste</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => onMoreInfo(movie)}
              className="p-3 bg-white/10 hover:bg-white/20 border border-white/25 text-white rounded-full backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Plus d'infos"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
