"use client";

import React, { useState, useMemo } from "react";
import { ArrowLeft, Play, Edit3, ChevronDown, Check, Trash2, Film, Tv } from "lucide-react";
import { Movie, WatchProgress } from "@/types";

interface MyListViewProps {
  movies: Movie[];
  progressList?: WatchProgress[];
  onPlay: (movie: Movie) => void;
  onOpenModal: (movie: Movie) => void;
  onRemoveFromList: (movie: Movie) => void;
  onBack?: () => void;
}

type FilterType = "all" | "series" | "movies" | "not_started" | "started";
type SortType = "date" | "title" | "rating";

export default function MyListView({
  movies,
  progressList = [],
  onPlay,
  onOpenModal,
  onRemoveFromList,
  onBack,
}: MyListViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeSort, setActiveSort] = useState<SortType>("date");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Filter logic matching media_1790623063448.png (TV Shows, Movies, Haven't Started, Started)
  const filteredMovies = useMemo(() => {
    let result = [...movies];

    if (activeFilter === "series") {
      result = result.filter(
        (m) =>
          m.type === "series" ||
          m.duration.toLowerCase().includes("saison") ||
          m.duration.toLowerCase().includes("season")
      );
    } else if (activeFilter === "movies") {
      result = result.filter(
        (m) =>
          m.type !== "series" &&
          !m.duration.toLowerCase().includes("saison") &&
          !m.duration.toLowerCase().includes("season")
      );
    } else if (activeFilter === "started") {
      result = result.filter((m) =>
        progressList.some((p) => p.movieId === m.id && p.percentage > 0)
      );
    } else if (activeFilter === "not_started") {
      result = result.filter(
        (m) => !progressList.some((p) => p.movieId === m.id && p.percentage > 0)
      );
    }

    if (activeSort === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (activeSort === "rating") {
      result.sort((a, b) => b.matchPercentage - a.matchPercentage);
    }

    return result;
  }, [movies, activeFilter, activeSort, progressList]);

  return (
    <div className="pt-20 sm:pt-24 pb-28 px-3 sm:px-6 md:px-8 max-w-3xl mx-auto select-none animate-fade-in text-white min-h-screen">
      {/* 1. Header (Matching media_1790623063448.png: ← My List, Edit Icon) */}
      <div className="flex items-center justify-between mb-4 pb-2">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Ma Liste
          </h1>
        </div>

        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`p-2 rounded-full transition-colors cursor-pointer ${
            isEditMode ? "bg-[#E50914] text-white" : "hover:bg-neutral-800 text-neutral-300 hover:text-white"
          }`}
          title="Modifier ma liste"
        >
          <Edit3 className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Filter Pills Row (TV Shows, Movies, Haven't Started, Started) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-2">
        {[
          { id: "all", label: "Tous" },
          { id: "series", label: "Séries (TV Shows)" },
          { id: "movies", label: "Films (Movies)" },
          { id: "not_started", label: "Non commencés" },
          { id: "started", label: "En cours" },
        ].map((pill) => (
          <button
            key={pill.id}
            onClick={() => setActiveFilter(pill.id as FilterType)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === pill.id
                ? "bg-white text-black font-bold shadow-md"
                : "bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 border border-neutral-700/60"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* 3. Sort Selector Dropdown */}
      <div className="relative mb-5">
        <button
          onClick={() => setShowSortMenu(!showSortMenu)}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <span>Trier par : </span>
          <span className="font-bold text-neutral-200">
            {activeSort === "date"
              ? "Date d'ajout"
              : activeSort === "title"
              ? "Titre (A-Z)"
              : "Mieux notés"}
          </span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {showSortMenu && (
          <div className="absolute top-7 left-0 bg-[#16161a] border border-neutral-800 rounded-xl p-1.5 shadow-2xl z-30 min-w-44 space-y-1 animate-scale-up">
            {[
              { id: "date", label: "Date d'ajout à la liste" },
              { id: "title", label: "Titre alphabétique (A-Z)" },
              { id: "rating", label: "Mieux notés (Match %)" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSort(s.id as SortType);
                  setShowSortMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                  activeSort === s.id
                    ? "bg-[#E50914]/20 text-white font-bold"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                }`}
              >
                <span>{s.label}</span>
                {activeSort === s.id && <Check className="w-3.5 h-3.5 text-[#E50914]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. List Items (Exact match to media_1790623063448.png) */}
      {filteredMovies.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <p className="text-base font-bold text-neutral-400">
            Aucun titre trouvé dans cette catégorie.
          </p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Ajoutez des films et séries en appuyant sur le bouton &ldquo;+ Ma Liste&rdquo; depuis le catalogue.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMovies.map((movie) => {
            const progress = progressList.find((p) => p.movieId === movie.id);
            return (
              <div
                key={movie.id}
                onClick={() => onOpenModal(movie)}
                className="group relative flex items-center justify-between gap-3.5 p-2 rounded-2xl bg-neutral-900/60 hover:bg-neutral-850 border border-neutral-800/70 hover:border-neutral-700 transition-all cursor-pointer shadow-md"
              >
                {/* Left: 16:9 Thumbnail with red FilmFlex badge */}
                <div className="relative w-32 sm:w-40 aspect-video rounded-xl overflow-hidden bg-neutral-950 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={movie.backdropUrl || movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-1.5 left-1.5 z-10">
                    <span className="bg-[#E50914] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow">
                      FILMFLEX
                    </span>
                  </div>

                  {/* Progress bar if started */}
                  {progress && progress.percentage > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
                      <div
                        className="h-full bg-[#E50914]"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Middle: Title & Metadata */}
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-white truncate group-hover:text-[#E50914] transition-colors">
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400">
                    <span className="text-emerald-400 font-bold">{movie.matchPercentage}%</span>
                    <span>•</span>
                    <span>{movie.releaseYear}</span>
                    <span>•</span>
                    <span className="uppercase text-[9px] bg-neutral-800 px-1 py-0.2 rounded text-neutral-300">
                      {movie.type === "series" ? "Série" : "Film"}
                    </span>
                  </div>
                </div>

                {/* Right: Circular White Play Button or Delete if edit mode */}
                <div className="shrink-0 pr-2">
                  {isEditMode ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFromList(movie);
                      }}
                      className="w-9 h-9 rounded-full bg-red-950/80 border border-red-500/50 hover:bg-red-900 text-red-300 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                      title="Supprimer de ma liste"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(movie);
                      }}
                      className="w-10 h-10 rounded-full border-2 border-white/90 bg-black/40 hover:bg-[#E50914] hover:border-[#E50914] flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
                      title="Lire maintenant"
                    >
                      <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
