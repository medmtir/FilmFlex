import { NextRequest, NextResponse } from "next/server";
import { fetchCinemetaCatalog } from "@/lib/stremio";
import { INITIAL_MOVIES } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get("genre") || undefined;
    const type = (searchParams.get("type") as "movie" | "series") || "movie";
    const search = searchParams.get("search") || undefined;

    const movies = await fetchCinemetaCatalog(type, genre, search);

    // If Cinemeta returns movies, combine with initial curated list
    if (movies.length > 0) {
      return NextResponse.json({ movies }, { status: 200 });
    }

    // Fallback to rich curated movies if network timeout
    return NextResponse.json({ movies: INITIAL_MOVIES }, { status: 200 });
  } catch (error) {
    console.error("Catalog API Error:", error);
    return NextResponse.json({ movies: INITIAL_MOVIES }, { status: 200 });
  }
}
