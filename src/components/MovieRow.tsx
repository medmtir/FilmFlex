"use client";

import React, { useRef, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";
import { Movie, WatchProgress } from "@/types";

interface MovieRowProps {
  title: string;
  movies: Movie[];
  isTop10?: boolean;
  filterGenres?: string[];
  aspect?: "portrait" | "landscape";
  progressList?: WatchProgress[];
  myListIds: string[];
  onPlay: (movie: Movie) => void;
  onToggleMyList: (movie: Movie) => void;
  onOpenModal: (movie: Movie) => void;
}

export default function MovieRow({
  title,
  movies,
  isTop10 = false,
  filterGenres,
  aspect = "portrait",
  progressList = [],
  myListIds,
  onPlay,
  onToggleMyList,
  onOpenModal,
}: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const filteredMovies = useMemo(() => {
    if (!selectedGenre) return movies;
    return movies.filter((m) =>
      m.genres.some((g) => g.toLowerCase().includes(selectedGenre.toLowerCase()))
    );
  }, [movies, selectedGenre]);

  const checkScroll = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const handleScroll = (direction: "left" | "right") => {
    if (!rowRef.current) return;
    const { clientWidth } = rowRef.current;
    const scrollAmount = direction === "left" ? -clientWidth * 0.75 : clientWidth * 0.75;
    rowRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (movies.length === 0) return null;

  return (
    <div className="space-y-2 select-none relative group my-6 px-4 md:px-8">
      {/* Row Header: Title and Image 2 Category Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <h2 className="text-lg md:text-xl font-extrabold text-white tracking-wide hover:text-neutral-300 transition-colors cursor-pointer inline-flex items-center gap-1.5">
          {title}
        </h2>

        {filterGenres && filterGenres.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedGenre(null)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedGenre === null
                  ? "bg-white text-black font-bold shadow"
                  : "bg-white/10 hover:bg-white/20 text-neutral-300 border border-white/10"
              }`}
            >
              Tous
            </button>
            {filterGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre === selectedGenre ? null : genre)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedGenre === genre
                    ? "bg-[#E50914] text-white font-bold shadow-md shadow-[#E50914]/40"
                    : "bg-white/10 hover:bg-white/20 text-neutral-300 border border-white/10"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Row Carousel Container */}
      <div className="relative">
        {/* Left Scroll Chevron */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-0 bottom-0 z-30 w-10 md:w-12 bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm rounded-r-xl cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        {/* Scrollable Movies Track */}
        <div
          ref={rowRef}
          onScroll={checkScroll}
          className="flex items-center gap-2 md:gap-3.5 overflow-x-auto overflow-y-hidden no-scrollbar py-6 md:py-8 -my-4 md:-my-5 px-1"
          style={{ overflowY: "hidden", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {filteredMovies.map((movie, index) => {
            const progress = progressList.find((p) => p.movieId === movie.id);
            const isInList = myListIds.includes(movie.id);

            return (
              <MovieCard
                key={`${movie.id}-${index}`}
                movie={movie}
                progress={progress}
                isInMyList={isInList}
                aspect={aspect}
                top10Rank={isTop10 ? movie.top10Rank || index + 1 : undefined}
                onPlay={onPlay}
                onToggleMyList={onToggleMyList}
                onOpenModal={onOpenModal}
                isFirst={index === 0}
                isLast={index === filteredMovies.length - 1}
              />
            );
          })}
        </div>

        {/* Right Scroll Chevron */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-0 bottom-0 z-30 w-10 md:w-12 bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm rounded-l-xl cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>
    </div>
  );
}
