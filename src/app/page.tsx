"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Billboard from "@/components/Billboard";
import MovieRow from "@/components/MovieRow";
import MovieModal from "@/components/MovieModal";
import VideoPlayer from "@/components/VideoPlayer";
import ProfileGate from "@/components/ProfileGate";
import PaywallModal from "@/components/PaywallModal";
import AdminDashboard from "@/components/AdminDashboard";
import AuthModal from "@/components/AuthModal";
import FlixerSplash from "@/components/FlixerSplash";
import ScreenLimitModal from "@/components/ScreenLimitModal";
import FilmFlexLogo from "@/components/FilmFlexLogo";
import CategoryGridView from "@/components/CategoryGridView";
import NetflixPreviewsRow from "@/components/NetflixPreviewsRow";
import MobileMovieDetailsSheet from "@/components/MobileMovieDetailsSheet";
import DownloadsView from "@/components/DownloadsView";
import MyListView from "@/components/MyListView";
import { Home, Film, Tv, Flame, Bookmark, BookmarkCheck, Sparkles, Compass, User, Download, Search } from "lucide-react";
import { Movie, Profile, UserAccount, WatchProgress } from "@/types";
import {
  INITIAL_MOVIES,
  INITIAL_SERIES,
  DEFAULT_PROFILES,
  TUNISIAN_MOVIES,
  ANIME_MOVIES,
  TURKISH_MOVIES,
} from "@/lib/constants";
import {
  getStoredUser,
  saveUser,
  clearUserSession,
  getProfileProgress,
  getMyList,
  toggleMyList as toggleMyListStorage,
} from "@/lib/storage";
import { checkSubscriptionValidity, startWatchingSession } from "@/lib/auth";
import {
  fetchProgressFromSupabase,
  fetchMyListFromSupabase,
} from "@/lib/supabase";

export default function HomePage() {
  // 1. User & Profiles State (Starts as null for clean Guest Mode)
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
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showScreenLimitModal, setShowScreenLimitModal] = useState(false);
  const [limitActiveScreens, setLimitActiveScreens] = useState(2);

  // 4. Profile-specific state (Continue Watching & My List)
  const [progressList, setProgressList] = useState<WatchProgress[]>([]);
  const [myListIds, setMyListIds] = useState<string[]>([]);

  // 5. Dynamic Catalogs (Stremio live + Tunisian + Anime)
  const [liveMovies, setLiveMovies] = useState<Movie[]>(INITIAL_MOVIES);
  const [actionMovies, setActionMovies] = useState<Movie[]>(() =>
    INITIAL_MOVIES.filter((m) => m.genres.some((g) => ["Action", "Adventure"].includes(g)))
  );
  const [scifiMovies, setScifiMovies] = useState<Movie[]>(() =>
    INITIAL_MOVIES.filter((m) => m.genres.some((g) => ["Sci-Fi", "Fantasy", "Mondes Parallèles"].includes(g)))
  );
  const [thrillerMovies, setThrillerMovies] = useState<Movie[]>(() =>
    INITIAL_MOVIES.filter((m) => m.genres.some((g) => ["Thriller", "Crime", "Mystery", "Drama"].includes(g)))
  );
  const [comedyMovies, setComedyMovies] = useState<Movie[]>(() =>
    INITIAL_MOVIES.filter((m) => m.genres.some((g) => ["Comedy", "Animation", "Family"].includes(g)))
  );
  const [seriesMovies, setSeriesMovies] = useState<Movie[]>(INITIAL_SERIES);
  const [tunisianMovies] = useState<Movie[]>(TUNISIAN_MOVIES);
  const [animeMovies] = useState<Movie[]>(ANIME_MOVIES);
  const [turkishMovies] = useState<Movie[]>(TURKISH_MOVIES);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize from LocalStorage (if logged in, load profile; if not, stay in Guest Mode)
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      const defaultProf =
        stored.profiles.find((p) => p.id === stored.activeProfileId) || stored.profiles[0];

      if (defaultProf?.pinCode) {
        setShowProfileGate(true);
      } else {
        setActiveProfile(defaultProf);
      }
    }
  }, []);

  // Hardware Back-Button Handler (Step-by-step navigation for Android Phone & Mobile Web)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).FilmFlexHandleBack = () => {
      // 1. If Video Player is active -> close it
      if (playingMovie) {
        setPlayingMovie(null);
        return true;
      }
      // 2. If Movie Details Modal / Sheet is open -> close it
      if (selectedMovieForModal) {
        setSelectedMovieForModal(null);
        return true;
      }
      // 3. If any modal is open -> close it
      if (showAuthModal) {
        setShowAuthModal(false);
        return true;
      }
      if (showPaywall) {
        setShowPaywall(false);
        return true;
      }
      if (showAdminDashboard) {
        setShowAdminDashboard(false);
        return true;
      }
      if (showScreenLimitModal) {
        setShowScreenLimitModal(false);
        return true;
      }
      if (showProfileGate) {
        setShowProfileGate(false);
        return true;
      }
      // 4. If search query is entered -> clear it
      if (searchQuery.trim().length > 0) {
        setSearchQuery("");
        return true;
      }
      // 5. If on another tab than "home" -> navigate back to home
      if (activeTab !== "home") {
        setActiveTab("home");
        return true;
      }
      // 6. At root home -> return false so Android app asks to exit
      return false;
    };

    // Also support browser back button via popstate
    const handlePopState = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handler = (window as any).FilmFlexHandleBack;
      if (typeof handler === "function") {
        handler();
      }
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).FilmFlexHandleBack;
      window.removeEventListener("popstate", handlePopState);
    };
  }, [
    playingMovie,
    selectedMovieForModal,
    showAuthModal,
    showPaywall,
    showAdminDashboard,
    showScreenLimitModal,
    showProfileGate,
    searchQuery,
    activeTab,
  ]);

  // Update profile data when active profile changes
  useEffect(() => {
    if (activeProfile) {
      const localProgress = getProfileProgress(activeProfile.id);
      setProgressList(localProgress);
      setMyListIds(getMyList(activeProfile.id));

      fetchProgressFromSupabase(activeProfile.id)
        .then((remoteProgress) => {
          if (remoteProgress && remoteProgress.length > 0) {
            setProgressList(remoteProgress);
          }
        })
        .catch(() => {});

      fetchMyListFromSupabase(activeProfile.id)
        .then((remoteList) => {
          if (remoteList && remoteList.length > 0) {
            setMyListIds(remoteList);
          }
        })
        .catch(() => {});
    }
  }, [activeProfile]);

  // Fetch Live Movies from Cinemeta
  useEffect(() => {
    fetch("/api/catalog")
      .then((res) => res.json())
      .then((data) => {
        if (data.movies && data.movies.length > 0) {
          setLiveMovies((prev) => {
            const map = new Map<string, Movie>();
            for (const m of [...data.movies, ...prev]) map.set(m.id, m);
            return Array.from(map.values());
          });
        }
      })
      .catch((err) => console.error("Error fetching live catalog:", err));

    fetch("/api/catalog?genre=Action")
      .then((res) => res.json())
      .then((data) => {
        if (data.movies && data.movies.length > 0) {
          setActionMovies((prev) => {
            const map = new Map<string, Movie>();
            for (const m of [...data.movies, ...prev]) map.set(m.id, m);
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});

    fetch("/api/catalog?genre=Science%20Fiction")
      .then((res) => res.json())
      .then((data) => {
        if (data.movies && data.movies.length > 0) {
          setScifiMovies((prev) => {
            const map = new Map<string, Movie>();
            for (const m of [...data.movies, ...prev]) map.set(m.id, m);
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});

    fetch("/api/catalog?type=series")
      .then((res) => res.json())
      .then((data) => {
        if (data.movies && data.movies.length > 0) {
          setSeriesMovies((prev) => {
            const map = new Map<string, Movie>();
            for (const m of [...data.movies, ...prev]) map.set(m.id, m);
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});
  }, []);

  // Real-time Search combining local collections & Cinemeta
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const query = searchQuery.trim().toLowerCase();

    // Instant local matches (Tunisian, Anime, Blockbusters)
    const localMatches = allAvailableMovies.filter(
      (m) =>
        m.title.toLowerCase().includes(query) ||
        m.genres.some((g) => g.toLowerCase().includes(query)) ||
        (m.cast && m.cast.some((c) => c.toLowerCase().includes(query)))
    );

    const delayDebounce = setTimeout(() => {
      fetch(`/api/catalog?search=${encodeURIComponent(searchQuery.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          const remoteMatches: Movie[] = data.movies || [];
          const combined = new Map<string, Movie>();
          for (const m of [...localMatches, ...remoteMatches]) {
            if (m && m.id) combined.set(m.id, m);
          }
          setSearchResults(Array.from(combined.values()));
          setIsSearching(false);
        })
        .catch(() => {
          setSearchResults(localMatches);
          setIsSearching(false);
        });
    }, 300);

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

  const handleLogout = () => {
    clearUserSession();
    setUser(null);
    setActiveProfile(null);
    setShowProfileGate(false);
    setShowAdminDashboard(false);
    setProgressList([]);
    setMyListIds([]);
  };

  const handlePlayMovie = (movie: Movie, season = 1, episode = 1) => {
    // Guest must login/subscribe before streaming
    if (!user) {
      setSelectedMovieForModal(null);
      setShowAuthModal(true);
      return;
    }

    // 1. Subscription Check (auto cuts if subscription has expired)
    const refreshed = checkSubscriptionValidity(user);
    if (!refreshed.isSubscribed) {
      setUser(refreshed);
      saveUser(refreshed);
      setShowPaywall(true);
      return;
    }

    // 2. Max 2 Simultaneous Screens Check
    const sessionRes = startWatchingSession(refreshed.id, refreshed.maxScreens || 2);
    if (!sessionRes.allowed) {
      setLimitActiveScreens(sessionRes.activeCount);
      setShowScreenLimitModal(true);
      return;
    }

    setSelectedMovieForModal(null);
    setPlayerSeason(season);
    setPlayerEpisode(episode);
    setPlayingMovie(movie);
  };

  const handleToggleMyList = (movie: Movie) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
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

  // Movies list pool - strictly unique
  const uniqueMoviesMap = new Map<string, Movie>();
  for (const m of [
    ...tunisianMovies,
    ...turkishMovies,
    ...animeMovies,
    ...liveMovies,
    ...actionMovies,
    ...scifiMovies,
    ...thrillerMovies,
    ...comedyMovies,
    ...seriesMovies,
    ...INITIAL_MOVIES,
    ...INITIAL_SERIES,
  ]) {
    if (m && m.id && !uniqueMoviesMap.has(m.id)) {
      uniqueMoviesMap.set(m.id, m);
    }
  }
  const allAvailableMovies = Array.from(uniqueMoviesMap.values());

  // Continue Watching Movies - strictly unique
  const continueWatchingMovies: Movie[] = [];
  const seenContinueIds = new Set<string>();
  for (const p of progressList) {
    if (p.percentage < 95 && !seenContinueIds.has(p.movieId)) {
      const foundMovie = uniqueMoviesMap.get(p.movieId);
      if (foundMovie) {
        seenContinueIds.add(p.movieId);
        continueWatchingMovies.push(foundMovie);
      }
    }
  }

  // My List Movies
  const myListMovies: Movie[] = [];
  const seenMyListIds = new Set<string>();
  for (const id of myListIds) {
    if (!seenMyListIds.has(id)) {
      const foundMovie = uniqueMoviesMap.get(id);
      if (foundMovie) {
        seenMyListIds.add(id);
        myListMovies.push(foundMovie);
      }
    }
  }

  // Top 10 list
  const top10Movies = liveMovies.slice(0, 10).map((m, idx) => ({
    ...m,
    isTop10: true,
    top10Rank: idx + 1,
  }));

  // Profile Gate is only shown if user is logged in and explicit gate requested
  if (user && (showProfileGate || !activeProfile)) {
    return (
      <ProfileGate
        user={user}
        onSelectProfile={handleSelectProfile}
        onUpdateProfiles={handleUpdateProfiles}
      />
    );
  }

  // Active Video Player
  if (playingMovie) {
    return (
      <VideoPlayer
        movie={playingMovie}
        profile={activeProfile}
        initialSeason={playerSeason}
        initialEpisode={playerEpisode}
        userId={user?.id}
        onBack={() => {
          setPlayingMovie(null);
          if (activeProfile) {
            setProgressList(getProfileProgress(activeProfile.id));
          }
        }}
      />
    );
  }

  // Featured Billboard Movie selection depending on active tab
  let featuredMovie = liveMovies[0] || INITIAL_MOVIES[0];
  if (activeTab === "series") {
    featuredMovie = seriesMovies[0] || INITIAL_SERIES[0];
  } else if (activeTab === "anime") {
    featuredMovie = animeMovies[0]; // Attack on Titan
  } else if (activeTab === "tunisien") {
    featuredMovie = tunisianMovies[0]; // Dachra
  }

  const showBillboard = !searchQuery && ["home", "series"].includes(activeTab);

  return (
    <div className="relative min-h-screen bg-[#0e0e12] text-white overflow-x-hidden selection:bg-[#E50914] selection:text-white">
      {/* 0. Flixer Splash Intro (First Loading Screen) */}
      <FlixerSplash />

      {/* 1. Header / Navbar */}
      <Navbar
        user={user}
        activeProfile={activeProfile}
        onOpenProfileGate={() => setShowProfileGate(true)}
        onOpenPaywall={() => setShowPaywall(true)}
        onOpenAdminDashboard={() => setShowAdminDashboard(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery("");
        }}
      />

      {/* 2. Hero Billboard Showcase (Rounded Card matching Image 2) */}
      {showBillboard && (
        <Billboard
          movie={featuredMovie}
          onPlay={(m) => handlePlayMovie(m)}
          onMoreInfo={(movie) => setSelectedMovieForModal(movie)}
          onToggleMyList={handleToggleMyList}
          isInMyList={featuredMovie ? myListIds.includes(featuredMovie.id) : false}
        />
      )}

      {/* 2b. Previews Circular Avatars Row (Exact match to Screen 1) */}
      {showBillboard && activeTab === "home" && !searchQuery && (
        <NetflixPreviewsRow
          movies={[
            ...animeMovies.slice(0, 3),
            ...tunisianMovies.slice(0, 3),
            ...liveMovies.slice(0, 4),
          ]}
          onOpenModal={(movie) => setSelectedMovieForModal(movie)}
          onPlay={(m) => handlePlayMovie(m)}
        />
      )}

      {/* 3. Search Screen / Results */}
      {searchQuery.trim().length > 0 || activeTab === "search" ? (
        <main className="pt-24 md:pt-28 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
          {activeTab === "search" && (
            <div className="mb-6 relative">
              <div className="flex items-center gap-3 bg-neutral-900/90 border border-neutral-700/80 rounded-2xl px-4 py-3.5 shadow-xl">
                <Search className="w-5 h-5 text-[#E50914] shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Rechercher des films, séries, animés, cinéma tunisien..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm sm:text-base text-white placeholder-neutral-500 outline-none w-full"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-neutral-300">
              {searchQuery ? (
                <>Résultats pour <span className="text-white">&ldquo;{searchQuery}&rdquo;</span></>
              ) : (
                "Films et séries les plus recherchés"
              )}
            </h2>
            {isSearching && (
              <span className="text-xs text-[#E50914] animate-pulse">Recherche sur FilmFlex...</span>
            )}
          </div>

          {(searchResults.length === 0 && searchQuery) && !isSearching ? (
            <div className="py-20 text-center text-neutral-500">
              <p className="text-lg">Aucun film ou série trouvé.</p>
              <p className="text-sm mt-1">Essayez un autre titre, anime ou film tunisien.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {(searchResults.length > 0 ? searchResults : liveMovies.slice(0, 15)).map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => setSelectedMovieForModal(movie)}
                  className="group relative rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer aspect-[2/3] border border-neutral-800 hover:border-neutral-500 transition-all hover:scale-105 shadow-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <span className="text-xs font-bold text-white leading-tight">{movie.title}</span>
                    <span className="text-[10px] text-neutral-400 mt-1">{movie.releaseYear} • {movie.quality}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      ) : (
        /* 4. Main Rows Catalogue */
        <main
          className={`relative z-20 pb-20 space-y-4 ${
            showBillboard ? "pt-2" : "pt-24 md:pt-32"
          }`}
        >
          {/* Sub-tab Page Titles */}
          {!showBillboard && (
            <div className="px-4 md:px-8 mb-4 max-w-7xl mx-auto">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                {activeTab === "movies" && "Films Populaires"}
                {activeTab === "popular" && "Nouveautés & Plus Vus"}
                {activeTab === "mylist" && "Ma Liste de Lecture"}
              </h1>
            </div>
          )}

          {/* DEDICATED ANIME FULL PAGE CATALOG */}
          {activeTab === "anime" && (
            <CategoryGridView
              title="Catalogue Complet Anime & Manga 🎌"
              badge="Anime Japonais (VOSTFR & VF)"
              description="Explorez tous les animés en streaming 4K Ultra HD sans coupure : Shonen épiques, dark fantasy, combats légendaires et chefs-d'œuvre du Studio Ghibli."
              movies={animeMovies}
              filterGenres={["Shonen", "Action", "Dark Fantasy", "Aventure", "Romance", "Animation", "Thriller"]}
              progressList={progressList}
              myListIds={myListIds}
              onPlay={(m) => handlePlayMovie(m)}
              onToggleMyList={handleToggleMyList}
              onOpenModal={(movie) => setSelectedMovieForModal(movie)}
            />
          )}

          {/* DEDICATED TURKISH SERIES & MOVIES FULL PAGE CATALOG */}
          {activeTab === "turkish" && (
            <CategoryGridView
              title="Séries & Cinéma Turcs 🇹🇷"
              badge="المسلسلات والأفلام التركية"
              description="Les plus grandes séries dramatiques, historiques et romantiques d'Istanbul : Kuruluş: Osman, Yalı Çapkını, Çukur, Diriliş: Ertuğrul et les chefs-d'œuvre du cinéma turc en 4K UHD avec sous-titres arabes et français."
              movies={turkishMovies}
              filterGenres={["Romance", "Action", "Drame", "Histoire", "Crime"]}
              progressList={progressList}
              myListIds={myListIds}
              onPlay={(m) => handlePlayMovie(m)}
              onToggleMyList={handleToggleMyList}
              onOpenModal={(movie) => setSelectedMovieForModal(movie)}
            />
          )}

          {/* DEDICATED TUNISIAN CINEMA FULL PAGE CATALOG */}
          {activeTab === "tunisien" && (
            <CategoryGridView
              title="Cinéma & Séries Tunisiens 🇹🇳"
              badge="Production 100% Tunisienne"
              description="Retrouvez les plus grandes œuvres du cinéma tunisien et les séries cultes en haute définition : comédies inoubliables (Choufly Hal), drames sociaux poignants (Nouba) et cinéma d'auteur (Dachra)."
              movies={tunisianMovies}
              filterGenres={["Comédie", "Drame", "Horreur", "Classique"]}
              progressList={progressList}
              myListIds={myListIds}
              onPlay={(m) => handlePlayMovie(m)}
              onToggleMyList={handleToggleMyList}
              onOpenModal={(movie) => setSelectedMovieForModal(movie)}
            />
          )}

          {/* DEDICATED DOWNLOADS TAB (Stremio & Netflix exact match) */}
          {activeTab === "downloads" && (
            <DownloadsView
              movies={[...liveMovies, ...turkishMovies, ...animeMovies, ...tunisianMovies]}
              onPlay={(m) => handlePlayMovie(m)}
              onOpenModal={(movie) => setSelectedMovieForModal(movie)}
            />
          )}

          {/* DEDICATED MY LIST TAB (Exact match to media_1790623063448.png) */}
          {activeTab === "mylist" && (
            <MyListView
              movies={myListMovies.length > 0 ? myListMovies : liveMovies.slice(0, 8)}
              progressList={progressList}
              onPlay={(m) => handlePlayMovie(m)}
              onOpenModal={(movie) => setSelectedMovieForModal(movie)}
              onRemoveFromList={handleToggleMyList}
              onBack={() => setActiveTab("home")}
            />
          )}

          {/* DEDICATED SERIES TAB */}
          {activeTab === "series" && (
            <>
              <MovieRow
                title="Séries Populaires & Plus Vues"
                movies={seriesMovies}
                filterGenres={["Action", "Sci-Fi", "Drama", "Crime"]}
                progressList={progressList}
                myListIds={myListIds}
                onPlay={(m) => handlePlayMovie(m)}
                onToggleMyList={handleToggleMyList}
                onOpenModal={(movie) => setSelectedMovieForModal(movie)}
              />
              <MovieRow
                title="Séries Tunisiennes (Choufly Hal, Nouba...)"
                movies={tunisianMovies.filter((t) => t.type === "series")}
                progressList={progressList}
                myListIds={myListIds}
                onPlay={(m) => handlePlayMovie(m)}
                onToggleMyList={handleToggleMyList}
                onOpenModal={(movie) => setSelectedMovieForModal(movie)}
              />
              <MovieRow
                title="Séries Anime Japonaises"
                movies={animeMovies.filter((a) => a.type === "series")}
                progressList={progressList}
                myListIds={myListIds}
                onPlay={(m) => handlePlayMovie(m)}
                onToggleMyList={handleToggleMyList}
                onOpenModal={(movie) => setSelectedMovieForModal(movie)}
              />
            </>
          )}

          {/* HOME / MOVIES / POPULAR TAB */}
          {["home", "movies", "popular"].includes(activeTab) && (
            <>
              {/* Row 1: Trending Now with Image 2 Filter Pills */}
              {(activeTab === "home" || activeTab === "popular") && (
                <MovieRow
                  title="Trending Now"
                  movies={liveMovies.slice(0, 14)}
                  filterGenres={["Action", "Sci-Fi", "Comedy", "Thriller"]}
                  progressList={progressList}
                  myListIds={myListIds}
                  onPlay={(m) => handlePlayMovie(m)}
                  onToggleMyList={handleToggleMyList}
                  onOpenModal={(movie) => setSelectedMovieForModal(movie)}
                />
              )}

              {/* Row 2: Cinéma Tunisien 🇹🇳 */}
              {(activeTab === "home" || activeTab === "movies") && (
                <MovieRow
                  title="Cinéma Tunisien 🇹🇳"
                  movies={tunisianMovies}
                  filterGenres={["Comédie", "Drame", "Horreur", "Classique"]}
                  progressList={progressList}
                  myListIds={myListIds}
                  onPlay={(m) => handlePlayMovie(m)}
                  onToggleMyList={handleToggleMyList}
                  onOpenModal={(movie) => setSelectedMovieForModal(movie)}
                  onViewAll={() => {
                    setActiveTab("tunisien");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              )}

              {/* Row 3: Anime & Manga 🎌 */}
              {(activeTab === "home" || activeTab === "movies") && (
                <MovieRow
                  title="Anime & Manga Japonais 🎌"
                  movies={animeMovies}
                  filterGenres={["Shonen", "Action", "Dark Fantasy", "Aventure"]}
                  progressList={progressList}
                  myListIds={myListIds}
                  onPlay={(m) => handlePlayMovie(m)}
                  onToggleMyList={handleToggleMyList}
                  onOpenModal={(movie) => setSelectedMovieForModal(movie)}
                  onViewAll={() => {
                    setActiveTab("anime");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              )}

              {/* Row: Séries & Cinéma Turcs 🇹🇷 */}
              {(activeTab === "home" || activeTab === "movies" || activeTab === "series") && (
                <MovieRow
                  title="Séries & Cinéma Turcs 🇹🇷 (المسلسلات والأفلام التركية)"
                  movies={turkishMovies}
                  filterGenres={["Romance", "Action", "Drame", "Histoire", "Crime"]}
                  progressList={progressList}
                  myListIds={myListIds}
                  onPlay={(m) => handlePlayMovie(m)}
                  onToggleMyList={handleToggleMyList}
                  onOpenModal={(movie) => setSelectedMovieForModal(movie)}
                  onViewAll={() => {
                    setActiveTab("turkish");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              )}

              {/* Row 4: Continue Watching with Filter Pills (if progress exists) */}
              {continueWatchingMovies.length > 0 && activeTab === "home" && (
                <MovieRow
                  title={`Continue Watching ${activeProfile ? `(${activeProfile.name})` : ""}`}
                  movies={continueWatchingMovies}
                  filterGenres={["Action", "Comedy", "Drama", "Thriller"]}
                  progressList={progressList}
                  myListIds={myListIds}
                  onPlay={(m) => handlePlayMovie(m)}
                  onToggleMyList={handleToggleMyList}
                  onOpenModal={(movie) => setSelectedMovieForModal(movie)}
                />
              )}

              {/* Row 5: FilmFlex Exclusives */}
              {(activeTab === "home" || activeTab === "movies") && (
                <MovieRow
                  title="FilmFlex Exclusives"
                  movies={actionMovies.slice(0, 12)}
                  filterGenres={["Action", "Sci-Fi", "Comedy", "Thriller"]}
                  progressList={progressList}
                  myListIds={myListIds}
                  onPlay={(m) => handlePlayMovie(m)}
                  onToggleMyList={handleToggleMyList}
                  onOpenModal={(movie) => setSelectedMovieForModal(movie)}
                  onViewAll={() => {
                    setActiveTab("movies");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              )}

              {/* Row 6: My List (if bookmarked) */}
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

              {/* Row 7: Top 10 Today */}
              {top10Movies.length > 0 && (activeTab === "home" || activeTab === "popular") && (
                <MovieRow
                  title="Top 10 aujourd'hui sur FilmFlex"
                  movies={top10Movies}
                  isTop10={true}
                  progressList={progressList}
                  myListIds={myListIds}
                  onPlay={(m) => handlePlayMovie(m)}
                  onToggleMyList={handleToggleMyList}
                  onOpenModal={(movie) => setSelectedMovieForModal(movie)}
                />
              )}

              {/* Row 8: Science-Fiction */}
              {scifiMovies.length > 0 && (activeTab === "home" || activeTab === "movies") && (
                <MovieRow
                  title="Science-Fiction & Mondes Parallèles"
                  movies={scifiMovies}
                  filterGenres={["Sci-Fi", "Fantasy", "Action"]}
                  progressList={progressList}
                  myListIds={myListIds}
                  onPlay={(m) => handlePlayMovie(m)}
                  onToggleMyList={handleToggleMyList}
                  onOpenModal={(movie) => setSelectedMovieForModal(movie)}
                />
              )}

              {/* Row 9: Comédies */}
              {comedyMovies.length > 0 && (activeTab === "home" || activeTab === "movies") && (
                <MovieRow
                  title="Comédies, Animation & Feel-Good"
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

      {/* 5. Movie Details Modal: Mobile Sheet (Exact match to Screen 2) & Desktop Modal */}
      <div className="md:hidden">
        <MobileMovieDetailsSheet
          movie={selectedMovieForModal}
          onClose={() => setSelectedMovieForModal(null)}
          onPlay={(m, s, e) => handlePlayMovie(m, s, e)}
          isInMyList={selectedMovieForModal ? myListIds.includes(selectedMovieForModal.id) : false}
          onToggleMyList={handleToggleMyList}
        />
      </div>

      <div className="hidden md:block">
        <MovieModal
          movie={selectedMovieForModal}
          onClose={() => setSelectedMovieForModal(null)}
          onPlay={(m, s, e) => handlePlayMovie(m, s, e)}
          isInMyList={selectedMovieForModal ? myListIds.includes(selectedMovieForModal.id) : false}
          onToggleMyList={handleToggleMyList}
          allMovies={allAvailableMovies}
        />
      </div>

      {/* 6. Paywall & Subscription Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        user={user || {
          id: "guest",
          email: "guest@filmflex.tv",
          role: "user",
          isSubscribed: false,
          profiles: DEFAULT_PROFILES,
          activeProfileId: "profile_1",
          maxScreens: 2,
        }}
        onSubscribe={handleSubscribe}
      />

      {/* 6b. Admin Dashboard Modal */}
      {user && (
        <AdminDashboard
          isOpen={showAdminDashboard}
          onClose={() => setShowAdminDashboard(false)}
          currentUser={user}
        />
      )}

      {/* 6c. Auth Modal (Connexion / Inscription) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          saveUser(loggedInUser);
          const firstProf = loggedInUser.profiles?.[0] || DEFAULT_PROFILES[0];
          setActiveProfile(firstProf);
        }}
      />

      {/* 6d. Screen Limit Modal (Max 2 Screens) */}
      {user && (
        <ScreenLimitModal
          isOpen={showScreenLimitModal}
          onClose={() => setShowScreenLimitModal(false)}
          onRetry={() => {
            setShowScreenLimitModal(false);
            if (user && selectedMovieForModal) {
              handlePlayMovie(selectedMovieForModal);
            }
          }}
          activeCount={limitActiveScreens}
          maxScreens={user.maxScreens || 2}
        />
      )}

      {/* 7. Footer */}
      <footer className="border-t border-neutral-800 bg-[#0a0a0d] py-12 px-4 md:px-8 text-neutral-500 text-xs select-none">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <FilmFlexLogo size="sm" />
            <p className="text-neutral-400">Support VIP FilmFlex • 4K Ultra HD Streaming</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <span className="hover:underline cursor-pointer">Centre d&apos;aide</span>
            <span className="hover:underline cursor-pointer">Conditions d&apos;utilisation</span>
            <span className="hover:underline cursor-pointer">Confidentialité</span>
            <span className="hover:underline cursor-pointer">Préférences de cookies</span>
            <span className="hover:underline cursor-pointer">Cinéma Tunisien</span>
            <span className="hover:underline cursor-pointer">Anime Japonais</span>
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

      {/* 8. Mobile Bottom Navigation Bar (Dedicated Mobile App Layout) */}
      {/* 8. Mobile Bottom Navigation Bar (Exact Match to Netflix Mobile App) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e0e12]/95 backdrop-blur-2xl border-t border-neutral-800/90 px-1 py-1.5 flex items-center justify-around select-none shadow-[0_-10px_30px_rgba(0,0,0,0.9)] pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {[
          { id: "home", label: "Accueil", icon: Home },
          { id: "search", label: "Recherche", icon: Search },
          { id: "mylist", label: "Ma Liste", icon: BookmarkCheck, badgeCount: myListIds.length > 0 ? myListIds.length : undefined },
          { id: "downloads", label: "Téléchargements", icon: Download, hasBadge: true },
          { id: "tunisien", label: "Tunisien 🇹🇳", icon: Compass },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && !searchQuery;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "search") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  setSearchQuery("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
                isActive ? "text-[#E50914] font-bold scale-105" : "text-neutral-400 hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E50914] shadow-[0_0_8px_#E50914]" />
                )}
                {tab.badgeCount !== undefined && tab.badgeCount > 0 ? (
                  <span className="absolute -top-1 -right-2 px-1 rounded-full bg-[#E50914] text-[9px] font-black text-white leading-tight">
                    {tab.badgeCount}
                  </span>
                ) : tab.hasBadge ? (
                  <span className="absolute -top-1 -right-2 px-1 rounded-full bg-[#E50914] text-[9px] font-black text-white leading-tight">
                    3
                  </span>
                ) : null}
              </div>
              <span className={`text-[9px] sm:text-[10px] mt-1 font-medium truncate max-w-[54px] ${isActive ? "text-[#E50914] font-bold" : ""}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Account / Login Tab */}
        <button
          onClick={() => {
            if (user) {
              setShowProfileGate(true);
            } else {
              setShowAuthModal(true);
            }
          }}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all text-neutral-400 hover:text-white cursor-pointer"
        >
          {user ? (
            <div className="w-5 h-5 rounded-full bg-[#E50914] flex items-center justify-center text-[10px] font-black text-white shadow">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
          ) : (
            <User className="w-5 h-5 stroke-[1.8]" />
          )}
          <span className="text-[10px] mt-1 font-medium truncate max-w-[60px]">
            {user ? "Compte" : "Connexion"}
          </span>
        </button>
      </nav>
    </div>
  );
}
