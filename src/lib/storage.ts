import { Profile, UserAccount, WatchProgress, Movie } from "@/types";
import { DEFAULT_PROFILES, INITIAL_MOVIES } from "./constants";
import { checkSubscriptionValidity } from "./auth";
import {
  syncProgressToSupabase,
  syncMyListToSupabase,
  syncProfileToSupabase,
} from "./supabase";

const USER_STORAGE_KEY = "filmflex_user_session";
const PROGRESS_STORAGE_PREFIX = "filmflex_progress_";
const MY_LIST_STORAGE_PREFIX = "filmflex_mylist_";

export function getStoredUser(): UserAccount | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: UserAccount = JSON.parse(raw);
    const validated = checkSubscriptionValidity(parsed);
    if (validated.isSubscribed !== parsed.isSubscribed) {
      saveUser(validated);
    }
    return validated;
  } catch {
    return null;
  }
}

export function clearUserSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_STORAGE_KEY);
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
export function updateProfile(profileId: string, updates: Partial<Profile>): UserAccount | null {
  const user = getStoredUser();
  if (!user) return null;
  user.profiles = user.profiles.map((p) => (p.id === profileId ? { ...p, ...updates } : p));
  saveUser(user);

  const updatedProfile = user.profiles.find((p) => p.id === profileId);
  if (updatedProfile) {
    syncProfileToSupabase(updatedProfile).catch(() => {});
  }

  return user;
}

export function setActiveProfile(profileId: string): UserAccount | null {
  const user = getStoredUser();
  if (!user) return null;
  user.activeProfileId = profileId;
  saveUser(user);
  return user;
}

// Watch Progress (Resume playback / Continue watching) - Strictly Deduplicated
export function getProfileProgress(profileId: string): WatchProgress[] {
  if (typeof window === "undefined" || !profileId) return [];
  try {
    const raw = localStorage.getItem(`${PROGRESS_STORAGE_PREFIX}${profileId}`);
    if (!raw) return [];
    const list: WatchProgress[] = JSON.parse(raw);

    // Strict deduplication by movieId preserving newest watched order
    const seen = new Set<string>();
    const uniqueList: WatchProgress[] = [];

    for (const item of list) {
      if (item && item.movieId && !seen.has(item.movieId)) {
        seen.add(item.movieId);
        uniqueList.push(item);
      }
    }

    return uniqueList;
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

    const record: WatchProgress = {
      movieId,
      currentSeconds: Math.floor(currentSeconds),
      totalSeconds: Math.floor(totalSeconds),
      percentage,
      lastWatchedAt: new Date().toISOString(),
    };

    // Filter out previous entry to eliminate any duplicate and place at the head
    const filtered = list.filter((item) => item.movieId !== movieId);
    filtered.unshift(record);

    // Keep only last 25 watched movies
    const cleaned = filtered.slice(0, 25);
    localStorage.setItem(`${PROGRESS_STORAGE_PREFIX}${profileId}`, JSON.stringify(cleaned));

    // Asynchronously synchronize to Supabase
    syncProgressToSupabase(profileId, record).catch(() => {});
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

// My List (Bookmarks) - Strictly Deduplicated
export function getMyList(profileId: string): string[] {
  if (typeof window === "undefined" || !profileId) return [];
  try {
    const raw = localStorage.getItem(`${MY_LIST_STORAGE_PREFIX}${profileId}`);
    const list: string[] = raw ? JSON.parse(raw) : ["m_dune2", "m_inception"];
    return Array.from(new Set(list));
  } catch {
    return [];
  }
}

export function toggleMyList(profileId: string, movieId: string): boolean {
  if (typeof window === "undefined" || !profileId || !movieId) return false;
  try {
    const list = getMyList(profileId);
    let updated: string[];
    let added = false;

    if (list.includes(movieId)) {
      updated = list.filter((id) => id !== movieId);
      added = false;
    } else {
      updated = [movieId, ...list.filter((id) => id !== movieId)];
      added = true;
    }

    localStorage.setItem(`${MY_LIST_STORAGE_PREFIX}${profileId}`, JSON.stringify(updated));

    // Asynchronously synchronize to Supabase
    syncMyListToSupabase(profileId, movieId, added).catch(() => {});

    return added;
  } catch {
    return false;
  }
}

export function getMovieById(id: string): Movie | undefined {
  return INITIAL_MOVIES.find((m) => m.id === id);
}
