"use client";

import React, { useState, useMemo } from "react";
import { Play, Plus, Check, Info, Search, Sparkles } from "lucide-react";
import { Movie, WatchProgress } from "@/types";

interface CategoryGridViewProps {
  title: string;
  badge: string;
  description: string;
  movies: Movie[];
  filterGenres?: string[];
  progressList?: WatchProgress[];
  myListIds: string[];
  onPlay: (movie: Movie) => void;
  onToggleMyList: (movie: Movie) => void;
  onOpenModal: (movie: Movie) => void;
}

export default function CategoryGridView({
  title,
  badge,
  description,
  movies,
  filterGenres = [],
  progressList = [],
  myListIds,
  onPlay,
  onToggleMyList,
  onOpenModal,
}: CategoryGridViewProps) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState("");

  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      const matchGenre = !selectedGenre
        ? true
        : m.genres.some((g) => g.toLowerCase().includes(selectedGenre.toLowerCase()));
      const matchSearch = !localSearch.trim()
        ? true
        : m.title.toLowerCase().includes(localSearch.toLowerCase()) ||
          (m.originalTitle && m.originalTitle.toLowerCase().includes(localSearch.toLowerCase())) ||
          m.genres.some((g) => g.toLowerCase().includes(localSearch.toLowerCase()));
      return matchGenre && matchSearch;
    });
  }, [movies, selectedGenre, localSearch]);

  return (
    <div className="pt-24 sm:pt-28 pb-24 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto select-none animate-fade-in">
      {/* Category Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#18181c] via-[#121216] to-black border border-neutral-800 p-6 sm:p-10 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#E50914]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E50914]/20 text-[#ff4d58] border border-[#E50914]/40 mb-3 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{badge}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
            {title}
          </h1>

          <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed mb-6">
            {description}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-neutral-300 bg-neutral-900/80 px-3 py-1.5 rounded-full border border-neutral-800">
              {filteredMovies.length} {filteredMovies.length > 1 ? "titres disponibles" : "titre"}
            </span>

            {/* Quick in-category search */}
            <div className="relative flex items-center bg-black/60 border border-neutral-700/80 rounded-full px-3 py-1.5 text-xs text-white">
              <Search className="w-3.5 h-3.5 text-neutral-400 mr-2" />
              <input
                type="text"
                placeholder="Filtrer dans cette catégorie..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="bg-transparent outline-none placeholder-neutral-500 text-xs w-40 sm:w-56"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      {filterGenres.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mb-6">
          <button
            onClick={() => setSelectedGenre(null)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedGenre === null
                ? "bg-[#E50914] text-white shadow-lg shadow-[#E50914]/30"
                : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-800"
            }`}
          >
            Tous ({movies.length})
          </button>
          {filterGenres.map((genre) => {
            const count = movies.filter((m) =>
              m.genres.some((g) => g.toLowerCase().includes(genre.toLowerCase()))
            ).length;
            return (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre === selectedGenre ? null : genre)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedGenre === genre
                    ? "bg-[#E50914] text-white shadow-lg shadow-[#E50914]/30"
                    : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-800"
                }`}
              >
                {genre} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid of Movie & Anime Cards */}
      {filteredMovies.length === 0 ? (
        <div className="py-20 text-center text-neutral-500">
          <p className="text-lg">Aucun titre ne correspond aux filtres.</p>
          <button
            onClick={() => {
              setSelectedGenre(null);
              setLocalSearch("");
            }}
            className="mt-3 px-4 py-2 bg-[#E50914] text-white text-xs font-bold rounded-full"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-5">
          {filteredMovies.map((movie) => {
            const isInList = myListIds.includes(movie.id);
            const progress = progressList.find((p) => p.movieId === movie.id);

            return (
              <div
                key={movie.id}
                className="group relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800/80 hover:border-neutral-500 hover:shadow-2xl hover:shadow-[#E50914]/20 transition-all duration-300 flex flex-col"
              >
                {/* Poster container */}
                <div
                  onClick={() => onOpenModal(movie)}
                  className="relative aspect-[2/3] w-full overflow-hidden cursor-pointer bg-neutral-950"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Quality Badge */}
                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-[10px] font-black text-white px-2 py-0.5 rounded-md border border-white/10 uppercase">
                    {movie.quality || "4K"}
                  </div>

                  {/* Rating / Match Badge */}
                  <div className="absolute top-2 left-2 bg-emerald-950/80 backdrop-blur-md text-[10px] font-black text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    {movie.matchPercentage}%
                  </div>

                  {/* Watch Progress bar */}
                  {progress && progress.percentage > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
                      <div
                        className="h-full bg-[#E50914]"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  )}

                  {/* Quick Play Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(movie);
                      }}
                      className="w-11 h-11 rounded-full bg-[#E50914] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-red-950 cursor-pointer"
                      title="Lire maintenant"
                    >
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenModal(movie);
                      }}
                      className="w-10 h-10 rounded-full bg-neutral-900/90 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-neutral-700 cursor-pointer"
                      title="Plus d'infos"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info Card */}
                <div className="p-3 flex-1 flex flex-col justify-between bg-[#121216]">
                  <div>
                    <h3
                      onClick={() => onOpenModal(movie)}
                      className="text-xs sm:text-sm font-bold text-white truncate cursor-pointer hover:text-[#E50914] transition-colors"
                      title={movie.title}
                    >
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-1">
                      <span>{movie.releaseYear}</span>
                      <span>•</span>
                      <span className="truncate max-w-[90px]">{movie.genres[0]}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-neutral-800/60">
                    <button
                      onClick={() => onPlay(movie)}
                      className="flex-1 py-1.5 px-2 bg-[#E50914] hover:bg-[#b80710] text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm shadow-[#E50914]/20"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Regarder</span>
                    </button>

                    <button
                      onClick={() => onToggleMyList(movie)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isInList
                          ? "bg-emerald-950/60 border-emerald-600/50 text-emerald-400"
                          : "bg-neutral-800/80 hover:bg-neutral-700 border-neutral-700 text-neutral-300 hover:text-white"
                      }`}
                      title={isInList ? "Retirer de ma liste" : "Ajouter à ma liste"}
                    >
                      {isInList ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
