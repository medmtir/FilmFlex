import { createClient } from "@supabase/supabase-js";
import { Profile, WatchProgress } from "@/types";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vpdrqiyogjffdtohqpqs.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_-_LL21TJX6JPGTR5Ahm05Q_CHwwI5ug";

export const isSupabaseConfigured = () => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 10);
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Synchronize watch progress with Supabase
 * Enforces upsert on (profile_id, movie_id) so duplicates are impossible
 */
export async function syncProgressToSupabase(
  profileId: string,
  progress: WatchProgress
): Promise<void> {
  if (!isSupabaseConfigured() || !profileId || !progress.movieId) return;

  try {
    const { error } = await supabase.from("watch_progress").upsert(
      {
        profile_id: profileId,
        movie_id: progress.movieId,
        current_seconds: progress.currentSeconds,
        total_seconds: progress.totalSeconds,
        percentage: progress.percentage,
        last_watched_at: progress.lastWatchedAt || new Date().toISOString(),
      },
      { onConflict: "profile_id,movie_id" }
    );

    if (error) {
      console.warn("Supabase sync progress notice:", error.message);
    }
  } catch (err) {
    console.warn("Supabase progress sync skipped:", err);
  }
}

/**
 * Fetch watch progress list for a profile from Supabase
 */
export async function fetchProgressFromSupabase(
  profileId: string
): Promise<WatchProgress[] | null> {
  if (!isSupabaseConfigured() || !profileId) return null;

  try {
    const { data, error } = await supabase
      .from("watch_progress")
      .select("movie_id, current_seconds, total_seconds, percentage, last_watched_at")
      .eq("profile_id", profileId)
      .order("last_watched_at", { ascending: false })
      .limit(25);

    if (error || !data) return null;

    // Deduplicate by movie_id
    const seen = new Set<string>();
    const result: WatchProgress[] = [];

    for (const item of data) {
      if (!seen.has(item.movie_id)) {
        seen.add(item.movie_id);
        result.push({
          movieId: item.movie_id,
          currentSeconds: item.current_seconds,
          totalSeconds: item.total_seconds,
          percentage: item.percentage,
          lastWatchedAt: item.last_watched_at,
        });
      }
    }

    return result;
  } catch {
    return null;
  }
}

/**
 * Synchronize favorite movie (My List) to Supabase
 */
export async function syncMyListToSupabase(
  profileId: string,
  movieId: string,
  added: boolean
): Promise<void> {
  if (!isSupabaseConfigured() || !profileId || !movieId) return;

  try {
    if (added) {
      await supabase.from("my_list").upsert(
        {
          profile_id: profileId,
          movie_id: movieId,
          added_at: new Date().toISOString(),
        },
        { onConflict: "profile_id,movie_id" }
      );
    } else {
      await supabase
        .from("my_list")
        .delete()
        .eq("profile_id", profileId)
        .eq("movie_id", movieId);
    }
  } catch (err) {
    console.warn("Supabase my_list sync skipped:", err);
  }
}

/**
 * Fetch My List movie IDs from Supabase
 */
export async function fetchMyListFromSupabase(
  profileId: string
): Promise<string[] | null> {
  if (!isSupabaseConfigured() || !profileId) return null;

  try {
    const { data, error } = await supabase
      .from("my_list")
      .select("movie_id")
      .eq("profile_id", profileId)
      .order("added_at", { ascending: false });

    if (error || !data) return null;

    // Unique list of movie IDs
    const uniqueIds = Array.from(new Set(data.map((d) => d.movie_id)));
    return uniqueIds;
  } catch {
    return null;
  }
}

/**
 * Sync user profile to Supabase
 */
export async function syncProfileToSupabase(profile: Profile): Promise<void> {
  if (!isSupabaseConfigured() || !profile.id) return;

  try {
    await supabase.from("profiles").upsert(
      {
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        is_kids: profile.isKids || false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.warn("Supabase profile sync skipped:", err);
  }
}
