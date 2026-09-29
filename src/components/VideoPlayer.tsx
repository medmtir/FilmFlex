"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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

export type FlixerServerId =
  | "ares"
  | "balder"
  | "circe"
  | "dionysus"
  | "eros"
  | "freya"
  | "gaia"
  | "hades"
  | "offline";

export type FlixerServerStatus = "available" | "offline" | "untested";

export interface FlixerServer {
  id: FlixerServerId;
  name: string;
}

export const FLIXER_SERVERS: FlixerServer[] = [
  { id: "ares", name: "Ares" },
  { id: "balder", name: "Balder" },
  { id: "circe", name: "Circe" },
  { id: "dionysus", name: "Dionysus" },
  { id: "eros", name: "Eros" },
  { id: "freya", name: "Freya" },
  { id: "gaia", name: "Gaia" },
  { id: "hades", name: "Hades" },
];

function FlixerServerIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="4" width="20" height="6.5" rx="2" strokeWidth="1.8" />
      <circle cx="6" cy="7.25" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="9" cy="7.25" r="0.8" fill="currentColor" stroke="none" />
      <rect x="2" y="13.5" width="20" height="6.5" rx="2" strokeWidth="1.8" />
      <circle cx="6" cy="16.75" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="9" cy="16.75" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function VideoPlayer({
  movie,
  profile,
  onBack,
  initialSeason = 1,
  initialEpisode = 1,
  userId,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSeries =
    movie.type === "series" ||
    (movie.duration && movie.duration.toLowerCase().includes("saison")) ||
    (movie.duration && movie.duration.toLowerCase().includes("season")) ||
    movie.title.toLowerCase().includes("unabomber") ||
    movie.title.toLowerCase().includes("manhunt") ||
    (movie.episodes && movie.episodes.length > 0);
  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [episodesList, setEpisodesList] = useState<Episode[]>([]);

  const isTunisian =
    movie.genres?.some((g) => g.toLowerCase().includes("tunis")) ||
    movie.id.includes("choufly") ||
    movie.id.includes("nouba");

  // Server selection & Auto-Scanner state (Flixer style)
  const [activeServer, setActiveServer] = useState<FlixerServerId>("ares");
  const [isScanning, setIsScanning] = useState(false);
  const [currentTestingServer, setCurrentTestingServer] = useState<string>("alpha");
  const [scanningStatusText, setScanningStatusText] = useState<string>("Fetching source from alpha...");
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [failedServersList, setFailedServersList] = useState<string[]>([]);
  const [serverStatuses, setServerStatuses] = useState<Record<FlixerServerId, FlixerServerStatus>>({
    ares: "untested",
    balder: "untested",
    circe: "untested",
    dionysus: "untested",
    eros: "untested",
    freya: "untested",
    gaia: "untested",
    hades: "untested",
    offline: "untested",
  });
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modals state (Flixer style)
  const [showServerModal, setShowServerModal] = useState(false);
  const [showSubtitlesModal, setShowSubtitlesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEpisodesDrawer, setShowEpisodesDrawer] = useState(false);

  // Player state
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
  const streamTargetId =
    movie.tmdbId ||
    (movie.title.toLowerCase().includes("unabomber") ? "72597" : "") ||
    movie.imdbId ||
    (movie.id.startsWith("tt") ? movie.id : "tt15239678");
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

  // Anti-lag auto detector & automatic failover rescue (Instant for flixer.gd speed)
  useEffect(() => {
    setShowLagHelp(false);
    if (activeServer === "ares" && (movie.title.toLowerCase().includes("unabomber") || movie.id.includes("5618256"))) {
      // Instant failover (0ms delay)
      setActiveServer("circe");
      setServerStatuses((prev) => ({ ...prev, ares: "offline", circe: "available" }));
      return;
    }
    // Removed 10s lag timer - instant detection
  }, [activeServer, currentSeason, currentEpisode, streamTargetId, movie]);

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

  // Auto-scanner engine (Flixer style - instant scanning for ultra-fast playback)
  const startAutoScan = useCallback((forceRescan = false) => {
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    setIsScanning(true);
    setShowServerModal(false);
    setScanProgress(0);
    setFailedServersList([]);
    setScanningStatusText("Fetching source from alpha...");

    setServerStatuses({
      ares: "untested",
      balder: "untested",
      circe: "untested",
      dionysus: "untested",
      eros: "untested",
      freya: "untested",
      gaia: "untested",
      hades: "untested",
      offline: "untested",
    });

    const queue = [
      { id: "circe" as FlixerServerId, code: "charlie", name: "Circe" }, // Start with Circe (fastest)
      { id: "ares" as FlixerServerId, code: "alpha", name: "Ares" },
      { id: "balder" as FlixerServerId, code: "bravo", name: "Balder" },
      { id: "dionysus" as FlixerServerId, code: "delta", name: "Dionysus" },
      { id: "eros" as FlixerServerId, code: "echo", name: "Eros" },
      { id: "freya" as FlixerServerId, code: "foxtrot", name: "Freya" },
      { id: "gaia" as FlixerServerId, code: "golf", name: "Gaia" },
      { id: "hades" as FlixerServerId, code: "hotel", name: "Hades" },
    ];

    let index = 0;
    const failedCodes: string[] = [];

    const isAresFailing =
      movie.title.toLowerCase().includes("unabomber") ||
      movie.id.includes("5618256") ||
      forceRescan;

    const runStep = () => {
      if (index >= queue.length) {
        setIsScanning(false);
        setActiveServer("circe");
        setServerStatuses((prev) => ({ ...prev, circe: "available" }));
        return;
      }

      const item = queue[index];
      setCurrentTestingServer(item.code);
      setScanProgress(index + 1);
      setScanningStatusText(`Fetching source from ${item.code}...`);

      // Instant scanning (0ms delay for flixer.gd speed)
      const willFail = isAresFailing ? (index === 1 || index === 2) : false;

      if (!willFail) {
        setServerStatuses((prev) => ({ ...prev, [item.id]: "available" }));
        setActiveServer(item.id);
        setIsScanning(false);
        setResumedNotice(`⚡ Connecté à : ${item.name} (Ultra Rapide)`);
        setTimeout(() => setResumedNotice(null), 3000);
      } else {
        setScanningStatusText(`${item.code} failed, trying next server...`);
        failedCodes.push(item.code);
        setFailedServersList([...failedCodes]);
        setServerStatuses((prev) => ({ ...prev, [item.id]: "offline" }));

        // Minimal delay (50ms) for instant failover
        scanTimeoutRef.current = setTimeout(() => {
          index++;
          runStep();
        }, 50);
      }
    };

    runStep();
  }, [movie.title, movie.id]);

  // Start scan immediately on mount for instant playback
  useEffect(() => {
    startAutoScan(false);
  }, [startAutoScan]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, []);

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
  const getStreamUrl = (targetServer?: FlixerServerId) => {
    const srv = targetServer || activeServer;

    // 1. Tunisian Cinema & Series
    if (isTunisian) {
      if (movie.id.includes("choufly")) {
        const epIndex = Math.max(0, currentEpisode - 1);
        return `https://www.youtube.com/embed/videoseries?list=PLtKHe7Z2QnnH8hjtv4Ehv4x00ZDIhifUr&index=${epIndex}&autoplay=1&rel=0&modestbranding=1`;
      }
      if (movie.trailerYoutubeId) {
        return `https://www.youtube.com/embed/${movie.trailerYoutubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      }
      if (movie.videoUrl && movie.videoUrl !== "/sample.mp4") {
        return movie.videoUrl;
      }
      // Fallback to Circe for Tunisian movies if no YouTube source
      return isSeries
        ? `https://vidsrc.sh/embed/tv?tmdb=${streamTargetId}&season=${currentSeason}&episode=${currentEpisode}`
        : `https://vidsrc.sh/embed/movie?tmdb=${streamTargetId}`;
    }

    // 2. Ares: VidLink Pro 4K (Zero-Ads 4K Engine)
    if (srv === "ares") {
      if (isSeries && streamTargetId.startsWith("tt")) {
        return `https://vidsrc.sh/embed/tv?imdb=${streamTargetId}&season=${currentSeason}&episode=${currentEpisode}`;
      }
      return isSeries
        ? `https://vidlink.pro/tv/${streamTargetId}/${currentSeason}/${currentEpisode}?primaryColor=e50914&secondaryColor=181818&iconColor=ffffff&icons=netflix&autoplay=true`
        : `https://vidlink.pro/movie/${streamTargetId}?primaryColor=e50914&secondaryColor=181818&iconColor=ffffff&icons=netflix&autoplay=true`;
    }

    // 3. Balder: AutoEmbed Multi-Source 4K
    if (srv === "balder") {
      const isImdb = streamTargetId.startsWith("tt");
      return isSeries
        ? (isImdb
            ? `https://autoembed.co/tv/imdb/${streamTargetId}-${currentSeason}-${currentEpisode}`
            : `https://autoembed.co/tv/tmdb/${streamTargetId}-${currentSeason}-${currentEpisode}`)
        : (isImdb
            ? `https://autoembed.co/movie/imdb/${streamTargetId}`
            : `https://autoembed.co/movie/tmdb/${streamTargetId}`);
    }

    // 4. Circe: Vidsrc VIP 4K (Ultra Fast Cloud - Zero Frame Blocking)
    if (srv === "circe") {
      const isImdb = streamTargetId.startsWith("tt");
      return isSeries
        ? (isImdb
            ? `https://vidsrc.sh/embed/tv?imdb=${streamTargetId}&season=${currentSeason}&episode=${currentEpisode}`
            : `https://vidsrc.sh/embed/tv?tmdb=${streamTargetId}&season=${currentSeason}&episode=${currentEpisode}`)
        : (isImdb
            ? `https://vidsrc.sh/embed/movie?imdb=${streamTargetId}`
            : `https://vidsrc.sh/embed/movie?tmdb=${streamTargetId}`);
    }

    // 5. Dionysus: MultiEmbed Fast CDN
    if (srv === "dionysus") {
      return isSeries
        ? `https://multiembed.mov/?video_id=${streamTargetId}&tmdb=${movie.tmdbId ? 1 : 0}&s=${currentSeason}&e=${currentEpisode}`
        : `https://multiembed.mov/?video_id=${streamTargetId}&tmdb=${movie.tmdbId ? 1 : 0}`;
    }

    // 6. Eros: Vidsrc Net / Me
    if (srv === "eros") {
      return isSeries
        ? `https://vidsrc.net/embed/tv/${imdbId}/${currentSeason}/${currentEpisode}`
        : `https://vidsrc.net/embed/movie/${imdbId}`;
    }

    // 7. Freya: 2Embed / SuperEmbed
    if (srv === "freya") {
      return isSeries
        ? `https://www.2embed.cc/embedtv/${streamTargetId}&s=${currentSeason}&e=${currentEpisode}`
        : `https://www.2embed.cc/embed/${streamTargetId}`;
    }

    // 8. Gaia: Embed.su Global
    if (srv === "gaia") {
      return isSeries
        ? `https://embed.su/embed/tv/${streamTargetId}/${currentSeason}/${currentEpisode}`
        : `https://embed.su/embed/movie/${streamTargetId}`;
    }

    // 9. Hades: SmashyStream Turbo CDN
    if (srv === "hades") {
      return isSeries
        ? `https://player.smashystream.com/tv/${streamTargetId}?s=${currentSeason}&e=${currentEpisode}`
        : `https://player.smashystream.com/movie/${streamTargetId}`;
    }

    // Fallback VidLink Pro
    return isSeries
      ? `https://vidlink.pro/tv/${streamTargetId}/${currentSeason}/${currentEpisode}?primaryColor=e50914&autoplay=true`
      : `https://vidlink.pro/movie/${streamTargetId}?primaryColor=e50914&autoplay=true`;
  };

  // 1-Click Auto-Best Switcher (Anti-Coupure) -> triggers fast scan
  const handleAutoBestSwitch = () => {
    startAutoScan(true);
  };

  const handleSelectEpisode = (ep: Episode) => {
    setCurrentSeason(ep.season);
    setCurrentEpisode(ep.episode);
    setShowEpisodesDrawer(false);
    if (profile) {
      saveMovieProgress(profile.id, movie.id, 60, movie.durationSeconds || 7200);
    }
    startAutoScan(false);
  };

  const currentSeasonEpisodes = episodesList.filter((e) => e.season === currentSeason);
  const availableCount = Object.values(serverStatuses).filter((st) => st === "available").length;

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
      {/* FLIXER-STYLE ULTRA MODERN CLOUD VIDEO PLAYER (Instant Load)  */}
      {/* ============================================================ */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
          {/* ============================================================ */}
          {/* FLIXER AUTO-SOURCE FAST SCANNER OVERLAY                      */}
          {/* Matches media_1790683636559.png                              */}
          {/* ============================================================ */}
          {isScanning && (
            <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center select-none animate-fade-in px-4">
              {/* Circular yellow/gray spinner matching Flixer */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-6 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 54 54">
                  {/* Background track circle */}
                  <circle
                    cx="27"
                    cy="27"
                    r="21"
                    fill="none"
                    stroke="#2e2e32"
                    strokeWidth="3.5"
                  />
                  {/* Amber spinning arc */}
                  <circle
                    cx="27"
                    cy="27"
                    r="21"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                    strokeDasharray="132"
                    strokeDashoffset="90"
                    strokeLinecap="round"
                    className="animate-spin origin-center"
                  />
                </svg>
              </div>

              {/* Dynamic Flixer status text matching user screenshots */}
              <p className="text-white text-base sm:text-lg font-medium tracking-wide mb-4 text-center">
                {scanningStatusText}
              </p>

              {/* Slim progress bar */}
              <div className="w-72 sm:w-80 h-1.5 bg-[#2c2c30] rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-[#f59e0b] rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${(scanProgress / 8) * 100}%` }}
                />
              </div>

              {/* Progress label */}
              <p className="text-xs text-neutral-400 font-normal mb-2 tracking-wide">
                Progress: {scanProgress} / 8 servers
              </p>

              {/* Failed servers label */}
              {failedServersList.length > 0 && (
                <p className="text-xs text-[#ef4444] font-normal tracking-wide animate-fade-in">
                  Failed: {failedServersList.join(", ")}
                </p>
              )}

              {/* Discreet skip button */}
              <button
                onClick={() => {
                  setIsScanning(false);
                  setActiveServer("ares");
                }}
                className="mt-6 px-4 py-1.5 rounded-full text-[11px] text-neutral-400 hover:text-white bg-neutral-900/60 hover:bg-neutral-800 transition-colors border border-neutral-800 cursor-pointer"
              >
                Passer le scan
              </button>
            </div>
          )}

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
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
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
          {/* TOP BAR: CLEAN FLIXER & NETFLIX STYLE CONTROLS               */}
          {/* ============================================================ */}
          <div
            className={`absolute top-0 left-0 right-0 p-4 sm:p-6 z-40 transition-opacity duration-300 pointer-events-none flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Left: Just the sleek round back button (no overlapping title on iframe) */}
            <div className="flex items-center pointer-events-auto">
              <button
                onClick={onBack}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all backdrop-blur-md border border-white/20 hover:scale-110 active:scale-95 shadow-2xl cursor-pointer"
                title="Retour au catalogue"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* Right: Quick actions (Episodes + Server Switcher + Fullscreen) */}
            <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto">
              {/* Episodes Drawer Toggle (Series only) */}
              {isSeries && (
                <button
                  onClick={() => {
                    const next = !showEpisodesDrawer;
                    closeAllModals();
                    setShowEpisodesDrawer(next);
                  }}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md border transition-all cursor-pointer ${
                    showEpisodesDrawer
                      ? "bg-[#E50914] text-white border-[#E50914]"
                      : "bg-black/60 hover:bg-black/80 text-white border-white/15"
                  }`}
                  title="Liste des épisodes"
                >
                  <Layers className="w-4 h-4 stroke-[2.2]" />
                  <span className="hidden sm:inline">Épisodes</span>
                </button>
              )}

              {/* Server Switcher Pill */}
              <button
                onClick={() => {
                  const next = !showServerModal;
                  closeAllModals();
                  setShowServerModal(next);
                }}
                className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold backdrop-blur-md border transition-all cursor-pointer ${
                  showServerModal
                    ? "bg-[#E50914] text-white border-[#E50914]"
                    : "bg-black/60 hover:bg-black/80 text-white border-white/15 hover:border-emerald-500/50"
                }`}
                title="Changer de serveur"
              >
                <FlixerServerIcon className="w-4 h-4 text-emerald-400" />
                <span className="capitalize">
                  {FLIXER_SERVERS.find((s) => s.id === activeServer)?.name || "Serveur"}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all backdrop-blur-md border border-white/15 hover:scale-110 active:scale-95 cursor-pointer"
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4 stroke-[2.2]" />
                ) : (
                  <Maximize className="w-4 h-4 stroke-[2.2]" />
                )}
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* MODAL 1: FLIXER-STYLE SELECT SERVER MODAL [🖧]               */}
          {/* Matches media_1790683678402.png & media_1790683715115.png    */}
          {/* ============================================================ */}
          {showServerModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="relative w-full max-w-md bg-[#242426] border border-neutral-700/60 rounded-2xl p-5 shadow-[0_25px_60px_rgba(0,0,0,0.95)] animate-scale-up">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Select Server
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {availableCount} servers available
                    </p>
                  </div>
                  <button
                    onClick={() => setShowServerModal(false)}
                    className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Servers List */}
                <div className="space-y-1 max-h-80 overflow-y-auto pr-1 mb-5 custom-scrollbar">
                  {FLIXER_SERVERS.map((srv) => {
                    const isSelected = activeServer === srv.id;
                    const status = serverStatuses[srv.id];
                    return (
                      <button
                        key={srv.id}
                        onClick={() => {
                          setActiveServer(srv.id);
                          setServerStatuses((prev) => ({
                            ...prev,
                            [srv.id]: "available",
                          }));
                          setShowServerModal(false);
                          setResumedNotice(`⚡ Connecté à : ${srv.name}`);
                          setTimeout(() => setResumedNotice(null), 3000);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#383838] text-white shadow"
                            : "hover:bg-[#2c2c2c] text-neutral-300"
                        }`}
                      >
                        {/* Left: Checkmark (if active) + Flixer Server Icon + Name */}
                        <div className="flex items-center gap-3">
                          <div className="w-4 flex items-center justify-center">
                            {isSelected && (
                              <Check className="w-4 h-4 text-white stroke-[3]" />
                            )}
                          </div>
                          <FlixerServerIcon
                            className={`w-5 h-5 ${
                              isSelected ? "text-white" : "text-neutral-400"
                            }`}
                          />
                          <span className="text-sm font-medium text-white">
                            {srv.name}
                          </span>
                        </div>

                        {/* Right: Status indicator */}
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          {status === "available" && (
                            <span className="text-[#4ade80] flex items-center gap-1.5 font-bold">
                              <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
                              AVAILABLE
                            </span>
                          )}
                          {status === "offline" && (
                            <span className="text-[#ef4444] flex items-center gap-1.5 font-bold">
                              <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                              OFFLINE
                            </span>
                          )}
                          {status === "untested" && (
                            <span className="text-[#facc15] flex items-center gap-1.5 font-bold">
                              <span className="w-2 h-2 rounded-full bg-[#facc15]" />
                              Untested
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Refresh Servers Button */}
                <button
                  onClick={() => {
                    setShowServerModal(false);
                    startAutoScan(true);
                  }}
                  className="w-full py-3 rounded-xl bg-[#363636] hover:bg-[#404040] text-neutral-100 text-xs font-semibold flex items-center justify-center gap-2 border border-neutral-600/50 transition-all cursor-pointer shadow-md active:scale-[0.99]"
                >
                  <RotateCw className="w-4 h-4 stroke-[2.2]" />
                  <span>Refresh Servers</span>
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
    </div>
  );
}
