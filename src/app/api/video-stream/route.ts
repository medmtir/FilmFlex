import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let targetUrl = searchParams.get("url");
  const id = searchParams.get("id");
  const season = searchParams.get("season");
  const episode = searchParams.get("episode");

  if (!targetUrl && id) {
    const isSeries = Boolean(season && episode);
    const redirectUrl = isSeries
      ? `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=e50914&secondaryColor=181818&iconColor=ffffff&icons=netflix&autoplay=true`
      : `https://vidlink.pro/movie/${id}?primaryColor=e50914&secondaryColor=181818&iconColor=ffffff&icons=netflix&autoplay=true`;
    return NextResponse.redirect(redirectUrl);
  }

  if (!targetUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const range = request.headers.get("range");
    const headers: Record<string, string> = {
      "User-Agent": "FilmFlex/1.0",
    };
    if (range) {
      headers["Range"] = range;
    }

    const upstream = await fetch(targetUrl, {
      headers,
    });

    const responseHeaders = new Headers();
    const headersToForward = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "cache-control",
    ];

    for (const h of headersToForward) {
      const val = upstream.headers.get(h);
      if (val) responseHeaders.set(h, val);
    }

    if (!responseHeaders.has("content-type")) {
      responseHeaders.set("content-type", "video/mp4");
    }
    responseHeaders.set("accept-ranges", "bytes");
    responseHeaders.set("access-control-allow-origin", "*");

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("Video stream proxy error:", err);
    return new NextResponse("Video stream error", { status: 502 });
  }
}
