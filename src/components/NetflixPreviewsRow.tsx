"use client";

import React from "react";
import { Movie } from "@/types";

interface NetflixPreviewsRowProps {
  movies: Movie[];
  onOpenModal: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
}

export default function NetflixPreviewsRow({
  movies,
  onOpenModal,
  onPlay,
}: NetflixPreviewsRowProps) {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="my-6 px-4 select-none">
      <h2 className="text-base sm:text-lg font-black text-white tracking-wide mb-3">
        Aperçus (Previews)
      </h2>

      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
        {movies.map((movie) => (
          <div
            key={movie.id}
            onClick={() => onOpenModal(movie)}
            className="flex flex-col items-center shrink-0 cursor-pointer group"
          >
            {/* Circular Avatar with Netflix Red Ring */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[2.5px] bg-gradient-to-tr from-[#E50914] via-[#ff4d58] to-[#E50914] shadow-lg group-hover:scale-105 transition-all">
              <div className="w-full h-full rounded-full overflow-hidden bg-neutral-900 border-2 border-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Red glow pulse */}
              <div className="absolute inset-0 rounded-full bg-[#E50914]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Title badge */}
            <span className="text-[11px] font-bold text-neutral-300 mt-2 text-center truncate max-w-[90px] group-hover:text-white">
              {movie.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
