import { Movie, SubtitleTrack, AudioTrack, Episode } from "@/types";

const CINEMETA_URL = "https://v3-cinemeta.strem.io";
const TORRENTIO_URL = "https://torrentio.strem.fun";

interface CinemetaMeta {
  id: string;
  imdb_id?: string;
  name: string;
  description?: string;
  poster?: string;
  background?: string;
  year?: string;
  releaseInfo?: string;
  imdbRating?: string;
  runtime?: string;
  type?: string;
  genres?: string[];
  genre?: string[];
  cast?: string[];
  director?: string[] | string;
  trailers?: Array<{ source: string; type: string }>;
  trailerStreams?: Array<{ ytId: string }>;
  videos?: Array<{
    id: string;
    name?: string;
    title?: string;
    season: number;
    episode?: number;
    number?: number;
    overview?: string;
    description?: string;
    thumbnail?: string;
  }>;
}

export function formatCinemetaToMovie(item: CinemetaMeta, index: number = 0): Movie {
  const imdbId = item.imdb_id || item.id || `tt_${index}`;
  const title = item.name || "Untitled Film";
  const desc = item.description || "Regardez ce titre en streaming haute définition sur FilmFlex.";
  const poster = item.poster || "https://images.metahub.space/poster/small/" + imdbId + "/img";
  const backdrop = item.background || item.poster || "https://images.metahub.space/background/medium/" + imdbId + "/img";

  let trailerId = "Way9Dexny3w";
  if (item.trailers && item.trailers.length > 0 && item.trailers[0].source) {
    trailerId = item.trailers[0].source;
  } else if (item.trailerStreams && item.trailerStreams.length > 0 && item.trailerStreams[0].ytId) {
    trailerId = item.trailerStreams[0].ytId;
  }

  let durationStr = "2h 10m";
  let durationSecs = 7800;
  const isSeries = item.type === "series" || (item.runtime && item.runtime.toLowerCase().includes("season"));

  if (item.runtime) {
    const minsMatch = item.runtime.match(/(\d+)\s*min/i);
    if (minsMatch) {
      const mins = parseInt(minsMatch[1], 10);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      durationStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
      durationSecs = mins * 60;
    } else {
      durationStr = item.runtime;
    }
  } else if (isSeries) {
    durationStr = "Série TV";
  }

  const rating = parseFloat(item.imdbRating || "7.5");
  const matchPercentage = Math.min(99, Math.max(85, Math.round(rating * 10 + 15)));

  const genresList = item.genres || item.genre || ["Cinema", "Popular"];
  const castList = item.cast || ["Starring Ensemble"];
  const director = Array.isArray(item.director) ? item.director.join(", ") : item.director || "";

  // Parse episodes if available
  let episodes: Episode[] | undefined;
  if (item.videos && item.videos.length > 0) {
    episodes = item.videos.map((v) => ({
      id: v.id,
      season: v.season,
      episode: v.episode || v.number || 1,
      title: v.name || v.title || `Épisode ${v.episode || v.number || 1}`,
      overview: v.overview || v.description || "",
      thumbnail: v.thumbnail || backdrop,
    }));
  }

  const subtitles: SubtitleTrack[] = [
    { id: "sub_ar", label: "العربية (Arabic)", language: "ar", src: "/subtitles/sample_ar.vtt", isDefault: true },
    { id: "sub_fr", label: "Français (French)", language: "fr", src: "/subtitles/sample_fr.vtt" },
    { id: "sub_en", label: "English [CC]", language: "en", src: "/subtitles/sample_en.vtt" },
  ];

  const audioTracks: AudioTrack[] = [
    { id: "aud_orig", label: "Original [Dolby 5.1]", language: "en", isDefault: true },
    { id: "aud_vf", label: "Français (VFF)", language: "fr" },
  ];

  return {
    id: imdbId,
    imdbId,
    title,
    originalTitle: title,
    description: desc,
    backdropUrl: backdrop,
    posterUrl: poster,
    trailerYoutubeId: trailerId,
    videoUrl: "/sample.mp4",
    duration: durationStr,
    durationSeconds: durationSecs,
    releaseYear: parseInt(item.year || item.releaseInfo || "2024", 10) || 2024,
    matchPercentage,
    ageRating: "16+",
    quality: "4K UHD",
    genres: genresList,
    cast: castList,
    director,
    type: isSeries ? "series" : "movie",
    episodes,
    subtitles,
    audioTracks,
  };
}

// Fetch Catalog from Cinemeta
export async function fetchCinemetaCatalog(
  type: "movie" | "series" = "movie",
  genre?: string,
  search?: string
): Promise<Movie[]> {
  try {
    let url = `${CINEMETA_URL}/catalog/${type}/top.json`;

    if (search && search.trim().length > 0) {
      url = `${CINEMETA_URL}/catalog/${type}/top/search=${encodeURIComponent(search.trim())}.json`;
    } else if (genre && genre.trim().length > 0) {
      url = `${CINEMETA_URL}/catalog/${type}/top/genre=${encodeURIComponent(genre.trim())}.json`;
    }

    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Cinemeta error: ${res.status}`);
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.metas)) {
      return [];
    }

    return data.metas.slice(0, 24).map((item: CinemetaMeta, idx: number) => {
      item.type = type;
      return formatCinemetaToMovie(item, idx);
    });
  } catch (err) {
    console.error("Failed to fetch Cinemeta catalog:", err);
    return [];
  }
}

// Fetch detailed metadata including episodes for a series
export async function fetchSeriesEpisodes(imdbId: string): Promise<Episode[]> {
  try {
    const url = `${CINEMETA_URL}/meta/series/${imdbId}.json`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];

    const data = await res.json();
    if (data?.meta?.videos && Array.isArray(data.meta.videos)) {
      return data.meta.videos
        .filter((v: { season: number }) => v.season > 0) // exclude specials (season 0)
        .map((v: { id: string; season: number; episode?: number; number?: number; name?: string; title?: string; overview?: string; description?: string; thumbnail?: string }) => ({
          id: v.id,
          season: v.season,
          episode: v.episode || v.number || 1,
          title: v.name || v.title || `Épisode ${v.episode || v.number || 1}`,
          overview: v.overview || v.description || "",
          thumbnail: v.thumbnail || `https://episodes.metahub.space/${imdbId}/${v.season}/${v.episode || v.number || 1}/w780.jpg`,
        }));
    }
    return [];
  } catch {
    return [];
  }
}

// Fetch Real Torrentio Streams
export interface TorrentioStream {
  name: string;
  title: string;
  infoHash?: string;
  fileIdx?: number;
  url?: string;
  behaviorHints?: {
    filename?: string;
    bingeGroup?: string;
  };
}

export async function fetchTorrentioStreams(imdbId: string, season?: number, episode?: number): Promise<TorrentioStream[]> {
  try {
    const config = process.env.TORRENTIO_CONFIG || "";
    const baseUrl = config ? `${TORRENTIO_URL}/${config}` : TORRENTIO_URL;
    let path = `stream/movie/${imdbId}.json`;
    if (season !== undefined && episode !== undefined) {
      path = `stream/series/${imdbId}:${season}:${episode}.json`;
    }
    const url = `${baseUrl}/${path}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "FilmFlex/1.0" },
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.streams) ? data.streams : [];
  } catch (err) {
    console.error("Failed to fetch Torrentio streams:", err);
    return [];
  }
}
