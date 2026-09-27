import { Profile, UserAccount, WatchProgress, Movie } from "@/types";
import { DEFAULT_PROFILES, INITIAL_MOVIES } from "./constants";

const USER_STORAGE_KEY = "filmflex_user_session";
const PROGRESS_STORAGE_PREFIX = "filmflex_progress_";
const MY_LIST_STORAGE_PREFIX = "filmflex_mylist_";

export function getStoredUser(): UserAccount {
  if (typeof window === "undefined") {
    return {
      id: "usr_guest",
      email: "subscriber@filmflex.tv",
      isSubscribed: true, // Default active subscriber for seamless experience
      subscriptionPlan: "VIP_MONTHLY",
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      profiles: DEFAULT_PROFILES,
      activeProfileId: DEFAULT_PROFILES[0].id,
    };
  }

  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      const initial: UserAccount = {
        id: "usr_guest",
        email: "subscriber@filmflex.tv",
        isSubscribed: true,
        subscriptionPlan: "VIP_MONTHLY",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        profiles: DEFAULT_PROFILES,
        activeProfileId: DEFAULT_PROFILES[0].id,
      };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return {
      id: "usr_guest",
      email: "subscriber@filmflex.tv",
      isSubscribed: true,
      subscriptionPlan: "VIP_MONTHLY",
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      profiles: DEFAULT_PROFILES,
      activeProfileId: DEFAULT_PROFILES[0].id,
    };
  }
}

export function saveUser(user: UserAccount): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error("Failed to save user session", e);
  }
}

// Profile management (Strict Max 2 Profiles)
export function updateProfile(profileId: string, updates: Partial<Profile>): UserAccount {
  const user = getStoredUser();
  user.profiles = user.profiles.map((p) => (p.id === profileId ? { ...p, ...updates } : p));
  saveUser(user);
  return user;
}

export function setActiveProfile(profileId: string): UserAccount {
  const user = getStoredUser();
  user.activeProfileId = profileId;
  saveUser(user);
  return user;
}

// Watch Progress (Resume playback / Continue watching)
export function getProfileProgress(profileId: string): WatchProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${PROGRESS_STORAGE_PREFIX}${profileId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMovieProgress(
  profileId: string,
  movieId: string,
  currentSeconds: number,
  totalSeconds: number
): void {
  if (typeof window === "undefined" || !profileId || !movieId) return;
  try {
    const list = getProfileProgress(profileId);
    const percentage = totalSeconds > 0 ? Math.round((currentSeconds / totalSeconds) * 100) : 0;

    const existingIndex = list.findIndex((item) => item.movieId === movieId);
    const record: WatchProgress = {
      movieId,
      currentSeconds: Math.floor(currentSeconds),
      totalSeconds: Math.floor(totalSeconds),
      percentage,
      lastWatchedAt: new Date().toISOString(),
    };

    if (existingIndex > -1) {
      list[existingIndex] = record;
    } else {
      list.unshift(record);
    }

    // Keep only last 20 watched movies
    localStorage.setItem(`${PROGRESS_STORAGE_PREFIX}${profileId}`, JSON.stringify(list.slice(0, 20)));
  } catch (e) {
    console.error("Failed to save movie progress", e);
  }
}

export function getMovieResumeTime(profileId: string, movieId: string): number {
  const list = getProfileProgress(profileId);
  const found = list.find((p) => p.movieId === movieId);
  if (found && found.percentage < 95) {
    // If not virtually finished, resume from last position
    return found.currentSeconds;
  }
  return 0;
}

// My List (Bookmarks)
export function getMyList(profileId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${MY_LIST_STORAGE_PREFIX}${profileId}`);
    return raw ? JSON.parse(raw) : ["m_dune2", "m_inception"];
  } catch {
    return [];
  }
}

export function toggleMyList(profileId: string, movieId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const list = getMyList(profileId);
    let updated: string[];
    let added = false;
    if (list.includes(movieId)) {
      updated = list.filter((id) => id !== movieId);
      added = false;
    } else {
      updated = [movieId, ...list];
      added = true;
    }
    localStorage.setItem(`${MY_LIST_STORAGE_PREFIX}${profileId}`, JSON.stringify(updated));
    return added;
  } catch {
    return false;
  }
}

export function getMovieById(id: string): Movie | undefined {
  return INITIAL_MOVIES.find((m) => m.id === id);
}
