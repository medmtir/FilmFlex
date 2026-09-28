import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

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
