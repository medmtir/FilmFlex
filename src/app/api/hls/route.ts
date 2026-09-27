import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "FilmFlex/1.0",
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return new NextResponse(`Upstream returned ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "";
    const isM3U8 = targetUrl.includes(".m3u8") || contentType.includes("mpegurl");

    if (isM3U8) {
      const text = await res.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
      const lines = text.split("\n");
      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Any tag containing URI="...", rewrite to /api/hls?url=...
        if (trimmed.includes('URI="')) {
          return trimmed.replace(/URI="([^"]+)"/g, (_, uri) => {
            const absoluteUri = uri.startsWith("http") ? uri : new URL(uri, baseUrl).toString();
            return `URI="/api/hls?url=${encodeURIComponent(absoluteUri)}"`;
          });
        }

        // Segment / sub-stream playlist lines
        if (!trimmed.startsWith("#")) {
          const absoluteUri = trimmed.startsWith("http") ? trimmed : new URL(trimmed, baseUrl).toString();
          return `/api/hls?url=${encodeURIComponent(absoluteUri)}`;
        }

        return line;
      });

      return new NextResponse(rewrittenLines.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      });
    } else {
      // Binary .m4s / .ts / .mp4 video segment
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        status: res.status,
        headers: {
          "Content-Type": contentType || "video/mp4",
          "Content-Length": res.headers.get("content-length") || buffer.byteLength.toString(),
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch (err) {
    console.error("HLS Proxy error:", err);
    return new NextResponse("HLS Proxy error", { status: 502 });
  }
}
