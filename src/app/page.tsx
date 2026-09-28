"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Billboard from "@/components/Billboard";
import MovieRow from "@/components/MovieRow";
import MovieModal from "@/components/MovieModal";
import VideoPlayer from "@/components/VideoPlayer";
import ProfileGate from "@/components/ProfileGate";
import PaywallModal from "@/components/PaywallModal";
import FilmFlexLogo from "@/components/FilmFlexLogo";
import { Home, Film, Tv, Flame, Bookmark } from "lucide-react";
import { Movie, Profile, UserAccount, WatchProgress } from "@/types";
import { INITIAL_MOVIES, INITIAL_SERIES } from "@/lib/constants";
import {
  getStoredUser,
  saveUser,
  getProfileProgress,
  getMyList,
  toggleMyList as toggleMyListStorage,
} from "@/lib/storage";

export default function HomePage() {
  // 1. User & Profiles State
  const [user, setUser] = useState<UserAccount | null>(null);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [showProfileGate, setShowProfileGate] = useState(false);

  // 2. Active Tab & Search
  const [activeTab, setActiveTab] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");

  // 3. Modals & Player State
  const [selectedMovieForModal, setSelectedMovieForModal] = useState<Movie | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [playerSeason, setPlayerSeason] = useState<number>(1);
  const [playerEpisode, setPlayerEpisode] = useState<number>(1);
  const [showPaywall, setShowPaywall] = useState(false);

  // 4. Profile-specific state (Continue Watching & My List)
  const [progressList, setProgressList] = useState<WatchProgress[]>([]);
  const [myListIds, setMyListIds] = useState<string[]>([]);

  // 5. Dynamic Stremio Movie State
  const [liveMovies, setLiveMovies] = useState<Movie[]>(INITIAL_MOVIES);
  const [actionMovies, setActionMovies] = useState<Movie[]>([]);
  const [scifiMovies, setScifiMovies] = useState<Movie[]>([]);
  const [comedyMovies, setComedyMovies] = useState<Movie[]>([]);
  const [seriesMovies, setSeriesMovies] = useState<Movie[]>(INITIAL_SERIES);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);

    const defaultProf =
      stored.profiles.find((p) => p.id === stored.activeProfileId) || stored.profiles[0];

    if (defaultProf?.pinCode) {
      setShowProfileGate(true);
    } else {
      setActiveProfile(defaultProf);
    }
  }, []);

  // Update profile data when active profile changes
  useEffect(() => {
    if (activeProfile) {
      setProgressList(getProfileProgress(activeProfile.id));
      setMyListIds(getMyList(activeProfile.id));
    }
  }, [activeProfile]);

  // Fetch Live Movies from Cinemeta
  useEffect(() => {
    // 1. Top Movies
    fetch("/api/catalog")
      .then((res) => res.json())
      .then((data) => {
        if (data.movies && data.movies.length > 0) {
          setLiveMovies(data.movies);
        }
      })
      .catch((err) => console.error("Error fetching live catalog:", err));

    // 2. Action
    fetch("/api/catalog?genre=Action")
      .then((res) => res.json())
      .then((data) => {
        if (data.movies && data.movies.length > 0) {
          setActionMovies(data.movies);
        }
      })
      .catch((err) => console.error(err));

    // 3. Sci-Fi
    fetch("/api/catalog?genre=Science%20Fiction")
      .then((res) => res.json())
      .then((data) => {
        if (data.movies && data.movies.length > 0) {
          setScifiMovies(data.movies);
        }
      })
      .catch((err) => console.error(err));

    // 4. Comedy
    fetch("/api/catalog?genre=Comedy")
      .then((res) => res.json())
      .then((data) => {
        if (data.movies && data.movies.length > 0) {
          setComedyMovies(data.movies);
        }
      })
      .catch((err) => console.error(err));

    // 5. Series
    fetch("/api/catalog?type=series")
      .then((res) => res.json())
      .then((data) => {
        if (data.movies && data.movies.length > 0) {
          setSeriesMovies(data.movies);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Real-time Live Stremio Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounce = setTimeout(() => {
      fetch(`/api/catalog?search=${encodeURIComponent(searchQuery.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(data.movies || []);
          setIsSearching(false);
        })
        .catch(() => setIsSearching(false));
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelectProfile = (profile: Profile) => {
    if (!user) return;
    const updatedUser = { ...user, activeProfileId: profile.id };
    setUser(updatedUser);
    saveUser(updatedUser);
    setActiveProfile(profile);
    setShowProfileGate(false);
  };

  const handleUpdateProfiles = (updatedProfiles: Profile[]) => {
    if (!user) return;
    const updatedUser = { ...user, profiles: updatedProfiles };
    setUser(updatedUser);
    saveUser(updatedUser);
    if (activeProfile) {
      const refreshedActive = updatedProfiles.find((p) => p.id === activeProfile.id);
      if (refreshedActive) setActiveProfile(refreshedActive);
    }
  };

  const handlePlayMovie = (movie: Movie, season = 1, episode = 1) => {
    if (!user?.isSubscribed) {
      setShowPaywall(true);
      return;
    }

    setSelectedMovieForModal(null);
    setPlayerSeason(season);
    setPlayerEpisode(episode);
    setPlayingMovie(movie);
  };

  const handleToggleMyList = (movie: Movie) => {
    if (!activeProfile) return;
    toggleMyListStorage(activeProfile.id, movie.id);
    setMyListIds(getMyList(activeProfile.id));
  };

  const handleSubscribe = (plan: "VIP_MONTHLY" | "VIP_ANNUAL") => {
    if (!user) return;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (plan === "VIP_MONTHLY" ? 30 : 365));

    const updatedUser: UserAccount = {
      ...user,
      isSubscribed: true,
      subscriptionPlan: plan,
      subscriptionExpiresAt: expiry.toISOString(),
    };

    setUser(updatedUser);
    saveUser(updatedUser);
    setShowPaywall(false);
  };

  // Movies list pool
  const allAvailableMovies = [...liveMovies, ...actionMovies, ...scifiMovies, ...comedyMovies, ...seriesMovies];
  
  // Continue Watching Movies
  const continueWatchingMovies = allAvailableMovies.filter((m) =>
    progressList.some((p) => p.movieId === m.id && p.percentage < 95)
  );

  // My List Movies
  const myListMovies = allAvailableMovies.filter((m) => myListIds.includes(m.id));

  // Top 10 list
  const top10Movies = liveMovies.slice(0, 10).map((m, idx) => ({
    ...m,
    isTop10: true,
    top10Rank: idx + 1,
  }));

  if (!user) {
    return <div className="min-h-screen bg-[#141414]" />;
  }

  if (showProfileGate || !activeProfile) {
    return (
      <ProfileGate
        user={user}
        onSelectProfile={handleSelectProfile}
        onUpdateProfiles={handleUpdateProfiles}
      />
    );
  }

  if (playingMovie) {
    return (
      <VideoPlayer
        movie={playingMovie}
        profile={activeProfile}
        initialSeason={playerSeason}
        initialEpisode={playerEpisode}
        onBack={() => {
          setPlayingMovie(null);
          setProgressList(getProfileProgress(activeProfile.id));
        }}
      />
    );
  }

  const featuredMovie = liveMovies[0] || INITIAL_MOVIES[0];

  return (
    <div className="relative min-h-screen bg-[#141414] text-white overflow-x-hidden">
      {/* 1. Navbar */}
      <Navbar
        user={user}
        activeProfile={activeProfile}
        onOpenProfileGate={() => setShowProfileGate(true)}
        onOpenPaywall={() => setShowPaywall(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery("");
        }}
      />

      {/* 2. Main Hero Billboard (On Home and Series tabs) */}
      {!searchQuery && (activeTab === "home" || activeTab === "series") && (
        <Billboard
          movie={activeTab === "series" ? (seriesMovies[0] || INITIAL_SERIES[0]) : featuredMovie}
          onPlay={(m) => handlePlayMovie(m)}
          onMoreInfo={(movie) => setSelectedMovieForModal(movie)}
        />
      )}

      {/* 3. Live Stremio Search Results */}
      {searchQuery.trim().length > 0 ? (
        <main className="pt-28 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-neutral-300">
              Résultats pour <span className="text-white">&ldquo;{searchQuery}&rdquo;</span>
            </h2>
            {isSearching && (
              <span className="text-xs text-[#E50914] animate-pulse">Recherche en direct sur Stremio...</span>
            )}
          </div>

          {searchResults.length === 0 && !isSearching ? (
            <div className="py-20 text-center text-neutral-500">
              <p className="text-lg">Aucun film trouvé.</p>
              <p className="text-sm mt-1">Essayez un autre titre, acteur ou genre.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {searchResults.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => setSelectedMovieForModal(movie)}
                  className="group relative rounded-md overflow-hidden bg-neutral-900 cursor-pointer aspect-[2/3] border border-neutral-800 hover:border-neutral-500 transition-all hover:scale-105"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <span className="text-xs font-bold text-white leading-tight">{movie.title}</span>
                    <span className="text-[10px] text-neutral-400 mt-1">{movie.releaseYear} • {movie.quality}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      ) : (
        /* 
          4. Netflix Rows Catalogue:
        */
        <main
          className={`relative z-20 pb-20 space-y-2 ${
            activeTab === "home" || activeTab === "series" ? "-mt-10 md:-mt-24" : "pt-24 md:pt-32"
          }`}
        >
          {/* Page Title for Sub-tabs */}
          {activeTab !== "home" && activeTab !== "series" && (
            <div className="px-4 md:px-8 mb-4">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                {activeTab === "movies" && "Films Populaires"}
                {activeTab === "popular" && "Nouveautés & Plus Vus"}
                {activeTab === "mylist" && "Ma Liste de Lecture"}
              </h1>
            </div>
          )}

          {/* SÉRIES CATALOGUE TAB */}
          {activeTab === "series" ? (
            <>
              <MovieRow
                title="Séries Populaires & Plus Vues"
                movies={seriesMovies}
                progressList={progressList}
                myListIds={myListIds}
                onPlay={(m) => handlePlayMovie(m)}
                onToggleMyList={handleToggleMyList}
                onOpenModal={(movie) => setSelectedMovieForModal(movie)}
              />
              <MovieRow
                title="Séries Policières, Drames & Thrillers"
                movies={seriesMovies.filter((s) => s.genres.some((g) => ["Crime", "Drama", "Thriller", "Action"].includes(g))).slice(0, 15)}
                progressList={progressList}
                myListIds={myListIds}
                onPlay={(m) => handlePlayMovie(m)}
                onToggleMyList={handleToggleMyList}
                onOpenModal={(movie) => setSelectedMovieForModal(movie)}
              />
              <MovieRow
                title="Séries Science-Fiction, Fantastique & Aventure"
                movies={seriesMovies.filter((s) => s.genres.some((g) => ["Sci-Fi", "Fantasy", "Horror", "Adventure"].includes(g))).slice(0, 15)}
                progressList={progressList}
                myListIds={myListIds}
                onPlay={(m) => handlePlayMovie(m)}
                onToggleMyList={handleToggleMyList}
                onOpenModal={(movie) => setSelectedMovieForModal(movie)}
              />
            </>
          ) : (
            <>
              {/* Continue Watching Row */}
              {continueWatchingMovies.length > 0 && activeTab === "home" && (
                <MovieRow
                  title={`Reprendre la lecture (${activeProfile.name})`}
                  movies={continueWatchingMovies}
                  progressList={progressList}
                  myListIds={myListIds}
                  onPlay={(m) => handlePlayMovie(m)}
                  onToggleMyList={handleToggleMyList}
                  onOpenModal={(movie) => setSelectedMovieForModal(movie)}
                />
              )}

              {/* My List */}
              {myListMovies.length > 0 && (activeTab === "home" || activeTab === "mylist") && (
                <MovieRow
                  title="Ma Liste"
                  movies={myListMovies}
                  progressList={progressList}
                  myListIds={myListIds}
                  onPlay={(m) => handlePlayMovie(m)}
                  onToggleMyList={handleToggleMyList}
                  onOpenModal={(movie) => setSelectedMovieForModal(movie)}
                />
              )}

              {/* Top 10 Movies Today in FilmFlex */}
              {top10Movies.length > 0 && (activeTab === "home" || activeTab === "popular") && (
                <MovieRow
                  title="Top 10 des films aujourd'hui sur FilmFlex"
                  movies={top10Movies}
                  isTop10={true}
                  progressList={progressList}
                  myListIds={myListIds}
                  onPlay={(m) => handlePlayMovie(m)}
                  onToggleMyList={handleToggleMyList}
                  onOpenModal={(movie) => setSelectedMovieForModal(movie)}
                />
              )}

              {/* TV Series Row on Home Tab */}
              {seriesMovies.length > 0 && activeTab === "home" && (
                <MovieRow
                  title="Séries Télévisées Populaires"
                  movies={seriesMovies}
                  progressList={progressList}
                  myListIds={myListIds}
                  onPlay={(m) => handlePlayMovie(m)}
                  onToggleMyList={handleToggleMyList}
                  onOpenModal={(movie) => setSelectedMovieForModal(movie)}
                />
              )}

              {/* Trending Now */}
              {(activeTab === "home" || activeTab === "movies" || activeTab === "popular") && (
                <MovieRow
                  title="Tendances actuelles"
                  movies={liveMovies.slice(10)}
                  progressList={progressList}
                  myListIds={myListIds}
                  onPlay={(m) => handlePlayMovie(m)}
                  onToggleMyList={handleToggleMyList}
                  onOpenModal={(movie) => setSelectedMovieForModal(movie)}
                />
              )}

              {/* Action & Adventure */}
              {actionMovies.length > 0 && (activeTab === "home" || activeTab === "movies") && (
                <MovieRow
                  title="Action & Aventure"
                  movies={actionMovies}
                  progressList={progressList}
                  myListIds={myListIds}
                  onPlay={(m) => handlePlayMovie(m)}
                  onToggleMyList={handleToggleMyList}
                  onOpenModal={(movie) => setSelectedMovieForModal(movie)}
                />
              )}

              {/* Sci-Fi */}
              {scifiMovies.length > 0 && (activeTab === "home" || activeTab === "movies") && (
                <MovieRow
                  title="Science-Fiction & Fantastique"
                  movies={scifiMovies}
                  progressList={progressList}
                  myListIds={myListIds}
                  onPlay={(m) => handlePlayMovie(m)}
                  onToggleMyList={handleToggleMyList}
                  onOpenModal={(movie) => setSelectedMovieForModal(movie)}
                />
              )}

              {/* Comedy */}
              {comedyMovies.length > 0 && (activeTab === "home" || activeTab === "movies") && (
                <MovieRow
                  title="Comédies & Feel-Good"
                  movies={comedyMovies}
                  progressList={progressList}
                  myListIds={myListIds}
                  onPlay={(m) => handlePlayMovie(m)}
                  onToggleMyList={handleToggleMyList}
                  onOpenModal={(movie) => setSelectedMovieForModal(movie)}
                />
              )}
            </>
          )}
        </main>
      )}

      {/* 5. Movie Details Modal */}
      <MovieModal
        movie={selectedMovieForModal}
        onClose={() => setSelectedMovieForModal(null)}
        onPlay={(m, s, e) => handlePlayMovie(m, s, e)}
        isInMyList={selectedMovieForModal ? myListIds.includes(selectedMovieForModal.id) : false}
        onToggleMyList={handleToggleMyList}
        allMovies={allAvailableMovies}
      />

      {/* 6. Paywall & Subscription Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        user={user}
        onSubscribe={handleSubscribe}
      />

      {/* 7. Footer */}
      <footer className="border-t border-neutral-800 bg-[#0e0e0e] py-12 px-4 md:px-8 text-neutral-500 text-xs">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <FilmFlexLogo size="sm" />
            <p className="text-neutral-400">Des questions ? Contactez le support FilmFlex VIP</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <span className="hover:underline cursor-pointer">Centre d&apos;aide</span>
            <span className="hover:underline cursor-pointer">Conditions d&apos;utilisation</span>
            <span className="hover:underline cursor-pointer">Confidentialité</span>
            <span className="hover:underline cursor-pointer">Préférences de cookies</span>
            <span className="hover:underline cursor-pointer">Relations Investisseurs</span>
            <span className="hover:underline cursor-pointer">Mentions légales</span>
            <span className="hover:underline cursor-pointer">Test de vitesse</span>
            <span className="hover:underline cursor-pointer">Garantie 4K Ultra HD</span>
          </div>

          <div className="pt-6 border-t border-neutral-800/60 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p>© 2026 FilmFlex, Inc. Tous droits réservés.</p>
            <p className="text-neutral-400 font-bold text-xs tracking-wider">
              Powered by Med mtir
            </p>
          </div>
        </div>
      </footer>

      {/* 8. Mobile Bottom Navigation Bar (Netflix Mobile App Style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-lg border-t border-neutral-800/80 px-2 py-1.5 flex items-center justify-around">
        {[
          { id: "home", label: "Accueil", icon: Home },
          { id: "movies", label: "Films", icon: Film },
          { id: "series", label: "Séries", icon: Tv },
          { id: "popular", label: "Nouveautés", icon: Flame },
          { id: "mylist", label: "Ma Liste", icon: Bookmark },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && !searchQuery;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all ${
                isActive ? "text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "text-[#E50914]" : ""}`} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#E50914]" />
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? "text-white font-bold" : ""}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
