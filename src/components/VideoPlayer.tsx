"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Cast,
  ListVideo,
  X,
  RotateCw,
  Maximize,
  Minimize,
  FastForward,
  Server,
  Play,
  Check,
  Tv,
  Zap,
} from "lucide-react";
import { Movie, Profile, Episode } from "@/types";
import { saveMovieProgress, getMovieResumeTime } from "@/lib/storage";
import { startWatchingSession, stopWatchingSession } from "@/lib/auth";
import { isItemDownloaded, getOfflineVideoUrl } from "@/lib/downloadManager";

interface VideoPlayerProps {
  movie: Movie;
  profile?: Profile | null;
  onBack: () => void;
  initialSeason?: number;
  initialEpisode?: number;
  userId?: string;
}

type ServerType = "vidlink" | "torrentio" | "embedsu" | "mondial" | "tunisien" | "offline";

interface ServerOption {
  id: ServerType;
  name: string;
  badge: string;
  description: string;
}

const SERVER_OPTIONS: ServerOption[] = [
  {
    id: "vidlink",
    name: "Serveur 1 (Netflix Ultra HD)",
    badge: "⭐ 100% Sans Pub",
    description: "Moteur Netflix 4K ultra fluide • Zéro pub ni redirection, sous-titres FR/AR",
  },
  {
    id: "torrentio",
    name: "Serveur 2 (Torrentio CDN 4K)",
    badge: "Torrentio 4K",
    description: "Moteur Torrentio intelligent • Détection automatique du meilleur flux 4K/1080p sans pub",
  },
  {
    id: "embedsu",
    name: "Serveur 3 (FilmFlex Multi-Langues)",
    badge: "Multi-Langues",
    description: "Multi-serveur haute vitesse avec sous-titres arabes et français",
  },
  {
    id: "mondial",
    name: "Serveur 4 (FilmFlex Mondial)",
    badge: "Mondial Backup",
    description: "Serveur mondial complet (Vidsrc) en secours si un film est manquant",
  },
  {
    id: "tunisien",
    name: "Serveur 5 (Cinéma Tunisien Officiel)",
    badge: "🇹🇳 Tunisien HD",
    description: "Diffusion officielle directe pour Choufly Hal, Nouba et films tunisiens",
  },
  {
    id: "offline",
    name: "Serveur Hors-Ligne (Stockage App)",
    badge: "💾 Hors-Ligne",
    description: "Lecture directe depuis la mémoire interne de l'application sans aucune connexion Internet ni Wi-Fi",
  },
];

export default function VideoPlayer({
  movie,
  profile,
  onBack,
  initialSeason = 1,
  initialEpisode = 1,
  userId,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const introVideoRef = useRef<HTMLVideoElement>(null);

  // Active watching session heartbeat (enforcing max 2 concurrent screens)
  useEffect(() => {
    if (!userId) return;
    startWatchingSession(userId);
    const interval = setInterval(() => {
      startWatchingSession(userId);
    }, 15000);
    return () => {
      clearInterval(interval);
      stopWatchingSession(userId);
    };
  }, [userId]);

  // Intro video state - disabled by default for instant 1-tap playback on mobile & web
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);

  // Series details
  const isSeries =
    movie.type === "series" ||
    movie.duration.toLowerCase().includes("season") ||
    movie.duration.toLowerCase().includes("série");
  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [episodesList, setEpisodesList] = useState<Episode[]>([]);
  const [showEpisodesDrawer, setShowEpisodesDrawer] = useState(false);

  const isTunisian =
    Boolean(movie.genres?.some((g) => g.toLowerCase().includes("tunis"))) ||
    movie.id.includes("choufly") ||
    movie.id.includes("nouba");

  // Player state: Tunisian server for Tunisian cinema/series, VidLink Pro (100% zero ads) for everything else
  const [activeServer, setActiveServer] = useState<ServerType>(
    isTunisian ? "tunisien" : "vidlink"
  );
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [resumedNotice, setResumedNotice] = useState<string | null>(null);
  const [castNotice, setCastNotice] = useState<string | null>(null);
  const [isLandscapeMode, setIsLandscapeMode] = useState(false);
  const [showLagHelp, setShowLagHelp] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imdbId = movie.imdbId || (movie.id.startsWith("tt") ? movie.id : "tt15239678");

  const downloadId = isSeries ? `${movie.id}:${currentSeason}:${currentEpisode}` : movie.id;
  const isDownloaded = isItemDownloaded(downloadId) || isItemDownloaded(movie.id);
  const [offlineVideoUrl, setOfflineVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    getOfflineVideoUrl(downloadId).then((url) => {
      if (url) {
        setOfflineVideoUrl(url);
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          setActiveServer("offline");
        }
      }
    });
  }, [downloadId]);

  // Save progress for "Reprendre la lecture"
  useEffect(() => {
    const resumeTime = profile ? getMovieResumeTime(profile.id, movie.id) : 0;
    if (resumeTime > 0) {
      const mins = Math.floor(resumeTime / 60);
      setResumedNotice(`Reprise automatique à ${mins} min`);
      setTimeout(() => setResumedNotice(null), 4000);
    }
    if (profile) {
      saveMovieProgress(
        profile.id,
        movie.id,
        resumeTime > 0 ? resumeTime : 180,
        movie.durationSeconds || 7200
      );
    }
  }, [profile, movie.id, movie.durationSeconds]);

  // Anti-Coupure Auto-Detection Timer: If loading takes > 11s, suggest 1-click best backup server
  useEffect(() => {
    setShowLagHelp(false);
    const lagTimer = setTimeout(() => {
      setShowLagHelp(true);
    }, 11000);
    return () => clearTimeout(lagTimer);
  }, [activeServer, currentSeason, currentEpisode, imdbId]);

  // Web Shield: Neutralize rogue popups, ad tabs, and unwanted redirects on desktop and mobile web
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Intercept any window.open calls from embedded scripts or rogue handlers
    const originalOpen = window.open;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).open = function (...args: any[]) {
      console.warn("[FilmFlex Shield] Neutralized popup window.open attempt:", args[0]);
      return null;
    };

    return () => {
      window.open = originalOpen;
    };
  }, []);

  // Mobile orientation and auto-fullscreen handling (Ken fel tlf temchi, fel web ma temchich)
  useEffect(() => {
    const isMobilePhone =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Boolean((window as any).FilmFlexNative));

    const handleOrientation = () => {
      if (typeof window !== "undefined" && window.innerWidth > window.innerHeight) {
        setIsLandscapeMode(true);
      } else {
        setIsLandscapeMode(false);
      }
    };

    if (isMobilePhone) {
      try {
        // 1. Android APK native bridge: rotate device to landscape
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nativeApp = (window as any).FilmFlexNative;
        if (nativeApp && typeof nativeApp.enterVideoMode === "function") {
          nativeApp.enterVideoMode();
        }

        // 2. Mobile Browser orientation lock
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orient = (screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation) as any;
        if (orient && typeof orient.lock === "function") {
          orient.lock("landscape").catch(() => {});
        }

        // 3. Mobile auto-fullscreen
        if (containerRef.current && !document.fullscreenElement) {
          containerRef.current.requestFullscreen().catch(() => {});
        }
      } catch {}

      window.addEventListener("resize", handleOrientation);
      window.addEventListener("orientationchange", handleOrientation);
    }

    return () => {
      if (isMobilePhone) {
        window.removeEventListener("resize", handleOrientation);
        window.removeEventListener("orientationchange", handleOrientation);
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nativeApp = (window as any).FilmFlexNative;
          if (nativeApp && typeof nativeApp.exitVideoMode === "function") {
            nativeApp.exitVideoMode();
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const orient = (screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation) as any;
          if (orient && typeof orient.unlock === "function") {
            orient.unlock();
          }
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
        } catch {}
      }
    };
  }, []);

  // Mobile-only rotation button toggle
  const toggleRotate = async () => {
    try {
      if (containerRef.current && !document.fullscreenElement) {
        await containerRef.current.requestFullscreen().catch(() => {});
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orient = (screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation) as any;
      if (orient && typeof orient.lock === "function") {
        if (!isLandscapeMode) {
          await orient.lock("landscape").catch(() => {});
          setIsLandscapeMode(true);
        } else {
          if (typeof orient.unlock === "function") orient.unlock();
          setIsLandscapeMode(false);
        }
      } else {
        setIsLandscapeMode(!isLandscapeMode);
      }
    } catch {
      setIsLandscapeMode(!isLandscapeMode);
    }
  };

  // Fetch episodes list if TV series
  useEffect(() => {
    if (isSeries) {
      fetch(`/api/episodes/${imdbId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.episodes && data.episodes.length > 0) {
            setEpisodesList(data.episodes);
          } else {
            setEpisodesList([
              { id: `${movie.id}:1:1`, season: 1, episode: 1, title: "Épisode 1", thumbnail: movie.backdropUrl },
              { id: `${movie.id}:1:2`, season: 1, episode: 2, title: "Épisode 2", thumbnail: movie.backdropUrl },
              { id: `${movie.id}:1:3`, season: 1, episode: 3, title: "Épisode 3", thumbnail: movie.backdropUrl },
            ]);
          }
        })
        .catch(() => {});
    }
  }, [imdbId, isSeries, movie]);

  // Play FilmFlex Intro Video automatically
  useEffect(() => {
    if (introVideoRef.current) {
      introVideoRef.current.play().catch(() => {
        if (introVideoRef.current) {
          introVideoRef.current.muted = true;
          introVideoRef.current.play().catch(() => finishIntro());
        }
      });
    }
  }, []);

  const finishIntro = () => {
    setIsPlayingIntro(false);
  };

  // Top Bar controls auto-hide timer
  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showServerMenu && !showEpisodesDrawer) {
        setShowControls(false);
      }
    }, 3800);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Smart TV / Chromecast Cast function
  const handleCastToTV = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setCastNotice("Diffusion vers votre écran TV activée avec succès !");
        setTimeout(() => setCastNotice(null), 4000);
        return;
      }
      setCastNotice("Utilisez l'option Cast / Diffuser de votre navigateur pour votre TV.");
      setTimeout(() => setCastNotice(null), 4500);
    } catch (err) {
      console.warn("Cast cancelled", err);
    }
  };

  // Build stream URL according to selected server
  const getStreamUrl = () => {
    // 1. Tunisian Cinema & Series: Direct clean embed without scrapers
    if (activeServer === "tunisien") {
      if (movie.id.includes("choufly")) {
        const epIndex = Math.max(0, currentEpisode - 1);
        return `https://www.youtube-nocookie.com/embed/videoseries?list=PLtKHe7Z2QnnH8hjtv4Ehv4x00ZDIhifUr&index=${epIndex}&autoplay=1`;
      }
      if (movie.trailerYoutubeId) {
        return `https://www.youtube-nocookie.com/embed/${movie.trailerYoutubeId}?autoplay=1&rel=0`;
      }
      if (movie.videoUrl && movie.videoUrl !== "/sample.mp4") {
        return movie.videoUrl;
      }
    }

    // 2. Server 1 (DEFAULT): VidLink Pro (Netflix 4K - 100% Zero-Ads, Zero-Popups, FR/AR subtitles)
    if (activeServer === "vidlink") {
      return isSeries
        ? `https://vidlink.pro/tv/${imdbId}/${currentSeason}/${currentEpisode}?primaryColor=e50914&secondaryColor=181818&iconColor=ffffff&icons=netflix&autoplay=true`
        : `https://vidlink.pro/movie/${imdbId}?primaryColor=e50914&secondaryColor=181818&iconColor=ffffff&icons=netflix&autoplay=true`;
    }

    // 3. Server 2: Torrentio CDN 4K (Clean CDN Stream Engine)
    if (activeServer === "torrentio") {
      return isSeries
        ? `https://vidsrc.cc/v2/embed/tv/${imdbId}/${currentSeason}/${currentEpisode}?autoPlay=true`
        : `https://vidsrc.cc/v2/embed/movie/${imdbId}?autoPlay=true`;
    }

    // 4. Server 3: Embed.su Multi-Language Player
    if (activeServer === "embedsu") {
      return isSeries
        ? `https://embed.su/embed/tv/${imdbId}/${currentSeason}/${currentEpisode}`
        : `https://embed.su/embed/movie/${imdbId}`;
    }

    // 5. Server 4: FilmFlex Mondial Backup (vidsrc.me)
    return isSeries
      ? `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=${currentSeason}&episode=${currentEpisode}`
      : `https://vidsrc.me/embed/movie?imdb=${imdbId}`;
  };

  // 1-Click Auto-Best Switcher (Anti-Coupure)
  const handleAutoBestSwitch = () => {
    const serverOrder: ServerType[] = isTunisian
      ? ["tunisien", "vidlink", "torrentio", "embedsu", "mondial"]
      : ["vidlink", "torrentio", "embedsu", "mondial"];
    const currentIndex = serverOrder.indexOf(activeServer);
    const nextServer = serverOrder[(currentIndex + 1) % serverOrder.length];
    setActiveServer(nextServer);
    const nextInfo = SERVER_OPTIONS.find((s) => s.id === nextServer);
    setResumedNotice(`⚡ Basculé sur : ${nextInfo?.name || "Serveur alternatif"}`);
    setTimeout(() => setResumedNotice(null), 3500);
  };

  const handleSelectEpisode = (ep: Episode) => {
    setCurrentSeason(ep.season);
    setCurrentEpisode(ep.episode);
    setShowEpisodesDrawer(false);
    if (profile) {
      saveMovieProgress(profile.id, movie.id, 60, movie.durationSeconds || 7200);
    }
  };

  const currentSeasonEpisodes = episodesList.filter((e) => e.season === currentSeason);
  const availableServers = SERVER_OPTIONS.filter((srv) => {
    if (srv.id === "tunisien") return isTunisian;
    if (srv.id === "offline") return isDownloaded || Boolean(offlineVideoUrl) || (typeof navigator !== "undefined" && !navigator.onLine);
    return true;
  });
  const activeServerInfo = availableServers.find((s) => s.id === activeServer) || availableServers[0];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden text-white font-sans w-full h-full"
    >
      {/* ============================================================ */}
      {/* 1. ACTUAL FILMFLEX.MP4 INTRO - 100% FULLSCREEN COVER          */}
      {/* ============================================================ */}
      {isPlayingIntro ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
          <video
            ref={introVideoRef}
            src="/filmflex.mp4"
            playsInline
            autoPlay
            onEnded={finishIntro}
            onError={finishIntro}
            className="w-full h-full object-cover"
          />
          <button
            onClick={finishIntro}
            className="absolute bottom-8 right-8 z-30 px-6 py-2.5 rounded-full border border-white/20 bg-black/70 hover:bg-neutral-900 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-2xl hover:scale-105 flex items-center gap-2 backdrop-blur-md cursor-pointer"
          >
            <span>Passer l&apos;intro</span>
            <FastForward className="w-4 h-4 text-[#E50914]" />
          </button>
        </div>
      ) : (
        /* ============================================================ */
        /* 2. CLOUD HD VIDEO PLAYER (100% FULL SCREEN & INTERACTIVE)    */
        /* ============================================================ */
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {activeServer === "offline" ? (
            <video
              key={offlineVideoUrl || "offline-video"}
              src={offlineVideoUrl || movie.videoUrl || "/sample.mp4"}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain absolute inset-0 z-10 bg-black"
            />
          ) : (
            <iframe
              key={`${activeServer}-${imdbId}-${currentSeason}-${currentEpisode}`}
              src={getStreamUrl()}
              className="w-full h-full border-0 absolute inset-0 z-10"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="origin"
            />
          )}

          {/* Offline Playback Notification Badge */}
          {activeServer === "offline" && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-semibold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 pointer-events-none z-40 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Lecture Hors-Ligne (Stockage Interne FilmFlex)</span>
            </div>
          )}

          {/* Resumed Notification Badge */}
          {resumedNotice && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/90 border border-[#E50914]/50 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl animate-fade-in flex items-center gap-2 pointer-events-none z-40">
              <span className="w-2 h-2 rounded-full bg-[#E50914] animate-ping" />
              <span>{resumedNotice}</span>
            </div>
          )}

          {/* Cast Notification Badge */}
          {castNotice && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/95 border border-[#E50914]/60 text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-2xl animate-fade-in flex items-center gap-2 z-40 pointer-events-none">
              <Cast className="w-4 h-4 text-[#E50914]" />
              <span>{castNotice}</span>
            </div>
          )}

          {/* Anti-Coupure Floating Assistant (If buffering or slow stream) */}
          {showLagHelp && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#121216]/95 border border-[#E50914] rounded-full px-4 py-2 flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.9)] z-40 animate-fade-in backdrop-blur-md">
              <span className="text-xs text-neutral-200 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Flux lent ou coupure ?</span>
              </span>
              <button
                onClick={() => {
                  handleAutoBestSwitch();
                  setShowLagHelp(false);
                }}
                className="px-3 py-1 bg-[#E50914] hover:bg-[#b80710] text-white text-xs font-bold rounded-full transition-all flex items-center gap-1 shadow cursor-pointer hover:scale-105"
              >
                <Zap className="w-3 h-3 fill-white" />
                <span>Basculer sur le meilleur flux</span>
              </button>
              <button
                onClick={() => setShowLagHelp(false)}
                className="text-neutral-400 hover:text-white p-0.5 cursor-pointer"
                title="Fermer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* TOP BAR: Clean, Minimal, Desktop & Mobile                    */}
          {/* ============================================================ */}
          <div
            className={`absolute top-0 left-0 right-0 p-3 sm:p-5 bg-gradient-to-b from-black/95 via-black/60 to-transparent flex items-center justify-between transition-opacity duration-300 z-30 pointer-events-none ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Left: Back button & Title */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 pr-2 pointer-events-auto">
              <button
                onClick={onBack}
                className="text-neutral-300 hover:text-white transition-colors p-1.5 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/10 cursor-pointer shrink-0"
                title="Retour"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <h2 className="text-xs sm:text-base font-semibold tracking-wide text-neutral-100 truncate max-w-[150px] sm:max-w-md drop-shadow">
                {movie.title}
                {isSeries && ` (S${currentSeason} E${currentEpisode})`}
              </h2>
            </div>

            {/* Right: Controls & Server Switcher */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 pointer-events-auto">
              {/* Episodes Drawer Toggle for Series */}
              {isSeries && (
                <button
                  onClick={() => setShowEpisodesDrawer(!showEpisodesDrawer)}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-full bg-black/75 hover:bg-neutral-900 text-neutral-200 border border-white/15 text-xs font-semibold transition-all backdrop-blur-md shadow-lg cursor-pointer"
                  title="Liste des épisodes"
                >
                  <ListVideo className="w-3.5 h-3.5 text-[#E50914]" />
                  <span className="hidden sm:inline">Épisodes</span>
                </button>
              )}

              {/* Anti-Coupure Quick Button (Auto-Best) */}
              <button
                onClick={handleAutoBestSwitch}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#E50914] hover:bg-[#b80710] text-white text-xs font-bold transition-all shadow-md shadow-[#E50914]/40 hover:scale-105 active:scale-95 cursor-pointer"
                title="Basculer instantanément sur le meilleur flux sans coupure"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span className="hidden sm:inline">Auto-Best</span>
              </button>

              {/* Server Switcher Pill */}
              <div className="relative">
                <button
                  onClick={() => setShowServerMenu(!showServerMenu)}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-full bg-black/75 hover:bg-neutral-900 border border-white/15 text-neutral-200 text-xs font-semibold transition-all backdrop-blur-md shadow-lg cursor-pointer"
                  title="Changer de serveur de streaming"
                >
                  <Server className="w-3.5 h-3.5 text-[#E50914]" />
                  <span className="hidden sm:inline">{activeServerInfo.name}</span>
                </button>

                {showServerMenu && (
                  <div className="absolute top-11 right-0 w-72 bg-[#141414]/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-2.5 shadow-2xl z-50 animate-scale-up space-y-1">
                    <div className="text-[11px] font-bold text-neutral-400 px-2 py-1 border-b border-neutral-800 flex items-center justify-between">
                      <span>Serveurs de Streaming</span>
                      <span className="text-[10px] text-emerald-400">100% Zéro Pub (Netflix)</span>
                    </div>
                    {availableServers.map((srv) => (
                      <button
                        key={srv.id}
                        onClick={() => {
                          setActiveServer(srv.id);
                          setShowServerMenu(false);
                        }}
                        className={`w-full flex items-center justify-between text-left p-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                          activeServer === srv.id
                            ? "bg-[#E50914]/20 border border-[#E50914]/50 text-white"
                            : "hover:bg-neutral-800/80 text-neutral-300"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold flex items-center gap-1.5">
                            {srv.name}
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono">
                              {srv.badge}
                            </span>
                          </span>
                          <span className="text-[10px] text-neutral-400 mt-0.5">
                            {srv.description}
                          </span>
                        </div>
                        {activeServer === srv.id && (
                          <Check className="w-4 h-4 text-[#E50914] flex-none ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Rotate Screen button: ONLY VISIBLE ON MOBILE */}
              <button
                onClick={toggleRotate}
                className="flex md:hidden items-center gap-1 px-2 py-1.5 rounded-full bg-black/75 hover:bg-neutral-900 text-neutral-200 border border-white/15 text-[10px] font-semibold transition-all backdrop-blur-md shadow-lg"
                title="Tourner l'écran"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#E50914]" />
                <span className="hidden sm:inline">{isLandscapeMode ? "Portrait" : "Paysage"}</span>
              </button>

              {/* 4K UHD Badge (Desktop only) */}
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 text-neutral-200 border border-white/15 text-xs font-mono font-semibold uppercase backdrop-blur-md shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                4K UHD
              </span>

              {/* Smart TV Chromecast Cast button */}
              <button
                onClick={handleCastToTV}
                className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-black/75 hover:bg-neutral-900 border border-white/15 text-neutral-200 text-xs font-semibold transition-all backdrop-blur-md shadow-lg cursor-pointer"
                title="Diffuser vers Smart TV ou Chromecast"
              >
                <Tv className="w-4 h-4 text-[#E50914]" />
                <span className="hidden md:inline">Diffuser sur TV</span>
              </button>

              {/* Fullscreen toggle */}
              <button
                onClick={toggleFullscreen}
                className="text-neutral-300 hover:text-white transition-colors p-1.5 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/10 cursor-pointer"
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* TV SERIES EPISODES DRAWER (IF SERIES)                         */}
          {/* ============================================================ */}
          {showEpisodesDrawer && isSeries && (
            <div className="absolute right-0 top-0 bottom-0 w-80 sm:w-96 bg-[#141414]/95 backdrop-blur-xl border-l border-neutral-800 z-40 p-4 flex flex-col animate-slide-left">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <ListVideo className="w-4 h-4 text-[#E50914]" />
                  <span>Épisodes - Saison {currentSeason}</span>
                </h3>
                <button
                  onClick={() => setShowEpisodesDrawer(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
                {currentSeasonEpisodes.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-8">
                    Chargement des épisodes en cours...
                  </p>
                ) : (
                  currentSeasonEpisodes.map((ep) => {
                    const isCurrent = ep.season === currentSeason && ep.episode === currentEpisode;
                    return (
                      <div
                        key={ep.id}
                        onClick={() => handleSelectEpisode(ep)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                          isCurrent
                            ? "bg-[#E50914]/20 border-[#E50914] text-white"
                            : "bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                        }`}
                      >
                        <div className="relative w-20 aspect-video rounded overflow-hidden bg-neutral-800 flex-none">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ep.thumbnail || movie.backdropUrl}
                            alt={ep.title}
                            className="w-full h-full object-cover"
                          />
                          {isCurrent && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Play className="w-4 h-4 text-[#E50914] fill-[#E50914]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate leading-tight">
                            {ep.episode}. {ep.title}
                          </p>
                          <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                            {ep.overview || "Regarder cet épisode sur FilmFlex"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
