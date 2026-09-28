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
  Tv,
  ListVideo,
  ChevronRight,
  Check,
  FastForward,
  Loader2,
  X,
  Settings2,
  Zap,
  RotateCw,
  Scaling,
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

  // Stream & Quality state
  const [streamUrl, setStreamUrl] = useState<string>("");
  const fallbackAttemptsRef = useRef<number>(0);
  const [stremioAppUrl, setStremioAppUrl] = useState<string>("");
  const [qualityMap, setQualityMap] = useState<Record<string, string>>({});
  const [selectedQuality, setSelectedQuality] = useState<string>("auto");
  const [availableQualities, setAvailableQualities] = useState<QualityOption[]>([
    { key: "auto", label: "Auto (S'adapte à la connexion)" },
    { key: "1080p", label: "1080p Full HD" },
    { key: "720p", label: "720p HD (Fluide & Économique)" },
    { key: "480p", label: "480p SD (Connexion faible)" },
    { key: "4k", label: "4K Ultra HD" },
  ]);

  // Mobile orientation & aspect-ratio states
  const [isLandscapeMode, setIsLandscapeMode] = useState<boolean>(false);
  const [aspectMode, setAspectMode] = useState<"contain" | "cover">("contain");

  // Menus
  const [activeMenu, setActiveMenu] = useState<"quality" | "speed" | "subtitles" | "audio" | null>(null);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>("sub_ar");
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Auto-next episode countdown state
  const [nextCountdown, setNextCountdown] = useState<number | null>(null);
  const [showFastSwitch, setShowFastSwitch] = useState<boolean>(false);
  const networkErrorsRef = useRef<number>(0);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imdbId = movie.imdbId || (movie.id.startsWith("tt") ? movie.id : "tt15239678");

  // Auto-request landscape on mobile mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orient = screen.orientation as any;
        if (orient && typeof orient.lock === "function") {
          orient.lock("landscape").then(() => setIsLandscapeMode(true)).catch(() => {});
        }
      }
    } catch {}

    return () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orient = screen.orientation as any;
        if (orient && typeof orient.unlock === "function") {
          orient.unlock();
        }
      } catch {}
    };
  }, []);

  // Mobile toggle rotate (Screen Orientation API + CSS transform fallback)
  const toggleRotate = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orient = (screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation) as any;
      if (orient && typeof orient.lock === "function") {
        if (!isLandscapeMode) {
          orient.lock("landscape").then(() => {
            setIsLandscapeMode(true);
          }).catch(() => {
            setIsLandscapeMode((prev) => !prev);
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

  // Reload or switch to alternative quality stream
  const handleFastSwitch = () => {
    setShowFastSwitch(false);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const nextStream = qualityMap["720p"] || qualityMap["1080p"] || Object.values(qualityMap)[0];
    if (nextStream && nextStream !== streamUrl) {
      setIsLoading(true);
      setStreamUrl(nextStream);
      if (videoRef.current) {
        videoRef.current.src = nextStream;
        videoRef.current.load();
        videoRef.current.play().catch(() => {});
      }
    } else if (videoRef.current) {
      setIsLoading(true);
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  // Watchdog timer: show reload option if buffering takes > 5s
  useEffect(() => {
    let warnTimer: NodeJS.Timeout;
    if (isLoading && !isPlayingIntro) {
      warnTimer = setTimeout(() => {
        setShowFastSwitch(true);
      }, 5000);
    } else {
      setShowFastSwitch(false);
    }

    return () => {
      clearTimeout(warnTimer);
    };
  }, [isLoading, isPlayingIntro]);

  // Prevent browser media exceptions from triggering Next.js runtime error overlay
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
        setIsLoading(false);
      }
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  // 1. Fetch live stream and qualities
  useEffect(() => {
    setIsLoading(true);
    fallbackAttemptsRef.current = 0;
    networkErrorsRef.current = 0;
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
      .catch((err) => console.error("Stream resolution error:", err));
  }, [imdbId, isSeries, currentSeason, currentEpisode, selectedQuality]);

  // 1b. HLS / Video Stream Lifecycle Handler
  useEffect(() => {
    if (!videoRef.current || !streamUrl) return;

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
          setShowFastSwitch(false);
          if (!isPlayingIntro && videoRef.current) {
            const resumeTime = getMovieResumeTime(profile.id, movie.id);
            if (resumeTime > 0) {
              try {
                videoRef.current.currentTime = resumeTime;
              } catch {}
            }
            const p = videoRef.current.play();
            if (p !== undefined) {
              p.then(() => setIsPlaying(true)).catch(() => {});
            }
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            networkErrorsRef.current += 1;
            if (networkErrorsRef.current >= 2) {
              console.warn("HLS fatal retry limit reached, switching to direct smooth playback");
              handleFastSwitch();
              return;
            }
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn("HLS network error, retrying...");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn("HLS media error, recovering...");
                hls.recoverMediaError();
                break;
              default:
                console.warn("HLS fatal error:", data);
                hls.destroy();
                hlsRef.current = null;
                handleFastSwitch();
                break;
            }
          }
        });

        return () => {
          if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
          }
        };
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
  }, [streamUrl, isPlayingIntro, movie.id, profile.id]);

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

  // 3. Play FilmFlex Intro Video automatically (100% fullscreen cover)
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
      if (videoRef.current) {
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
      if (isPlayingIntro) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        handleSeekDelta(10);
      } else if (e.code === "ArrowLeft") {
        handleSeekDelta(-10);
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        setVolume((v) => Math.min(1, v + 0.1));
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        setVolume((v) => Math.max(0, v - 0.1));
      } else if (e.code === "KeyF") {
        toggleFullscreen();
      } else if (e.code === "KeyM") {
        toggleMute();
      } else if (e.code === "Escape") {
        if (showEpisodesDrawer) {
          setShowEpisodesDrawer(false);
        } else {
          onBack();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isPlayingIntro, isMuted, duration, currentTime, showEpisodesDrawer]);

  // 6. Periodic Progress Saver
  useEffect(() => {
    if (isPlayingIntro) return;
    const saveInterval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused && videoRef.current.duration > 0) {
        saveMovieProgress(
          profile.id,
          movie.id,
          videoRef.current.currentTime,
          videoRef.current.duration
        );
      }
    }, 4000);
    return () => clearInterval(saveInterval);
  }, [isPlayingIntro, profile.id, movie.id]);

  // Video Handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      const p = videoRef.current.play();
      if (p !== undefined) {
        p.then(() => setIsPlaying(true)).catch((err) => {
          console.warn("Playback error handled safely:", err);
          setIsPlaying(false);
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
      setCurrentTime(target);
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

  // 7. Cast / Share Screen to Smart TV
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

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden text-white font-sans transition-all duration-300 ${
        isLandscapeMode
          ? "rotate-90 origin-top-left !w-[100dvh] !h-[100dvw] translate-x-[100dvw]"
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
        /* 2. PURE CLEAN STREMIO-IDENTICAL NATIVE PLAYER                 */
        /* ============================================================ */
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {/* Native HTML5 Video Element (Protected with HLS.js and safe error recovery) */}
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
              console.warn("Video playback error handled gracefully");
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
          />

          {/* FilmFlex Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 max-w-sm mx-4 text-center">
                <div className="relative flex items-center justify-center">
                  <Loader2 className="w-14 h-14 text-[#E50914] animate-spin opacity-90" />
                  <div className="absolute text-[10px] text-white font-black tracking-widest">
                    FILMFLEX
                  </div>
                </div>
                <span className="text-xs text-neutral-300 font-mono tracking-wide">
                  Buffering {selectedQuality === "auto" ? "1080p HD" : selectedQuality.toUpperCase()}...
                </span>
                {showFastSwitch && (
                  <div className="animate-fade-in flex flex-col items-center gap-2 mt-1 pointer-events-auto">
                    <p className="text-[11px] text-neutral-400">Connexion en cours...</p>
                    <button
                      onClick={handleFastSwitch}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 transition-all hover:scale-105"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-[#E50914]" />
                      <span>Recharger le flux</span>
                    </button>
                  </div>
                )}
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
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/90 border border-purple-500/50 text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-2xl animate-fade-in flex items-center gap-2 z-40">
              <Tv className="w-4 h-4 text-purple-400" />
              <span>{castNotice}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* TOP BAR                                                      */}
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
              <h2 className="text-xs sm:text-base font-medium tracking-wide text-neutral-200 truncate max-w-[140px] sm:max-w-md">
                {movie.title}
                {isSeries && ` (${currentSeason}x${currentEpisode})`}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Rotate Screen button for mobile / portrait phones */}
              <button
                onClick={toggleRotate}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] sm:text-xs font-semibold transition-all"
                title="Tourner l'écran (Paysage / Portrait)"
              >
                <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                <span>{isLandscapeMode ? "Portrait" : "Paysage"}</span>
              </button>

              {/* Fit / Cover mode toggle */}
              <button
                onClick={() => setAspectMode(aspectMode === "contain" ? "cover" : "contain")}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs font-semibold transition-all"
                title="Ajuster le format (Adapter / Remplir)"
              >
                <Scaling className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] sm:text-xs">{aspectMode === "contain" ? "Adapter" : "Remplir"}</span>
              </button>

              <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-neutral-900/90 text-neutral-300 border border-neutral-700 text-[10px] sm:text-xs font-mono font-semibold uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{selectedQuality === "auto" ? "1080p HD" : selectedQuality.toUpperCase()}</span>
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
          {/* BOTTOM CONTROLS BAR: Exact Stremio Replica                   */}
          {/* ============================================================ */}
          <div
            className={`absolute bottom-0 left-0 right-0 px-4 md:px-6 py-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col gap-2 transition-opacity duration-300 z-30 ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Scrubber Timeline Bar */}
            <div className="flex items-center gap-3 w-full">
              <span className="text-[11px] font-mono text-neutral-400 w-14 text-right">
                {formatTime(currentTime)}
              </span>

              {/* Glowing Purple Progress Bar */}
              <div className="relative flex-1 group/slider flex items-center cursor-pointer">
                <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-700 via-purple-600 to-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.7)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div
                  className="absolute w-3.5 h-3.5 bg-purple-400 rounded-full shadow-[0_0_10px_#A855F7] -translate-x-1/2 pointer-events-none"
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

            {/* Bottom Controls Row */}
            <div className="flex items-center justify-between pt-1">
              {/* Left Controls: Play/Pause, Next Episode, Volume Slider */}
              <div className="flex items-center gap-4 md:gap-5">
                <button
                  onClick={togglePlay}
                  className="text-neutral-300 hover:text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                </button>

                {isSeries && (
                  <button
                    onClick={handleNextEpisode}
                    className="text-neutral-300 hover:text-white transition-colors"
                    title="Épisode Suivant"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                )}

                {/* Volume Speaker + Horizontal Slider (Hidden on mobile to prioritize touch buttons) */}
                <div className="hidden sm:flex items-center gap-2 group/vol">
                  <button
                    onClick={toggleMute}
                    className="text-neutral-300 hover:text-white transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 md:w-24 h-1 bg-neutral-700 accent-orange-500 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Right Tools */}
              <div className="flex items-center gap-3 md:gap-4 relative">
                {/* 1. 📑 Épisodes Drawer Button (for Series) */}
                {isSeries && (
                  <button
                    onClick={() => setShowEpisodesDrawer(!showEpisodesDrawer)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800/80 hover:bg-neutral-700 text-xs text-neutral-200 hover:text-white transition-colors border border-neutral-700"
                    title="Liste des épisodes"
                  >
                    <ListVideo className="w-4 h-4 text-purple-400" />
                    <span className="hidden sm:inline">Épisodes</span>
                  </button>
                )}

                {/* 2. ⚙️ Quality Selector (Qualité fluide selon la connexion) */}
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === "quality" ? null : "quality")}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border border-neutral-700 hover:border-neutral-500 transition-colors ${
                      activeMenu === "quality" ? "bg-purple-900/60 text-purple-300 border-purple-500" : "text-neutral-300"
                    }`}
                    title="Qualité vidéo"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span className="uppercase text-[11px]">{selectedQuality}</span>
                  </button>

                  {/* Quality Popover */}
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
                            <Check className="w-3.5 h-3.5 text-purple-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. 📺 Cast / Share Screen to Smart TV */}
                <button
                  onClick={handleCastToTV}
                  className="text-neutral-300 hover:text-white transition-colors p-1"
                  title="Diffuser sur Smart TV / Partager l'écran"
                >
                  <Tv className="w-4 h-4 text-purple-400 hover:text-purple-300" />
                </button>

                {/* 4. ⏱ Playback Speed */}
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === "speed" ? null : "speed")}
                    className={`text-neutral-300 hover:text-white transition-colors p-1 ${
                      activeMenu === "speed" ? "text-purple-400" : ""
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
                          {playbackSpeed === spd && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. 🗩 Subtitles */}
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === "subtitles" ? null : "subtitles")}
                    className={`text-neutral-300 hover:text-white transition-colors p-1 ${
                      activeMenu === "subtitles" ? "text-purple-400" : ""
                    }`}
                    title="Sous-titres"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  {activeMenu === "subtitles" && (
                    <div className="absolute bottom-12 right-0 w-60 bg-[#181818]/95 backdrop-blur-md border border-neutral-800 rounded-lg p-2 shadow-2xl z-50 animate-scale-up space-y-1">
                      <div className="text-[11px] font-bold text-neutral-400 px-2 py-1 border-b border-neutral-800">
                        Sous-titres
                      </div>
                      <button
                        onClick={() => {
                          setSelectedSubtitle("off");
                          setActiveMenu(null);
                        }}
                        className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-neutral-800 text-left text-neutral-300"
                      >
                        <span>Désactivé</span>
                        {selectedSubtitle === "off" && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </button>
                      {movie.subtitles.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubtitle(sub.id);
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-neutral-800 text-left text-neutral-300"
                        >
                          <span>{sub.label}</span>
                          {selectedSubtitle === sub.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 6. ılılı Audio Tracks */}
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === "audio" ? null : "audio")}
                    className={`text-neutral-300 hover:text-white transition-colors p-1 ${
                      activeMenu === "audio" ? "text-purple-400" : ""
                    }`}
                    title="Audio"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>

                  {activeMenu === "audio" && (
                    <div className="absolute bottom-12 right-0 w-64 bg-[#181818]/95 backdrop-blur-md border border-neutral-800 rounded-lg p-2 shadow-2xl z-50 animate-scale-up space-y-1">
                      <div className="text-[11px] font-bold text-neutral-400 px-2 py-1 border-b border-neutral-800">
                        Piste Audio
                      </div>
                      {movie.audioTracks.map((aud) => (
                        <button
                          key={aud.id}
                          onClick={() => setActiveMenu(null)}
                          className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-neutral-800 text-left text-neutral-300"
                        >
                          <span>{aud.label}</span>
                          {aud.isDefault && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 7. 🗗 Picture in Picture */}
                <button
                  onClick={togglePiP}
                  className="text-neutral-300 hover:text-white transition-colors p-1 hidden sm:block"
                  title="Picture in Picture"
                >
                  <PictureInPicture2 className="w-4 h-4" />
                </button>

                {/* 8. 🔄 Tourner l'écran */}
                <button
                  onClick={toggleRotate}
                  className="text-neutral-300 hover:text-white transition-colors p-1"
                  title="Tourner l'écran (Paysage / Portrait)"
                >
                  <RotateCw className="w-4 h-4 text-purple-400" />
                </button>
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
                  <ListVideo className="w-5 h-5 text-purple-400" />
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
                          ? "bg-purple-900/30 border-purple-500/60 shadow"
                          : "bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800"
                      }`}
                    >
                      <span className={`text-sm font-bold w-5 text-center ${isCurrent ? "text-purple-400" : "text-neutral-500"}`}>
                        {ep.episode}
                      </span>
                      <div className="relative w-20 aspect-[16/9] rounded overflow-hidden bg-neutral-800 flex-none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ep.thumbnail || movie.backdropUrl}
                          alt={ep.title}
                          className="w-full h-full object-cover"
                        />
                        {isCurrent && (
                          <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                            <Play className="w-3.5 h-3.5 fill-white text-white" />
                          </div>
                        )}
                      </div>
                      <div className="truncate flex-1">
                        <div className={`text-xs font-semibold truncate ${isCurrent ? "text-purple-300" : "text-white"}`}>
                          {ep.title}
                        </div>
                        <div className="text-[10px] text-neutral-400">~45m</div>
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
