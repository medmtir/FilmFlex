"use client";

import React, { useState, useRef, useEffect } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  Gauge,
  MessageSquare,
  Sliders,
  PictureInPicture2,
  Cast,
  ListVideo,
  ChevronRight,
  Check,
  FastForward,
  Loader2,
  X,
  Settings2,
  RotateCw,
  ExternalLink,
  Tv,
} from "lucide-react";
import { Movie, Profile, Episode } from "@/types";
import { saveMovieProgress, getMovieResumeTime } from "@/lib/storage";

interface QualityOption {
  key: string;
  label: string;
}

interface VideoPlayerProps {
  movie: Movie;
  profile: Profile;
  onBack: () => void;
  initialSeason?: number;
  initialEpisode?: number;
}

export default function VideoPlayer({
  movie,
  profile,
  onBack,
  initialSeason = 1,
  initialEpisode = 1,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Intro states: filmflex.mp4
  const [isPlayingIntro, setIsPlayingIntro] = useState(true);

  // Series Season & Episode
  const isSeries =
    movie.type === "series" ||
    movie.duration.toLowerCase().includes("season") ||
    movie.duration.toLowerCase().includes("série");
  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [episodesList, setEpisodesList] = useState<Episode[]>([]);
  const [showEpisodesDrawer, setShowEpisodesDrawer] = useState(false);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(movie.durationSeconds || 100);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [resumedNotice, setResumedNotice] = useState<string | null>(null);
  const [castNotice, setCastNotice] = useState<string | null>(null);

  // Streaming Engine & Server Mode ("native" HTML5/Stremio vs "cloud" Web Stream)
  const [playerMode, setPlayerMode] = useState<"native" | "cloud">("native");
  const [cloudServer, setCloudServer] = useState<"vidlink" | "vidsrc" | "embedsu">("vidlink");
  const [streamUrl, setStreamUrl] = useState<string>("");
  const [stremioAppUrl, setStremioAppUrl] = useState<string>("");

  // Quality & Subtitles
  const [selectedQuality, setSelectedQuality] = useState<string>("auto");
  const [qualityMap, setQualityMap] = useState<Record<string, string>>({});
  const [availableQualities, setAvailableQualities] = useState<QualityOption[]>([
    { key: "auto", label: "Auto (S'adapte à la connexion)" },
    { key: "1080p", label: "1080p Full HD (Fluide)" },
    { key: "720p", label: "720p HD (Rapide)" },
    { key: "480p", label: "480p SD (Faible débit)" },
  ]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>("sub_ar"); // Default Arabic
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [aspectMode] = useState<"contain" | "cover">("contain");
  const [activeMenu, setActiveMenu] = useState<"quality" | "subtitles" | "audio" | "speed" | "server" | null>(null);
  const [nextCountdown, setNextCountdown] = useState<number | null>(null);
  const [isLandscapeMode, setIsLandscapeMode] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nativeWatchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const imdbId = movie.imdbId || (movie.id.startsWith("tt") ? movie.id : "tt15239678");

  // Cloud Stream URL Builder
  const getCloudStreamUrl = (server = cloudServer) => {
    if (server === "vidlink") {
      return isSeries
        ? `https://vidlink.pro/tv/${imdbId}/${currentSeason}/${currentEpisode}`
        : `https://vidlink.pro/movie/${imdbId}`;
    }
    if (server === "vidsrc") {
      return isSeries
        ? `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=${currentSeason}&episode=${currentEpisode}`
        : `https://vidsrc.me/embed/movie?imdb=${imdbId}`;
    }
    return isSeries
      ? `https://embed.su/embed/tv/${imdbId}/${currentSeason}/${currentEpisode}`
      : `https://embed.su/embed/movie/${imdbId}`;
  };

  // Mobile orientation handling
  useEffect(() => {
    const handleOrientation = () => {
      if (typeof window !== "undefined" && window.innerWidth > window.innerHeight) {
        setIsLandscapeMode(false);
      }
    };

    try {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orient = screen.orientation as any;
        if (orient && typeof orient.lock === "function") {
          orient.lock("landscape").catch(() => {});
        }
      }
    } catch {}

    window.addEventListener("resize", handleOrientation);
    window.addEventListener("orientationchange", handleOrientation);

    return () => {
      window.removeEventListener("resize", handleOrientation);
      window.removeEventListener("orientationchange", handleOrientation);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orient = screen.orientation as any;
        if (orient && typeof orient.unlock === "function") {
          orient.unlock();
        }
      } catch {}
    };
  }, []);

  // Mobile-only toggle rotate
  const toggleRotate = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orient = (screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation) as any;
      if (orient && typeof orient.lock === "function") {
        if (!isLandscapeMode) {
          orient.lock("landscape").then(() => {}).catch(() => {
            setIsLandscapeMode(true);
          });
          return;
        } else {
          if (typeof orient.unlock === "function") orient.unlock();
          setIsLandscapeMode(false);
          return;
        }
      }
    } catch {}
    setIsLandscapeMode((prev) => !prev);
  };

  // Watchdog: If native HTML5 video stays loading or black for > 3.5s (e.g. on Vercel without Stremio), switch to Cloud Player
  useEffect(() => {
    if (isLoading && !isPlayingIntro && playerMode === "native") {
      if (nativeWatchdogTimerRef.current) clearTimeout(nativeWatchdogTimerRef.current);
      nativeWatchdogTimerRef.current = setTimeout(() => {
        console.info("Native stream timeout — seamlessly switching to Cloud HD Server");
        setPlayerMode("cloud");
        setIsLoading(false);
      }, 3500);
    } else {
      if (nativeWatchdogTimerRef.current) {
        clearTimeout(nativeWatchdogTimerRef.current);
        nativeWatchdogTimerRef.current = null;
      }
    }

    return () => {
      if (nativeWatchdogTimerRef.current) clearTimeout(nativeWatchdogTimerRef.current);
    };
  }, [isLoading, isPlayingIntro, playerMode]);

  // Prevent browser media exceptions from breaking UI
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = reason?.message || String(reason || "");
      const name = reason?.name || "";
      if (
        name === "NotSupportedError" ||
        name === "AbortError" ||
        msg.includes("no supported sources") ||
        msg.includes("interrupted by a call to pause") ||
        msg.includes("play() request was interrupted")
      ) {
        event.preventDefault();
        event.stopPropagation();
        setPlayerMode("cloud");
        setIsLoading(false);
      }
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  // 1. Fetch live stream and qualities
  useEffect(() => {
    setIsLoading(true);
    const search = new URLSearchParams();
    if (isSeries) {
      search.set("season", currentSeason.toString());
      search.set("episode", currentEpisode.toString());
    }
    search.set("quality", selectedQuality);
    const url = `/api/stream/${imdbId}?${search.toString()}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.streamUrl) {
          setStreamUrl(data.streamUrl);
        }
        if (data.qualityMap) {
          setQualityMap(data.qualityMap);
        }
        if (data.stremioAppUrl) {
          setStremioAppUrl(data.stremioAppUrl);
        }
        if (data.availableQualities && data.availableQualities.length > 0) {
          setAvailableQualities(data.availableQualities);
        }
      })
      .catch((err) => {
        console.error("Stream resolution error:", err);
        setPlayerMode("cloud");
      });
  }, [imdbId, isSeries, currentSeason, currentEpisode, selectedQuality]);

  // 1b. HLS / Video Stream Lifecycle Handler
  useEffect(() => {
    if (!videoRef.current || !streamUrl || playerMode !== "native") return;

    const isHls = streamUrl.includes(".m3u8") || streamUrl.includes("/api/hls");

    if (isHls) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
          maxBufferLength: 30,
        });
        hlsRef.current = hls;

        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          if (!isPlayingIntro && videoRef.current) {
            const resumeTime = getMovieResumeTime(profile.id, movie.id);
            if (resumeTime > 0) {
              try {
                videoRef.current.currentTime = resumeTime;
              } catch {}
            }
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        });

        hls.on(Hls.Events.ERROR, (_, errData) => {
          if (errData.fatal) {
            console.warn("HLS fatal error:", errData.type);
            setPlayerMode("cloud");
          }
        });
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = streamUrl;
      }
    } else {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      videoRef.current.src = streamUrl;
    }
  }, [streamUrl, isPlayingIntro, movie.id, profile.id, playerMode]);

  // 2. Fetch full episodes list if it's a TV series
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

  // 3. Play FilmFlex Intro Video automatically
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
    const resumeTime = getMovieResumeTime(profile.id, movie.id);
    setTimeout(() => {
      if (videoRef.current && playerMode === "native") {
        if (resumeTime > 0) {
          try {
            videoRef.current.currentTime = resumeTime;
            const mins = Math.floor(resumeTime / 60);
            setResumedNotice(`Reprise automatique à ${mins} min`);
            setTimeout(() => setResumedNotice(null), 4000);
          } catch {}
        }
        const p = videoRef.current.play();
        if (p !== undefined) {
          p.then(() => setIsPlaying(true)).catch((e) => {
            console.warn("Autoplay after intro catch:", e);
          });
        }
      }
    }, 200);
  };

  // 4. Controls auto-hide
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !activeMenu && !showEpisodesDrawer) {
        setShowControls(false);
      }
    }, 3500);
  };

  // 5. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "arrowleft":
        case "j":
          e.preventDefault();
          handleSeekDelta(-10);
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          handleSeekDelta(10);
          break;
        case "arrowup":
          e.preventDefault();
          if (videoRef.current) {
            const nextVol = Math.min(1, volume + 0.1);
            setVolume(nextVol);
            videoRef.current.volume = nextVol;
            setIsMuted(false);
          }
          break;
        case "arrowdown":
          e.preventDefault();
          if (videoRef.current) {
            const nextVol = Math.max(0, volume - 0.1);
            setVolume(nextVol);
            videoRef.current.volume = nextVol;
            setIsMuted(nextVol === 0);
          }
          break;
        case "escape":
          if (activeMenu) {
            setActiveMenu(null);
          } else if (showEpisodesDrawer) {
            setShowEpisodesDrawer(false);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, volume, isMuted, activeMenu, showEpisodesDrawer]);

  // 6. Native Video Event Handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || duration;
    setCurrentTime(cur);
    if (dur && !isNaN(dur)) setDuration(dur);

    // Save progress periodically
    if (Math.floor(cur) % 5 === 0 && dur > 0) {
      saveMovieProgress(profile.id, movie.id, cur, dur);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleSeekDelta = (delta: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

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

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn("PiP error", e);
    }
  };

  // 7. Cast / Share Screen to Smart TV (YouTube / Google Cast style)
  const handleCastToTV = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const remote = (videoRef.current as any)?.remote;
      if (remote && typeof remote.prompt === "function") {
        await remote.prompt();
        setCastNotice("Connexion à votre Smart TV / Chromecast...");
        setTimeout(() => setCastNotice(null), 4000);
        return;
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setCastNotice("Partage vers votre écran TV activé avec succès !");
        setTimeout(() => setCastNotice(null), 4000);
        return;
      }

      setCastNotice("Activez la fonction Cast ou AirPlay depuis votre navigateur.");
      setTimeout(() => setCastNotice(null), 4500);
    } catch (err) {
      console.warn("Cast cancelled or not available", err);
    }
  };

  // 8. Quality Change Handler
  const handleSelectQuality = (qKey: string) => {
    setSelectedQuality(qKey);
    setActiveMenu(null);

    const targetUrl = qualityMap[qKey];
    if (targetUrl) {
      setIsLoading(true);
      setStreamUrl(targetUrl);
    }
  };

  // 8b. Subtitle Selection Handler
  const handleSelectSubtitle = (subId: string) => {
    setSelectedSubtitle(subId);
    setActiveMenu(null);
    if (videoRef.current && videoRef.current.textTracks) {
      for (let i = 0; i < videoRef.current.textTracks.length; i++) {
        const track = videoRef.current.textTracks[i];
        if (subId === "off") {
          track.mode = "disabled";
        } else if (subId === "sub_ar" && track.language === "ar") {
          track.mode = "showing";
        } else if (subId === "sub_fr" && track.language === "fr") {
          track.mode = "showing";
        } else if (subId === "sub_en" && track.language === "en") {
          track.mode = "showing";
        } else {
          track.mode = "disabled";
        }
      }
    }
  };

  // 9. Next Episode Handlers
  const handleNextEpisode = () => {
    setNextCountdown(null);
    const nextEp = currentEpisode + 1;
    setCurrentEpisode(nextEp);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleSelectEpisode = (ep: Episode) => {
    setCurrentSeason(ep.season);
    setCurrentEpisode(ep.episode);
    setShowEpisodesDrawer(false);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(s)}`;
    return `${pad(mins)}:${pad(s)}`;
  };

  const remainingTime = duration > currentTime ? duration - currentTime : 0;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const currentSeasonEpisodes = episodesList.filter((e) => e.season === currentSeason);

  // Subtitle API parameters
  const subParams = `imdbId=${imdbId}${isSeries ? `&season=${currentSeason}&episode=${currentEpisode}` : ""}`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden text-white font-sans transition-all duration-300 ${
        isLandscapeMode
          ? "rotate-90 origin-top-left !w-[100dvh] !h-[100dvw] translate-x-[100dvw] md:rotate-0 md:!w-full md:!h-full md:translate-x-0"
          : "w-full h-full"
      }`}
    >
      {/* ============================================================ */}
      {/* 1. ACTUAL FILMLEX.MP4 INTRO - 100% FULLSCREEN COVER           */}
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
            className="absolute bottom-8 right-8 z-30 px-6 py-2.5 rounded-full border border-white/20 bg-black/70 hover:bg-neutral-900 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-2xl hover:scale-105 flex items-center gap-2 backdrop-blur-md"
          >
            <span>Passer l&apos;intro</span>
            <FastForward className="w-4 h-4 text-[#E50914]" />
          </button>
        </div>
      ) : (
        /* ============================================================ */
        /* 2. PLAYER VIEWPORT (NATIVE HTML5 OR CLOUD EMBED)             */
        /* ============================================================ */
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {playerMode === "cloud" ? (
            /* Cloud Web Player (Zero buffer, works everywhere on Vercel) */
            <div className="relative w-full h-full bg-black">
              <iframe
                src={getCloudStreamUrl()}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="origin"
              />
            </div>
          ) : (
            /* Native HTML5 Video Element with Full Subtitles */
            <video
              ref={videoRef}
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              onWaiting={() => setIsLoading(true)}
              onPlaying={() => {
                setIsLoading(false);
                setIsPlaying(true);
              }}
              onCanPlay={() => setIsLoading(false)}
              onLoadedData={() => setIsLoading(false)}
              onError={() => {
                console.warn("Native player error — switching to Cloud Stream");
                setPlayerMode("cloud");
                setIsLoading(false);
              }}
              onEnded={() => {
                if (isSeries) {
                  setNextCountdown(5);
                  const timer = setInterval(() => {
                    setNextCountdown((prev) => {
                      if (prev === 1) {
                        clearInterval(timer);
                        handleNextEpisode();
                        return null;
                      }
                      return prev ? prev - 1 : null;
                    });
                  }, 1000);
                } else {
                  saveMovieProgress(profile.id, movie.id, duration, duration);
                  onBack();
                }
              }}
              className={`w-full h-full cursor-pointer transition-all duration-300 ${
                aspectMode === "cover" ? "object-cover" : "object-contain"
              }`}
              preload="auto"
              playsInline
              crossOrigin="anonymous"
            >
              {/* Real OpenSubtitles tracks via FilmFlex Subtitle Proxy */}
              <track
                label="العربية (Arabic)"
                kind="subtitles"
                srcLang="ar"
                src={`/api/subtitles?${subParams}&lang=ara`}
                default={selectedSubtitle === "sub_ar"}
              />
              <track
                label="Français (French)"
                kind="subtitles"
                srcLang="fr"
                src={`/api/subtitles?${subParams}&lang=fre`}
                default={selectedSubtitle === "sub_fr"}
              />
              <track
                label="English [CC]"
                kind="subtitles"
                srcLang="en"
                src={`/api/subtitles?${subParams}&lang=eng`}
                default={selectedSubtitle === "sub_en"}
              />
            </video>
          )}

          {/* FilmFlex Loading Spinner */}
          {isLoading && playerMode === "native" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 max-w-sm mx-4 text-center">
                <div className="relative flex items-center justify-center">
                  <Loader2 className="w-14 h-14 text-[#E50914] animate-spin opacity-95" />
                  <div className="absolute text-[10px] text-white font-black tracking-widest">
                    FILMFLEX
                  </div>
                </div>
                <span className="text-xs text-neutral-300 font-mono tracking-wide">
                  Chargement {selectedQuality === "auto" ? "1080p HD" : selectedQuality.toUpperCase()}...
                </span>
                <button
                  onClick={() => {
                    setPlayerMode("cloud");
                    setIsLoading(false);
                  }}
                  className="px-4 py-1.5 mt-1 bg-[#E50914] hover:bg-[#b81d24] text-white text-xs font-bold rounded-full shadow-lg pointer-events-auto transition-transform hover:scale-105"
                >
                  Passer au Serveur Cloud HD ⚡
                </button>
              </div>
            </div>
          )}

          {/* Auto Next Episode Countdown Overlay (Netflix Style) */}
          {nextCountdown !== null && isSeries && (
            <div className="absolute bottom-24 right-8 z-40 bg-neutral-900/95 border border-neutral-700 p-4 rounded-xl shadow-2xl animate-scale-up flex flex-col gap-3 max-w-sm">
              <div className="text-xs text-neutral-400 uppercase font-semibold">
                Épisode suivant dans
              </div>
              <div className="text-2xl font-black text-white">
                Épisode {currentEpisode + 1} ({nextCountdown}s)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setNextCountdown(null)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs rounded text-neutral-300"
                >
                  Annuler
                </button>
                <button
                  onClick={handleNextEpisode}
                  className="px-4 py-1.5 bg-[#E50914] hover:bg-[#b81d24] text-xs font-bold rounded text-white flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-white" />
                  Lancer maintenant
                </button>
              </div>
            </div>
          )}

          {/* Next Episode Floating Arrow (Right Screen) */}
          {isSeries && showControls && (
            <button
              onClick={handleNextEpisode}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-16 rounded-l-full bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-all backdrop-blur-sm shadow-xl"
              title="Épisode Suivant"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Resumed Notification Badge */}
          {resumedNotice && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/85 border border-[#E50914]/40 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl animate-fade-in flex items-center gap-2 pointer-events-none z-30">
              <span className="w-2 h-2 rounded-full bg-[#E50914] animate-ping" />
              {resumedNotice}
            </div>
          )}

          {/* Cast Notification Badge */}
          {castNotice && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/90 border border-[#E50914]/50 text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-2xl animate-fade-in flex items-center gap-2 z-40">
              <Cast className="w-4 h-4 text-[#E50914]" />
              <span>{castNotice}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* TOP BAR: Clean, Minimal, Desktop-Optimized                   */}
          {/* ============================================================ */}
          <div
            className={`absolute top-0 left-0 right-0 p-3 sm:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-30 ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={onBack}
                className="text-neutral-300 hover:text-white transition-colors p-1"
                title="Retour"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <h2 className="text-xs sm:text-base font-semibold tracking-wide text-neutral-200 truncate max-w-[140px] sm:max-w-md">
                {movie.title}
                {isSeries && ` (${currentSeason}x${currentEpisode})`}
              </h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Server Switcher Pill */}
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === "server" ? null : "server")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                    playerMode === "cloud"
                      ? "bg-red-950/80 border-[#E50914] text-white shadow-[0_0_10px_rgba(229,9,20,0.5)]"
                      : "bg-neutral-900/90 border-neutral-700 text-neutral-300 hover:border-neutral-500"
                  }`}
                  title="Changer de serveur"
                >
                  <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
                  <span>{playerMode === "cloud" ? `Serveur Cloud (${cloudServer.toUpperCase()})` : "Stremio Local"}</span>
                </button>

                {activeMenu === "server" && (
                  <div className="absolute top-10 right-0 w-60 bg-[#181818]/95 backdrop-blur-md border border-neutral-800 rounded-xl p-2 shadow-2xl z-50 animate-scale-up space-y-1">
                    <div className="text-[11px] font-bold text-neutral-400 px-2 py-1 border-b border-neutral-800">
                      Sélection du Serveur
                    </div>
                    <button
                      onClick={() => {
                        setPlayerMode("cloud");
                        setCloudServer("vidlink");
                        setActiveMenu(null);
                      }}
                      className="w-full flex items-center justify-between text-xs py-2 px-2 rounded hover:bg-neutral-800 text-left text-neutral-300"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">Serveur Cloud 1 (VidLink HD)</span>
                        <span className="text-[10px] text-neutral-400">Recommandé Vercel / Web</span>
                      </div>
                      {playerMode === "cloud" && cloudServer === "vidlink" && (
                        <Check className="w-4 h-4 text-[#E50914]" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setPlayerMode("cloud");
                        setCloudServer("vidsrc");
                        setActiveMenu(null);
                      }}
                      className="w-full flex items-center justify-between text-xs py-2 px-2 rounded hover:bg-neutral-800 text-left text-neutral-300"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">Serveur Cloud 2 (VidSrc)</span>
                        <span className="text-[10px] text-neutral-400">Flux alternatif</span>
                      </div>
                      {playerMode === "cloud" && cloudServer === "vidsrc" && (
                        <Check className="w-4 h-4 text-[#E50914]" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setPlayerMode("native");
                        setIsLoading(true);
                        setActiveMenu(null);
                      }}
                      className="w-full flex items-center justify-between text-xs py-2 px-2 rounded hover:bg-neutral-800 text-left text-neutral-300"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">Serveur Stremio Local</span>
                        <span className="text-[10px] text-neutral-400">Pour PC avec Stremio actif</span>
                      </div>
                      {playerMode === "native" && <Check className="w-4 h-4 text-[#E50914]" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Open in Stremio App Deep Link if available */}
              {stremioAppUrl && (
                <a
                  href={stremioAppUrl}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs font-semibold transition-all hover:text-white"
                  title="Ouvrir dans l'application Stremio"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#E50914]" />
                  <span>App Stremio</span>
                </a>
              )}

              {/* Rotate Screen button: ONLY ON MOBILE (hidden on desktop md:hidden) */}
              <button
                onClick={toggleRotate}
                className="flex md:hidden items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-semibold transition-all"
                title="Tourner l'écran"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#E50914]" />
                <span>{isLandscapeMode ? "Portrait" : "Paysage"}</span>
              </button>

              <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-neutral-900/90 text-neutral-300 border border-neutral-700 text-[10px] sm:text-xs font-mono font-semibold uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>1080P HD</span>
              </span>

              <button
                onClick={toggleFullscreen}
                className="text-neutral-300 hover:text-white transition-colors p-1"
                title="Plein écran"
              >
                {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* BOTTOM CONTROLS BAR: Clean Netflix Red Theme                  */}
          {/* ============================================================ */}
          <div
            className={`absolute bottom-0 left-0 right-0 px-4 md:px-6 py-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col gap-2 transition-opacity duration-300 z-30 ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Scrubber Timeline Bar (Red) */}
            {playerMode === "native" && (
              <div className="flex items-center gap-3 w-full">
                <span className="text-[11px] font-mono text-neutral-400 w-14 text-right">
                  {formatTime(currentTime)}
                </span>

                {/* Glowing Netflix Red Progress Bar */}
                <div className="relative flex-1 group/slider flex items-center cursor-pointer">
                  <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#E50914] rounded-full shadow-[0_0_10px_rgba(229,9,20,0.8)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div
                    className="absolute w-3.5 h-3.5 bg-[#E50914] rounded-full shadow-[0_0_12px_rgba(229,9,20,1)] -translate-x-1/2 pointer-events-none transition-transform group-hover/slider:scale-125"
                    style={{ left: `${progressPercent}%` }}
                  />

                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>

                <span className="text-[11px] font-mono text-neutral-400 w-16">
                  -{formatTime(remainingTime)}
                </span>
              </div>
            )}

            {/* Bottom Controls Row */}
            <div className="flex items-center justify-between pt-1">
              {/* Left Controls: Play/Pause, Next Episode, Volume Slider */}
              <div className="flex items-center gap-4 md:gap-5">
                {playerMode === "native" && (
                  <button
                    onClick={togglePlay}
                    className="text-neutral-300 hover:text-white transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                  </button>
                )}

                {isSeries && (
                  <button
                    onClick={handleNextEpisode}
                    className="text-neutral-300 hover:text-white transition-colors"
                    title="Épisode Suivant"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                )}

                {/* Episodes Drawer Toggle Button */}
                {isSeries && (
                  <button
                    onClick={() => setShowEpisodesDrawer(!showEpisodesDrawer)}
                    className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-2.5 py-1 rounded bg-neutral-900 border border-neutral-700 hover:border-neutral-500 transition-colors"
                  >
                    <ListVideo className="w-4 h-4 text-[#E50914]" />
                    <span className="hidden sm:inline">Épisodes</span>
                  </button>
                )}

                {/* Volume & Mute */}
                {playerMode === "native" && (
                  <div className="flex items-center gap-2 group/vol">
                    <button
                      onClick={toggleMute}
                      className="text-neutral-300 hover:text-white transition-colors p-1"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-[#E50914]" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 md:w-24 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#E50914] hidden sm:block"
                    />
                  </div>
                )}
              </div>

              {/* Right Controls: Quality, Cast, Speed, Subtitles, PiP */}
              <div className="flex items-center gap-3 md:gap-4">
                {/* 1. Quality Selector */}
                {playerMode === "native" && (
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === "quality" ? null : "quality")}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border border-neutral-700 hover:border-neutral-500 transition-colors ${
                        activeMenu === "quality" ? "bg-red-950/60 text-red-400 border-red-600" : "text-neutral-300"
                      }`}
                      title="Qualité vidéo"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span className="uppercase text-[11px]">{selectedQuality}</span>
                    </button>

                    {activeMenu === "quality" && (
                      <div className="absolute bottom-12 right-0 w-64 bg-[#181818]/95 backdrop-blur-md border border-neutral-800 rounded-lg p-2 shadow-2xl z-50 animate-scale-up space-y-1">
                        <div className="text-[11px] font-bold text-neutral-400 px-2 py-1 border-b border-neutral-800">
                          Qualité du Flux Vidéo
                        </div>
                        {availableQualities.map((q) => (
                          <button
                            key={q.key}
                            onClick={() => handleSelectQuality(q.key)}
                            className="w-full flex items-center justify-between text-xs py-2 px-2 rounded hover:bg-neutral-800 text-left text-neutral-300"
                          >
                            <span>{q.label}</span>
                            {selectedQuality === q.key && (
                              <Check className="w-3.5 h-3.5 text-[#E50914]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Authentic YouTube / Google Cast Button */}
                <button
                  onClick={handleCastToTV}
                  className="text-neutral-300 hover:text-[#E50914] transition-colors p-1"
                  title="Diffuser sur Smart TV / Chromecast"
                >
                  <Cast className="w-5 h-5" />
                </button>

                {/* 3. Playback Speed */}
                {playerMode === "native" && (
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === "speed" ? null : "speed")}
                      className={`text-neutral-300 hover:text-white transition-colors p-1 ${
                        activeMenu === "speed" ? "text-[#E50914]" : ""
                      }`}
                      title="Vitesse de lecture"
                    >
                      <Gauge className="w-4 h-4" />
                    </button>

                    {activeMenu === "speed" && (
                      <div className="absolute bottom-12 right-0 w-36 bg-[#181818]/95 backdrop-blur-md border border-neutral-800 rounded-lg p-2 shadow-2xl z-50 animate-scale-up space-y-1">
                        <div className="text-[11px] font-bold text-neutral-400 px-2 py-1 border-b border-neutral-800">
                          Vitesse
                        </div>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                          <button
                            key={spd}
                            onClick={() => {
                              setPlaybackSpeed(spd);
                              if (videoRef.current) videoRef.current.playbackRate = spd;
                              setActiveMenu(null);
                            }}
                            className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-neutral-800 text-left text-neutral-300"
                          >
                            <span>{spd}x {spd === 1 && "(Normal)"}</span>
                            {playbackSpeed === spd && <Check className="w-3.5 h-3.5 text-[#E50914]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Real OpenSubtitles Selector */}
                {playerMode === "native" && (
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === "subtitles" ? null : "subtitles")}
                      className={`text-neutral-300 hover:text-white transition-colors p-1 ${
                        activeMenu === "subtitles" ? "text-[#E50914]" : ""
                      }`}
                      title="Sous-titres"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    {activeMenu === "subtitles" && (
                      <div className="absolute bottom-12 right-0 w-60 bg-[#181818]/95 backdrop-blur-md border border-neutral-800 rounded-lg p-2 shadow-2xl z-50 animate-scale-up space-y-1">
                        <div className="text-[11px] font-bold text-neutral-400 px-2 py-1 border-b border-neutral-800">
                          Sous-titres OpenSubtitles
                        </div>
                        <button
                          onClick={() => handleSelectSubtitle("off")}
                          className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-neutral-800 text-left text-neutral-300"
                        >
                          <span>Désactivé</span>
                          {selectedSubtitle === "off" && <Check className="w-3.5 h-3.5 text-[#E50914]" />}
                        </button>
                        <button
                          onClick={() => handleSelectSubtitle("sub_ar")}
                          className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-neutral-800 text-left text-neutral-300"
                        >
                          <span>العربية (Arabic)</span>
                          {selectedSubtitle === "sub_ar" && <Check className="w-3.5 h-3.5 text-[#E50914]" />}
                        </button>
                        <button
                          onClick={() => handleSelectSubtitle("sub_fr")}
                          className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-neutral-800 text-left text-neutral-300"
                        >
                          <span>Français (French)</span>
                          {selectedSubtitle === "sub_fr" && <Check className="w-3.5 h-3.5 text-[#E50914]" />}
                        </button>
                        <button
                          onClick={() => handleSelectSubtitle("sub_en")}
                          className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-neutral-800 text-left text-neutral-300"
                        >
                          <span>English [CC]</span>
                          {selectedSubtitle === "sub_en" && <Check className="w-3.5 h-3.5 text-[#E50914]" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Picture in Picture */}
                {playerMode === "native" && (
                  <button
                    onClick={togglePiP}
                    className="text-neutral-300 hover:text-white transition-colors p-1 hidden sm:block"
                    title="Picture in Picture"
                  >
                    <PictureInPicture2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SLIDE-OVER EPISODES DRAWER INSIDE THE PLAYER                 */}
          {/* ============================================================ */}
          {showEpisodesDrawer && isSeries && (
            <div className="absolute top-0 right-0 bottom-0 w-full sm:w-96 bg-[#141414]/95 backdrop-blur-xl border-l border-neutral-800 z-50 flex flex-col p-4 sm:p-6 animate-scale-up shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ListVideo className="w-5 h-5 text-[#E50914]" />
                  <span>Saison {currentSeason} • Épisodes</span>
                </h3>
                <button
                  onClick={() => setShowEpisodesDrawer(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1 no-scrollbar">
                {currentSeasonEpisodes.map((ep) => {
                  const isCurrent = ep.episode === currentEpisode && ep.season === currentSeason;
                  return (
                    <div
                      key={ep.id}
                      onClick={() => handleSelectEpisode(ep)}
                      className={`group flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${
                        isCurrent
                          ? "bg-[#E50914]/20 border-[#E50914]/60 shadow"
                          : "bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800"
                      }`}
                    >
                      <div className="relative w-24 aspect-video rounded overflow-hidden flex-none bg-neutral-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ep.thumbnail || movie.backdropUrl}
                          alt={ep.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 fill-white text-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs font-semibold text-white">
                          <span className="truncate">{ep.title}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {ep.episode < 10 ? `E0${ep.episode}` : `E${ep.episode}`}
                          </span>
                        </div>
                        {ep.overview && (
                          <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">
                            {ep.overview}
                          </p>
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
