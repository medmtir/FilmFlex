import { NextRequest, NextResponse } from "next/server";
import { INITIAL_MOVIES } from "@/lib/constants";
import { fetchTorrentioStreams, TorrentioStream } from "@/lib/stremio";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season") ? parseInt(searchParams.get("season")!, 10) : undefined;
    const episode = searchParams.get("episode") ? parseInt(searchParams.get("episode")!, 10) : undefined;
    const requestedQuality = searchParams.get("quality") || "auto";

    let rawId = id;
    if (rawId.includes("&")) {
      rawId = rawId.split("&")[0];
    }
    const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!cleanId) {
      return NextResponse.json({ error: "Invalid stream identifier" }, { status: 400 });
    }

    const imdbId = cleanId.startsWith("tt") ? cleanId : "tt15239678";

    // 1. Fetch real streams from Torrentio
    let torrentioStreams: TorrentioStream[] = [];
    try {
      torrentioStreams = await fetchTorrentioStreams(imdbId, season, episode);
    } catch {
      torrentioStreams = [];
    }

    const localMovie = INITIAL_MOVIES.find((m) => m.id === cleanId || m.imdbId === cleanId);

    // Guaranteed fallback streams
    const fallbackStreams: Record<string, string> = {
      "4k": "/sample.mp4",
      "1080p": "/sample.mp4",
      "720p": "/filmflex.mp4",
      "480p": "/filmflex.mp4",
    };

    const qualityMap: Record<string, string> = {};

    const toHlsUrl = (s: TorrentioStream) => {
      if (s.url && s.url.startsWith("http")) return s.url;
      const fileIdx = s.fileIdx !== undefined ? s.fileIdx : 0;
      const localStremioHls = `http://127.0.0.1:11470/${s.infoHash}/${fileIdx}/hls.m3u8`;
      return `/api/hls?url=${encodeURIComponent(localStremioHls)}`;
    };

    // Helper: Parse seeders count and score stream health
    const getSeeds = (s: TorrentioStream): number => {
      const match = s.title?.match(/👤\s*(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    const getTrackerScore = (s: TorrentioStream): number => {
      const text = `${s.name || ""} ${s.title || ""}`.toLowerCase();
      let score = getSeeds(s);
      if (text.includes("yts")) score += 200;
      if (text.includes("eztv")) score += 150;
      if (text.includes("torrentgalaxy") || text.includes("tgx")) score += 100;
      if (text.includes("1337x")) score += 50;
      return score;
    };

    // Sort all streams by weighted seeder health
    const sortedStreams = [...torrentioStreams].sort((a, b) => getTrackerScore(b) - getTrackerScore(a));

    let browserStreamUrl = fallbackStreams["1080p"];

    if (sortedStreams.length > 0) {
      const findStreamByKeywords = (keywords: string[], minSeeds = 30) => {
        return sortedStreams.find((s) => {
          const text = `${s.name || ""} ${s.title || ""} ${s.behaviorHints?.filename || ""}`.toLowerCase();
          const matches = keywords.some((kw) => text.includes(kw.toLowerCase()));
          return matches && getSeeds(s) >= minSeeds;
        });
      };

      const topStream = sortedStreams[0];
      const topSeeds = getSeeds(topStream);
      const stream4k = findStreamByKeywords(["4k", "2160p", "uhd"], 20) || topStream;
      const stream1080 = findStreamByKeywords(["1080p", "fhd"], 20) || topStream;
      const stream720 = findStreamByKeywords(["720p", "hd"], 30) || topStream;
      const stream480 = findStreamByKeywords(["480p", "sd"], 150);

      if (stream4k) qualityMap["4k"] = toHlsUrl(stream4k);
      if (stream1080) qualityMap["1080p"] = toHlsUrl(stream1080);
      if (stream720) qualityMap["720p"] = toHlsUrl(stream720);
      
      // For 480p: Never pick a dead or obscure swarm.
      // If 480p stream has less than 150 seeds or less than 25% of top stream,
      // fallback to stream720 or topStream so the user gets smooth instant streaming!
      if (stream480 && getSeeds(stream480) >= 150 && getSeeds(stream480) >= topSeeds * 0.25) {
        qualityMap["480p"] = toHlsUrl(stream480);
      } else if (stream720) {
        qualityMap["480p"] = toHlsUrl(stream720);
      } else {
        qualityMap["480p"] = toHlsUrl(topStream);
      }

      // Fill in remaining qualities with top stream
      if (!qualityMap["1080p"]) qualityMap["1080p"] = toHlsUrl(topStream);
      if (!qualityMap["720p"]) qualityMap["720p"] = toHlsUrl(topStream);
      if (!qualityMap["4k"]) qualityMap["4k"] = qualityMap["1080p"];

      if (requestedQuality !== "auto" && qualityMap[requestedQuality]) {
        browserStreamUrl = qualityMap[requestedQuality];
      } else {
        browserStreamUrl = toHlsUrl(topStream);
      }
    } else {
      qualityMap["4k"] = fallbackStreams["4k"];
      qualityMap["1080p"] = fallbackStreams["1080p"];
      qualityMap["720p"] = fallbackStreams["720p"];
      qualityMap["480p"] = fallbackStreams["480p"];
      browserStreamUrl = localMovie?.videoUrl || fallbackStreams["1080p"];
    }

    // Direct Web Stream fallback URL (instant playback, zero peer waiting)
    const isSeries = season !== undefined && episode !== undefined;
    const webStreamUrl = isSeries
      ? `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=${season}&episode=${episode}`
      : `https://vidsrc.me/embed/movie?imdb=${imdbId}`;

    return NextResponse.json(
      {
        streamUrl: browserStreamUrl,
        webStreamUrl,
        currentQuality: requestedQuality === "auto" ? "1080p" : requestedQuality,
        qualityMap,
        availableQualities: [
          { key: "auto", label: "Auto (S'adapte à la connexion)" },
          { key: "1080p", label: "1080p Full HD (Fluide)" },
          { key: "720p", label: "720p HD (Économique & Rapide)" },
          { key: "480p", label: "480p SD (Connexion faible)" },
          { key: "4k", label: "4K Ultra HD (Fibre)" },
        ],
        subtitles: [
          { id: "sub_ar", label: "العربية (Arabic)", language: "ar", src: "/subtitles/sample_ar.vtt", isDefault: true },
          { id: "sub_fr", label: "Français (French)", language: "fr", src: "/subtitles/sample_fr.vtt" },
          { id: "sub_en", label: "English [CC]", language: "en", src: "/subtitles/sample_en.vtt" },
        ],
        audioTracks: [
          { id: "aud_en", label: "English [Original 5.1]", language: "en", isDefault: true },
          { id: "aud_fr", label: "Français (VFF)", language: "fr" },
        ],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Stream API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
