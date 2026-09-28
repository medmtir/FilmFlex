import { NextRequest, NextResponse } from "next/server";

const OPENSUBTITLES_URL = "https://opensubtitles-v3.strem.io";

function srtToVtt(srt: string): string {
  // Clean BOM and carriage returns
  let clean = srt.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Prepend WebVTT header
  let vtt = "WEBVTT\n\n" + clean;
  // Convert timestamps 00:00:52,119 --> 00:00:56,658 to 00:00:52.119 --> 00:00:56.658
  vtt = vtt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  return vtt;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imdbId = searchParams.get("imdbId") || "tt15239678";
  const lang = searchParams.get("lang") || "ara"; // 'ara' | 'fre' | 'eng'
  const season = searchParams.get("season");
  const episode = searchParams.get("episode");

  // Map 2-letter codes to 3-letter codes
  const langMap: Record<string, string> = {
    ar: "ara",
    ara: "ara",
    arabic: "ara",
    fr: "fre",
    fre: "fre",
    fra: "fre",
    french: "fre",
    en: "eng",
    eng: "eng",
    english: "eng",
    es: "spa",
    spa: "spa",
  };

  const targetLang = langMap[lang.toLowerCase()] || "ara";
  const isSeries = Boolean(season && episode);

  try {
    const metaPath = isSeries
      ? `subtitles/series/${imdbId}:${season}:${episode}.json`
      : `subtitles/movie/${imdbId}.json`;

    const metaRes = await fetch(`${OPENSUBTITLES_URL}/${metaPath}`, {
      headers: { "User-Agent": "FilmFlex/1.0" },
      next: { revalidate: 86400 }, // Cache 24 hours
    });

    if (!metaRes.ok) {
      return fallbackEmptyVtt();
    }

    const metaData = await metaRes.json();
    const subtitles: Array<{ lang: string; url: string }> = metaData?.subtitles || [];

    // Find best match for requested language
    const match = subtitles.find(
      (s) => s.lang && s.lang.toLowerCase() === targetLang
    ) || (targetLang === "ara" ? subtitles.find((s) => s.lang === "ar") : null);

    if (!match || !match.url) {
      return fallbackEmptyVtt();
    }

    // Fetch the actual subtitle file
    const subRes = await fetch(match.url, {
      headers: { "User-Agent": "FilmFlex/1.0" },
      next: { revalidate: 86400 },
    });

    if (!subRes.ok) {
      return fallbackEmptyVtt();
    }

    const subText = await subRes.text();
    const vttContent = match.url.endsWith(".vtt") ? subText : srtToVtt(subText);

    return new NextResponse(vttContent, {
      status: 200,
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.warn("Subtitle proxy error:", err);
    return fallbackEmptyVtt();
  }
}

function fallbackEmptyVtt(): NextResponse {
  const empty = "WEBVTT\n\nNOTE FilmFlex Subtitle Stream\n\n";
  return new NextResponse(empty, {
    status: 200,
    headers: {
      "Content-Type": "text/vtt; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
