import { NextRequest, NextResponse } from "next/server";
import { fetchSeriesEpisodes } from "@/lib/stremio";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cleanId = id.replace(/[^a-zA-Z0-9_:-]/g, "");
    if (!cleanId) {
      return NextResponse.json({ episodes: [] }, { status: 400 });
    }

    const episodes = await fetchSeriesEpisodes(cleanId);
    return NextResponse.json({ episodes }, { status: 200 });
  } catch (e) {
    console.error("Episodes API Error:", e);
    return NextResponse.json({ episodes: [] }, { status: 500 });
  }
}
