import { Movie, Episode, DownloadedItem } from "@/types";

const OFFLINE_CACHE_NAME = "filmflex-offline-v1";
const OFFLINE_STORAGE_KEY = "filmflex_offline_downloads";
const DOWNLOADS_UPDATED_EVENT = "filmflex_downloads_updated";

export function getDownloadedItems(): DownloadedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveDownloadedItems(items: DownloadedItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(DOWNLOADS_UPDATED_EVENT));
  } catch (err) {
    console.warn("Failed to persist offline downloads", err);
  }
}

export function isItemDownloaded(id: string): boolean {
  const items = getDownloadedItems();
  return items.some((item) => item.id === id && item.status === "completed");
}

export function isItemDownloading(id: string): boolean {
  const items = getDownloadedItems();
  return items.some((item) => item.id === id && item.status === "downloading");
}

export function getItemDownload(id: string): DownloadedItem | undefined {
  const items = getDownloadedItems();
  return items.find((item) => item.id === id);
}

export function onDownloadsUpdated(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(DOWNLOADS_UPDATED_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(DOWNLOADS_UPDATED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export async function startDownload(movie: Movie, episode?: Episode): Promise<void> {
  if (typeof window === "undefined") return;

  const downloadId = episode ? `${movie.id}:${episode.season}:${episode.episode}` : movie.id;
  const existing = getItemDownload(downloadId);
  if (existing && existing.status === "completed") {
    return;
  }

  const isEp = Boolean(episode);
  const sizeMb = isEp ? Math.floor(Math.random() * 80 + 260) : Math.floor(Math.random() * 350 + 950);
  const sizeFormatted = sizeMb > 1000 ? `${(sizeMb / 1024).toFixed(1)} Go` : `${sizeMb} Mo`;

  const newItem: DownloadedItem = {
    id: downloadId,
    movieId: movie.id,
    title: movie.title,
    season: episode?.season,
    episode: episode?.episode,
    episodeTitle: episode?.title,
    posterUrl: movie.posterUrl,
    backdropUrl: episode?.thumbnail || movie.backdropUrl,
    duration: episode?.duration || movie.duration,
    quality: movie.quality || "1080p Full HD",
    sizeFormatted,
    downloadedAt: new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    status: "downloading",
    progress: 5,
    offlineMediaKey: `/offline-media/${downloadId}`,
  };

  // Add or update downloading item in list
  const currentList = getDownloadedItems().filter((item) => item.id !== downloadId);
  saveDownloadedItems([newItem, ...currentList]);

  // Save the media into CacheStorage API for true offline playback
  try {
    const mediaSourceUrl = movie.videoUrl && movie.videoUrl.startsWith("/") ? movie.videoUrl : "/sample.mp4";
    
    // Simulate realistic progressive chunks downloading into device internal memory
    let progress = 10;
    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 18 + 12);
      if (progress >= 100) {
        clearInterval(progressInterval);
        progress = 100;
        
        // Mark as completed
        const list = getDownloadedItems();
        const updated = list.map((item) =>
          item.id === downloadId ? { ...item, status: "completed" as const, progress: 100 } : item
        );
        saveDownloadedItems(updated);
      } else {
        const list = getDownloadedItems();
        const updated = list.map((item) =>
          item.id === downloadId ? { ...item, progress } : item
        );
        saveDownloadedItems(updated);
      }
    }, 450);

    // Cache the offline video file in CacheStorage
    if ("caches" in window) {
      const cache = await caches.open(OFFLINE_CACHE_NAME);
      try {
        const response = await fetch(mediaSourceUrl);
        if (response.ok) {
          await cache.put(`/offline-media/${downloadId}`, response.clone());
        }
      } catch (cacheErr) {
        console.warn("Could not cache full binary offline video:", cacheErr);
      }
    }
  } catch (err) {
    console.error("Download error:", err);
    const list = getDownloadedItems();
    const updated = list.map((item) =>
      item.id === downloadId ? { ...item, status: "error" as const } : item
    );
    saveDownloadedItems(updated);
  }
}

export async function deleteDownload(id: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if ("caches" in window) {
      const cache = await caches.open(OFFLINE_CACHE_NAME);
      await cache.delete(`/offline-media/${id}`);
    }
  } catch {}

  const items = getDownloadedItems().filter((item) => item.id !== id);
  saveDownloadedItems(items);
}

export async function getOfflineVideoUrl(id: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    if ("caches" in window) {
      const cache = await caches.open(OFFLINE_CACHE_NAME);
      const match = await cache.match(`/offline-media/${id}`);
      if (match) {
        const blob = await match.blob();
        return URL.createObjectURL(blob);
      }
    }
  } catch {}

  // Fallback local video
  return "/sample.mp4";
}

export function getTotalStorageFormatted(): string {
  const items = getDownloadedItems().filter((i) => i.status === "completed");
  if (items.length === 0) return "0 Mo";

  let totalMb = 0;
  for (const item of items) {
    if (item.sizeFormatted.includes("Go")) {
      totalMb += parseFloat(item.sizeFormatted) * 1024;
    } else {
      totalMb += parseFloat(item.sizeFormatted) || 300;
    }
  }

  if (totalMb >= 1024) {
    return `${(totalMb / 1024).toFixed(1)} Go`;
  }
  return `${Math.round(totalMb)} Mo`;
}
