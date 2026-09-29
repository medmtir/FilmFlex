export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  src?: string;
  isDefault?: boolean;
}

export interface AudioTrack {
  id: string;
  label: string;
  language: string;
  isDefault?: boolean;
}

export interface Episode {
  id: string;
  season: number;
  episode: number;
  title: string;
  overview?: string;
  thumbnail?: string;
  duration?: string;
}

export interface Movie {
  id: string;
  imdbId?: string;
  tmdbId?: string;
  title: string;
  originalTitle?: string;
  description: string;
  backdropUrl: string;
  posterUrl: string;
  trailerYoutubeId: string;
  videoUrl: string; // Direct stream or test stream
  duration: string; // e.g. "2h 28m" or "4 Seasons"
  durationSeconds: number; // e.g. 8880
  releaseYear: number;
  matchPercentage: number; // e.g. 98%
  ageRating: "ALL" | "13+" | "16+" | "18+";
  quality: "4K UHD" | "HD" | "HDR";
  genres: string[];
  cast: string[];
  director?: string;
  isTrending?: boolean;
  isTop10?: boolean;
  top10Rank?: number;
  isFilmFlexOriginal?: boolean;
  type?: "movie" | "series";
  episodes?: Episode[];
  subtitles: SubtitleTrack[];
  audioTracks: AudioTrack[];
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  pinCode?: string; // Optional 4-digit PIN code
  isKids?: boolean;
}

export interface WatchProgress {
  movieId: string;
  currentSeconds: number;
  totalSeconds: number;
  percentage: number;
  lastWatchedAt: string;
  season?: number;
  episode?: number;
}

export type SubscriptionPlan = "FREE_TRIAL" | "VIP_MONTHLY" | "VIP_ANNUAL";
export type SubscriptionStatus = "active" | "expired" | "cancelled" | "pending";

export interface UserAccount {
  id: string;
  email: string;
  password?: string;
  name?: string;
  role: "user" | "admin";
  isSubscribed: boolean;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionStartedAt?: string;
  subscriptionExpiresAt?: string;
  profiles: Profile[]; // Maximum 2 profiles
  activeProfileId: string;
  maxScreens: number; // Maximum concurrent streams (default 2)
  activeScreens?: number;
  createdAt?: string;
}

export interface CategoryRow {
  id: string;
  title: string;
  movies: Movie[];
  isTop10?: boolean;
  isContinueWatching?: boolean;
}

export interface DownloadedItem {
  id: string;
  movieId: string;
  title: string;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  posterUrl: string;
  backdropUrl: string;
  duration: string;
  quality: string;
  sizeFormatted: string;
  downloadedAt: string;
  status: "downloading" | "completed" | "error";
  progress: number; // 0 - 100
  offlineMediaKey?: string;
}

