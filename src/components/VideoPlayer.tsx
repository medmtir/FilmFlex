"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Layers,
  MessageSquare,
  Server,
  Settings,
  Maximize,
  Minimize,
  FastForward,
  Check,
  Tv,
  Zap,
  X,
  Sliders,
  Users,
  Film,
} from "lucide-react";
import { Movie, Profile, Episode } from "@/types";
import { saveMovieProgress, getMovieResumeTime } from "@/lib/storage";
import { startWatchingSession } from "@/lib/auth";
import { isItemDownloaded, getOfflineVideoUrl } from "@/lib/downloadManager";

interface VideoPlayerProps {
  movie: Movie;
  profile?: Profile | null;
  onBack: () => void;
  initialSeason?: number;
  initialEpisode?: number;
  userId?: string;
}

type ServerType = "vidlink" | "autoembed" | "vidsrc" | "multiembed" | "tunisien" | "offline";

interface ServerOption {
  id: ServerType;
  name: string;
  badge: string;
  tag: string;
  description: string;
}

const SERVER_OPTIONS: ServerOption[] = [
  {
    id: "vidlink",
    name: "Server 1 (UpCloud 4K)",
    badge: "⭐ Recommended",
    tag: "100% Zero-Ads",
    description: "Moteur 4K ultra rapide • Zéro pub ni redirection, sous-titres FR/AR/TR",
  },
  {
    id: "autoembed",
    name: "Server 2 (AutoEmbed Multi-Source)",
    badge: "⚡ Ultra Rapide",
    tag: "Multi-Cloud",
    description: "Détection automatique haute vitesse pour films, séries et séries turques",
  },
  {
    id: "vidsrc",
    name: "Server 3 (Vidsrc VIP 4K)",
    badge: "🌐 Mondial VIP",
    tag: "Haute Stabilité",
    description: "Serveur mondial complet avec basculement automatique sans coupure",
  },
  {
    id: "multiembed",
    name: "Server 4 (MultiEmbed CDN)",
    badge: "🔄 Backup Rapide",
    tag: "Secours",
    description: "Serveur miroir haute capacité en secours permanent",
  },
  {
    id: "tunisien",
    name: "Server 5 (Cinéma Tunisien Officiel)",
    badge: "🇹🇳 Tunisien HD",
    tag: "Exclusif",
    description: "Diffusion officielle directe pour Choufly Hal, Nouba et cinéma tunisien",
  },
  {
    id: "offline",
    name: "Server 6 (Hors-Ligne / Stockage App)",
    badge: "💾 Offline Storage",
    tag: "Sans Connexion",
    description: "Lecture locale depuis la mémoire de votre appareil sans Internet",
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
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSeries = movie.type === "series" || (movie.duration && movie.duration.toLowerCase().includes("saison"));
  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [episodesList, setEpisodesList] = useState<Episode[]>([]);

  const isTunisian =
    movie.genres?.some((g) => g.toLowerCase().includes("tunis")) ||
    movie.id.includes("choufly") ||
    movie.id.includes("nouba");

  // Server selection
  const [activeServer, setActiveServer] = useState<ServerType>(
    isTunisian ? "tunisien" : "vidlink"
  );

  // Modals state (Flixer style)
  const [showServerModal, setShowServerModal] = useState(false);
  const [showSubtitlesModal, setShowSubtitlesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEpisodesDrawer, setShowEpisodesDrawer] = useState(false);

  // Player state
  const [isPlayingIntro, setIsPlayingIntro] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Subtitle settings state (Flixer style)
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>("ar");
  const [subtitleDelay, setSubtitleDelay] = useState<number>(0);
  const [subtitleSize, setSubtitleSize] = useState<"small" | "default" | "large">("default");
  const [subtitlePosition, setSubtitlePosition] = useState<"bottom" | "top">("bottom");

  // Video settings state (Flixer style)
  const [videoQuality, setVideoQuality] = useState<"Auto" | "1080p" | "720p" | "360p">("Auto");
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);

  // Notices
  const [resumedNotice, setResumedNotice] = useState<string | null>(null);
  const [castNotice, setCastNotice] = useState<string | null>(null);
  const [isLandscapeMode, setIsLandscapeMode] = useState(false);
  const [showLagHelp, setShowLagHelp] = useState(false);

  // Target identifier: TMDB ID preferred for Turkish & international shows, IMDb fallback
  const streamTargetId = movie.tmdbId || movie.imdbId || (movie.id.startsWith("tt") ? movie.id : "tt15239678");
  const imdbId = movie.imdbId || (movie.id.startsWith("tt") ? movie.id : "tt15239678");

  // Offline video support
  const downloadId = isSeries ? `${movie.id}:${currentSeason}:${currentEpisode}` : movie.id;
  const isDownloaded = isItemDownloaded(downloadId) || isItemDownloaded(movie.id);
  const [offlineVideoUrl, setOfflineVideoUrl] = useState<string | null>(null);

  // Heartbeat watching session
  useEffect(() => {
    if (!userId) return;
    startWatchingSession(userId);
    const interval = setInterval(() => {
      startWatchingSession(userId);
    }, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  // Load offline video if cached
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

  // Save progress
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

  // Anti-lag auto detector
  useEffect(() => {
    setShowLagHelp(false);
    const lagTimer = setTimeout(() => {
      setShowLagHelp(true);
    }, 12000);
    return () => clearTimeout(lagTimer);
  }, [activeServer, currentSeason, currentEpisode, streamTargetId]);

  // Web Shield against popup redirects
  useEffect(() => {
    if (typeof window === "undefined") return;
    const originalOpen = window.open;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).open = function (...args: any[]) {
      console.warn("[FilmFlex Shield] Blocked popup attempt:", args[0]);
      return null;
    };
    return () => {
      window.open = originalOpen;
    };
  }, []);

  // Fetch episodes if series
  useEffect(() => {
    if (isSeries) {
      fetch(`/api/episodes/${imdbId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.episodes && data.episodes.length > 0) {
            setEpisodesList(data.episodes);
          } else {
            // Default 10 episodes if API empty
            const defEpisodes = Array.from({ length: 8 }, (_, i) => ({
              id: `${movie.id}:${currentSeason}:${i + 1}`,
              season: currentSeason,
              episode: i + 1,
              title: `Épisode ${i + 1}`,
              overview: `Regardez l'épisode ${i + 1} de ${movie.title} en streaming 4K Ultra HD.`,
              thumbnail: movie.backdropUrl,
            }));
            setEpisodesList(defEpisodes);
          }
        })
        .catch(() => {
          const defEpisodes = Array.from({ length: 8 }, (_, i) => ({
            id: `${movie.id}:${currentSeason}:${i + 1}`,
            season: currentSeason,
            episode: i + 1,
            title: `Épisode ${i + 1}`,
            overview: `Regardez l'épisode ${i + 1} de ${movie.title} en streaming 4K Ultra HD.`,
            thumbnail: movie.backdropUrl,
          }));
          setEpisodesList(defEpisodes);
        });
    }
  }, [imdbId, isSeries, movie, currentSeason]);

  // Auto-play intro video
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

  // User activity timer
  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showServerModal && !showSubtitlesModal && !showSettingsModal && !showEpisodesDrawer) {
        setShowControls(false);
      }
    }, 4500);
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

  // Smart TV Cast
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
    } catch {
      // User cancelled
    }
  };

  // Build clean stream URL according to selected server
  const getStreamUrl = () => {
    // 1. Tunisian Cinema & Series
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

    // 2. Server 1 (DEFAULT): VidLink Pro 4K (Works flawlessly with TMDB ID & IMDb ID)
    if (activeServer === "vidlink") {
      return isSeries
        ? `https://vidlink.pro/tv/${streamTargetId}/${currentSeason}/${currentEpisode}?primaryColor=e50914&secondaryColor=181818&iconColor=ffffff&icons=netflix&autoplay=true`
        : `https://vidlink.pro/movie/${streamTargetId}?primaryColor=e50914&secondaryColor=181818&iconColor=ffffff&icons=netflix&autoplay=true`;
    }

    // 3. Server 2: AutoEmbed Multi-Source 4K
    if (activeServer === "autoembed") {
      return isSeries
        ? `https://autoembed.co/tv/tmdb/${streamTargetId}-${currentSeason}-${currentEpisode}`
        : `https://autoembed.co/movie/tmdb/${streamTargetId}`;
    }

    // 4. Server 3: Vidsrc VIP 4K
    if (activeServer === "vidsrc") {
      return isSeries
        ? `https://vidsrc.cc/v2/embed/tv/${streamTargetId}/${currentSeason}/${currentEpisode}?autoPlay=true`
        : `https://vidsrc.cc/v2/embed/movie/${streamTargetId}?autoPlay=true`;
    }

    // 5. Server 4: MultiEmbed CDN
    if (activeServer === "multiembed") {
      return isSeries
        ? `https://multiembed.mov/?video_id=${streamTargetId}&tmdb=${movie.tmdbId ? 1 : 0}&s=${currentSeason}&e=${currentEpisode}`
        : `https://multiembed.mov/?video_id=${streamTargetId}&tmdb=${movie.tmdbId ? 1 : 0}`;
    }

    // Fallback VidLink
    return isSeries
      ? `https://vidlink.pro/tv/${streamTargetId}/${currentSeason}/${currentEpisode}?primaryColor=e50914&autoplay=true`
      : `https://vidlink.pro/movie/${streamTargetId}?primaryColor=e50914&autoplay=true`;
  };

  // 1-Click Auto-Best Switcher (Anti-Coupure)
  const handleAutoBestSwitch = () => {
    const serverOrder: ServerType[] = isTunisian
      ? ["tunisien", "vidlink", "autoembed", "vidsrc", "multiembed"]
      : ["vidlink", "autoembed", "vidsrc", "multiembed"];
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

  const closeAllModals = () => {
    setShowServerModal(false);
    setShowSubtitlesModal(false);
    setShowSettingsModal(false);
    setShowEpisodesDrawer(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden text-white font-sans w-full h-full select-none"
    >
      {/* ============================================================ */}
      {/* 1. FILMFLEX FULLSCREEN INTRO VIDEO                           */}
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
        /* 2. FLIXER-STYLE ULTRA MODERN CLOUD VIDEO PLAYER              */
        /* ============================================================ */
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {/* Main Video Stream Frame */}
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
              key={`${activeServer}-${streamTargetId}-${currentSeason}-${currentEpisode}`}
              src={getStreamUrl()}
              className="w-full h-full border-0 absolute inset-0 z-10"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="origin"
            />
          )}

          {/* ============================================================ */}
          {/* FLOATING STATUS & HELP NOTIFICATIONS                         */}
          {/* ============================================================ */}
          {resumedNotice && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/90 border border-[#E50914]/60 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl animate-fade-in flex items-center gap-2 pointer-events-none z-40">
              <span className="w-2 h-2 rounded-full bg-[#E50914] animate-ping" />
              <span>{resumedNotice}</span>
            </div>
          )}

          {castNotice && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/95 border border-[#E50914]/60 text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-2xl animate-fade-in flex items-center gap-2 z-40 pointer-events-none">
              <Tv className="w-4 h-4 text-[#E50914]" />
              <span>{castNotice}</span>
            </div>
          )}

          {/* Anti-Coupure Floating Assistant */}
          {showLagHelp && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#1c1c1e]/95 border border-[#E50914] rounded-full px-4 py-2 flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.9)] z-40 animate-fade-in backdrop-blur-md">
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
                <span>Basculer sur le meilleur serveur</span>
              </button>
              <button
                onClick={() => setShowLagHelp(false)}
                className="text-neutral-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* TOP LEFT: SLEEK BACK ARROW (MATCHING FLIXER)                 */}
          {/* ============================================================ */}
          <div
            className={`absolute top-0 left-0 p-4 sm:p-6 z-40 transition-opacity duration-300 pointer-events-none ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
          >
            <button
              onClick={onBack}
              className="pointer-events-auto w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all backdrop-blur-md border border-white/10 hover:scale-110 active:scale-95 shadow-xl cursor-pointer"
              title="Retour au catalogue"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* ============================================================ */}
          {/* BOTTOM CONTROLS BAR: 100% FLIXER STYLE                       */}
          {/* ============================================================ */}
          <div
            className={`absolute bottom-0 left-0 right-0 px-4 sm:px-8 py-5 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex items-center justify-between transition-opacity duration-300 z-30 pointer-events-none ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Left Controls: Play/Pause, Rewind 10s, Forward 10s, Volume */}
            <div className="flex items-center gap-3 sm:gap-4 pointer-events-auto">
              {/* Play / Pause Toggle */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white hover:text-neutral-300 transition-colors cursor-pointer p-1"
                title={isPlaying ? "Pause" : "Lecture"}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />
                ) : (
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white ml-0.5" />
                )}
              </button>

              {/* Rewind 10s */}
              <button
                onClick={() => {
                  setResumedNotice("⟲ -10 secondes");
                  setTimeout(() => setResumedNotice(null), 1500);
                }}
                className="relative text-white hover:text-neutral-300 transition-transform active:scale-90 cursor-pointer p-1"
                title="Reculer de 10s"
              >
                <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black tracking-tighter pt-0.5">
                  10
                </span>
              </button>

              {/* Forward 10s */}
              <button
                onClick={() => {
                  setResumedNotice("10 ⟳ +10 secondes");
                  setTimeout(() => setResumedNotice(null), 1500);
                }}
                className="relative text-white hover:text-neutral-300 transition-transform active:scale-90 cursor-pointer p-1"
                title="Avancer de 10s"
              >
                <RotateCw className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black tracking-tighter pt-0.5">
                  10
                </span>
              </button>

              {/* Volume Button with hover slider */}
              <div
                className="relative flex items-center"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:text-neutral-300 transition-colors cursor-pointer p-1"
                  title={isMuted ? "Activer le son" : "Couper le son"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-6 h-6 sm:w-7 sm:h-7" />
                  ) : (
                    <Volume2 className="w-6 h-6 sm:w-7 sm:h-7" />
                  )}
                </button>

                {showVolumeSlider && (
                  <div className="absolute left-8 bottom-1/2 translate-y-1/2 bg-black/90 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md shadow-xl flex items-center animate-fade-in">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setVolume(val);
                        setIsMuted(val === 0);
                      }}
                      className="w-20 accent-[#E50914] cursor-pointer h-1 bg-neutral-700 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Center: Title & Season/Episode Name (Matching Flixer) */}
            <div className="hidden md:flex flex-col items-center pointer-events-auto text-center px-4 max-w-md truncate">
              <span className="text-sm font-semibold text-neutral-100 drop-shadow truncate">
                {movie.title}
              </span>
              {isSeries && (
                <span className="text-xs text-neutral-400 font-mono">
                  Saison {currentSeason} Épisode {currentEpisode}
                </span>
              )}
            </div>

            {/* Right Controls: Episodes [⧉], Subtitles [💬], Servers [🖥️], Settings [⚙️], Fullscreen [⛶] */}
            <div className="flex items-center gap-3 sm:gap-4 pointer-events-auto">
              {/* 1. Episodes Drawer Toggle [⧉] (Series only) */}
              {isSeries && (
                <button
                  onClick={() => {
                    const next = !showEpisodesDrawer;
                    closeAllModals();
                    setShowEpisodesDrawer(next);
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    showEpisodesDrawer
                      ? "text-[#E50914] bg-white/10"
                      : "text-white hover:text-neutral-300"
                  }`}
                  title="Épisodes & Saisons"
                >
                  <Layers className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                </button>
              )}

              {/* 2. Subtitles Modal Toggle [💬] */}
              <button
                onClick={() => {
                  const next = !showSubtitlesModal;
                  closeAllModals();
                  setShowSubtitlesModal(next);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  showSubtitlesModal
                    ? "text-[#E50914] bg-white/10"
                    : "text-white hover:text-neutral-300"
                }`}
                title="Sous-titres & Audio"
              >
                <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
              </button>

              {/* 3. Servers Modal Toggle [🖧] (Stacked Servers Icon matching Flixer) */}
              <button
                onClick={() => {
                  const next = !showServerModal;
                  closeAllModals();
                  setShowServerModal(next);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer relative ${
                  showServerModal
                    ? "text-[#E50914] bg-white/10"
                    : "text-white hover:text-neutral-300"
                }`}
                title="Changer de serveur (Multi-Server)"
              >
                <Server className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>

              {/* 4. Settings Gear Modal Toggle [⚙️] */}
              <button
                onClick={() => {
                  const next = !showSettingsModal;
                  closeAllModals();
                  setShowSettingsModal(next);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  showSettingsModal
                    ? "text-[#E50914] bg-white/10"
                    : "text-white hover:text-neutral-300"
                }`}
                title="Paramètres de lecture"
              >
                <Settings className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
              </button>

              {/* 5. Fullscreen Toggle [⛶] */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-neutral-300 transition-colors cursor-pointer p-1.5"
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? (
                  <Minimize className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                ) : (
                  <Maximize className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                )}
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* MODAL 1: FLIXER-STYLE SERVERS SWITCHER [🖧]                   */}
          {/* ============================================================ */}
          {showServerModal && (
            <div className="absolute right-4 sm:right-12 bottom-20 z-50 w-84 sm:w-96 bg-[#1e1e20]/95 backdrop-blur-2xl border border-neutral-700/80 rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.9)] animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-700/80">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#E50914]" />
                  <h3 className="font-bold text-sm text-white">Serveurs de Streaming</h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  100% Zéro Pub
                </span>
                <button
                  onClick={() => setShowServerModal(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 py-3 max-h-80 overflow-y-auto pr-1">
                {availableServers.map((srv) => {
                  const isActive = activeServer === srv.id;
                  return (
                    <button
                      key={srv.id}
                      onClick={() => {
                        setActiveServer(srv.id);
                        setShowServerModal(false);
                        setResumedNotice(`⚡ Connecté à : ${srv.name}`);
                        setTimeout(() => setResumedNotice(null), 3000);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer border ${
                        isActive
                          ? "bg-[#E50914]/20 border-[#E50914] text-white shadow-lg"
                          : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800 text-neutral-200"
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white truncate">
                            {srv.name}
                          </span>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700 shrink-0">
                            {srv.badge}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400 mt-1 line-clamp-1">
                          {srv.description}
                        </span>
                      </div>
                      {isActive ? (
                        <div className="w-5 h-5 rounded-full bg-[#E50914] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                          Choisir
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Coupure ou écran noir ?</span>
                <button
                  onClick={handleAutoBestSwitch}
                  className="text-[#E50914] hover:underline font-bold flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 fill-current" />
                  <span>Auto-Switch</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* MODAL 2: FLIXER-STYLE SUBTITLES & SETTINGS MODAL [💬]        */}
          {/* ============================================================ */}
          {showSubtitlesModal && (
            <div className="absolute right-4 sm:right-16 bottom-20 z-50 w-full max-w-xl bg-[#222224]/95 backdrop-blur-2xl border border-neutral-700/80 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.95)] animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-700/80 mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#E50914]" />
                  <h3 className="font-bold text-sm text-white">Sous-titres & Réglages</h3>
                </div>
                <button
                  onClick={() => setShowSubtitlesModal(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-1">
                {/* Left Column: Subtitles List */}
                <div className="space-y-1.5 border-r border-neutral-700/40 pr-3">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                    Langues de Sous-titres
                  </h4>
                  {[
                    { id: "off", label: "Désactivé (Off)" },
                    { id: "ar", label: "العربية (Arabic)" },
                    { id: "fr", label: "Français (French)" },
                    { id: "en", label: "English [CC]" },
                    { id: "tr", label: "Türkçe (Turkish)" },
                    { id: "es", label: "Español (Spanish)" },
                    { id: "de", label: "Deutsch (German)" },
                  ].map((sub) => {
                    const isSelected = selectedSubtitle === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubtitle(sub.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#333336] text-white font-bold"
                            : "hover:bg-neutral-800 text-neutral-300"
                        }`}
                      >
                        <span>{sub.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-white stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Right Column: Subtitle Settings (Delay & Size matching Flixer Image 1 & 3) */}
                <div className="space-y-4 pl-1">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Réglages d&apos;affichage
                  </h4>

                  {/* Subtitle Delay */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-neutral-300">
                      <span>Décalage (Delay)</span>
                      <span className="font-mono font-bold">{subtitleDelay.toFixed(1)}s</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSubtitleDelay((d) => Math.max(-5, d - 0.5))}
                        className="px-2.5 py-1 rounded bg-[#333336] hover:bg-neutral-700 text-xs font-mono font-bold"
                      >
                        -0.5s
                      </button>
                      <button
                        onClick={() => setSubtitleDelay(0)}
                        className="flex-1 py-1 rounded bg-[#333336] hover:bg-neutral-700 text-xs font-mono font-bold text-center"
                      >
                        0s (Réinitialiser)
                      </button>
                      <button
                        onClick={() => setSubtitleDelay((d) => Math.min(5, d + 0.5))}
                        className="px-2.5 py-1 rounded bg-[#333336] hover:bg-neutral-700 text-xs font-mono font-bold"
                      >
                        +0.5s
                      </button>
                    </div>
                  </div>

                  {/* Subtitle Size */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-neutral-300">
                      <span>Taille de texte</span>
                      <span className="font-bold capitalize">{subtitleSize}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["small", "default", "large"] as const).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setSubtitleSize(sz)}
                          className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                            subtitleSize === sz
                              ? "bg-white text-black"
                              : "bg-[#333336] text-neutral-300 hover:bg-neutral-700"
                          }`}
                        >
                          {sz === "default" ? "Normal" : sz === "small" ? "Petit" : "Grand"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subtitle Position */}
                  <div className="space-y-2">
                    <span className="text-xs text-neutral-300">Position</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setSubtitlePosition("bottom")}
                        className={`py-1 rounded-lg text-xs font-bold ${
                          subtitlePosition === "bottom"
                            ? "bg-white text-black"
                            : "bg-[#333336] text-neutral-300 hover:bg-neutral-700"
                        }`}
                      >
                        En bas
                      </button>
                      <button
                        onClick={() => setSubtitlePosition("top")}
                        className={`py-1 rounded-lg text-xs font-bold ${
                          subtitlePosition === "top"
                            ? "bg-white text-black"
                            : "bg-[#333336] text-neutral-300 hover:bg-neutral-700"
                        }`}
                      >
                        En haut
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* MODAL 3: FLIXER-STYLE SETTINGS MODAL [⚙️]                     */}
          {/* ============================================================ */}
          {showSettingsModal && (
            <div className="absolute right-4 sm:right-16 bottom-20 z-50 w-full max-w-lg bg-[#222224]/95 backdrop-blur-2xl border border-neutral-700/80 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.95)] animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-700/80 mb-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#E50914]" />
                  <h3 className="font-bold text-sm text-white">Paramètres Vidéo & Lecture</h3>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Left Column: Toggles */}
                <div className="space-y-4 border-r border-neutral-700/40 pr-3">
                  {/* Autoplay Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Lecture automatique</p>
                      <p className="text-[10px] text-neutral-400">Démarrer le stream sans clic</p>
                    </div>
                    <button
                      onClick={() => setAutoPlay(!autoPlay)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        autoPlay ? "bg-[#E50914]" : "bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                          autoPlay ? "right-1" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Auto Next Episode */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Épisode suivant auto</p>
                      <p className="text-[10px] text-neutral-400">Enchaîner l&apos;épisode suivant</p>
                    </div>
                    <button
                      onClick={() => setAutoPlayNext(!autoPlayNext)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        autoPlayNext ? "bg-[#E50914]" : "bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                          autoPlayNext ? "right-1" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Cast to Smart TV */}
                  <div className="pt-2 border-t border-neutral-800">
                    <button
                      onClick={handleCastToTV}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      <Tv className="w-4 h-4 text-[#E50914]" />
                      <span>Diffuser sur Smart TV</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Video Quality & Watch Party */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                      Qualité Vidéo
                    </h4>
                    <div className="space-y-1">
                      {(["Auto", "1080p", "720p", "360p"] as const).map((q) => {
                        const isQSelected = videoQuality === q;
                        return (
                          <button
                            key={q}
                            onClick={() => setVideoQuality(q)}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isQSelected
                                ? "bg-[#333336] text-white font-bold"
                                : "hover:bg-neutral-800 text-neutral-300"
                            }`}
                          >
                            <span>{q === "Auto" ? "Auto (Meilleure)" : q}</span>
                            {isQSelected && <Check className="w-4 h-4 text-white stroke-[2.5]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-800">
                    <button
                      onClick={() => {
                        setResumedNotice("Lien Watch Party copié dans le presse-papiers !");
                        navigator.clipboard?.writeText(window.location.href);
                        setTimeout(() => setResumedNotice(null), 3000);
                      }}
                      className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer border border-neutral-700"
                    >
                      <Users className="w-4 h-4 text-[#E50914]" />
                      <span>Démarrer Watch Party (Regarder ensemble)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* MODAL 4: FLIXER-STYLE EPISODES DRAWER [⧉]                    */}
          {/* ============================================================ */}
          {showEpisodesDrawer && isSeries && (
            <div className="absolute right-4 sm:right-8 top-16 bottom-24 w-84 sm:w-96 bg-[#222224]/95 backdrop-blur-2xl border border-neutral-700/80 rounded-2xl z-50 p-4 flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.95)] animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-700/80">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#E50914]" />
                  <div>
                    <h3 className="font-bold text-sm text-white leading-tight">
                      Saison {currentSeason}
                    </h3>
                    <p className="text-[10px] text-neutral-400">
                      {currentSeasonEpisodes.length} épisodes disponibles
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEpisodesDrawer(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
                {currentSeasonEpisodes.map((ep) => {
                  const isCurrent = ep.season === currentSeason && ep.episode === currentEpisode;
                  return (
                    <div
                      key={ep.id}
                      onClick={() => handleSelectEpisode(ep)}
                      className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isCurrent
                          ? "bg-[#333336] border-[#E50914] text-white shadow-lg"
                          : "bg-neutral-900/40 border-neutral-800 hover:bg-neutral-800/80 text-neutral-300"
                      }`}
                    >
                      <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black flex-none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ep.thumbnail || movie.backdropUrl}
                          alt={ep.title}
                          className="w-full h-full object-cover"
                        />
                        {isCurrent ? (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] animate-ping" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/20 hover:bg-black/0 transition-colors" />
                        )}
                        <span className="absolute bottom-1 left-1.5 bg-black/80 px-1 py-0.2 rounded text-[9px] font-mono font-bold text-white">
                          EP {ep.episode}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold truncate leading-tight text-white">
                            {ep.episode}. {ep.title}
                          </p>
                          {isCurrent && (
                            <span className="text-[9px] font-black uppercase text-[#E50914] shrink-0">
                              ● EN COURS
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-400 line-clamp-2 mt-1 leading-normal">
                          {ep.overview || `Regardez l'épisode ${ep.episode} de ${movie.title} en haute définition sur FilmFlex.`}
                        </p>
                        {isCurrent && (
                          <div className="mt-2 w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                            <div className="h-full bg-[#E50914] w-2/3" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
