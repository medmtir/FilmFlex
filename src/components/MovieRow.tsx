"use client";

import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";
import { Movie, WatchProgress } from "@/types";

interface MovieRowProps {
  title: string;
  movies: Movie[];
  isTop10?: boolean;
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
  progressList = [],
  myListIds,
  onPlay,
  onToggleMyList,
  onOpenModal,
}: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
      {/* Row Title */}
      <h2 className="text-lg md:text-xl font-bold text-white tracking-wide hover:text-neutral-300 transition-colors cursor-pointer inline-flex items-center gap-1">
        {title}
      </h2>

      {/* Row Carousel Container */}
      <div className="relative">
        {/* Left Scroll Chevron */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-0 bottom-0 z-20 w-10 md:w-12 bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-[2px]"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        {/* Scrollable Movies Track with generous padding so hover cards never clip */}
        <div
          ref={rowRef}
          onScroll={checkScroll}
          className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar py-12 md:py-16 -my-8 md:-my-10 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {movies.map((movie, index) => {
            const progress = progressList.find((p) => p.movieId === movie.id);
            const isInList = myListIds.includes(movie.id);

            return (
              <MovieCard
                key={`${movie.id}-${index}`}
                movie={movie}
                progress={progress}
                isInMyList={isInList}
                top10Rank={isTop10 ? movie.top10Rank || index + 1 : undefined}
                onPlay={onPlay}
                onToggleMyList={onToggleMyList}
                onOpenModal={onOpenModal}
                isFirst={index === 0}
                isLast={index === movies.length - 1}
              />
            );
          })}
        </div>

        {/* Right Scroll Chevron */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-0 bottom-0 z-20 w-10 md:w-12 bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-[2px]"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>
    </div>
  );
}
