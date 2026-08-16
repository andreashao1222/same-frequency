import { NextResponse } from "next/server";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Spotify credentials are missing.");

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!tokenRes.ok) throw new Error("Could not authenticate with Spotify.");
  const token = await tokenRes.json();
  cachedToken = { value: token.access_token, expiresAt: Date.now() + Number(token.expires_in || 3600) * 1000 };
  return cachedToken.value;
}

async function deezerGenres(name: string): Promise<string[]> {
  try {
    // Deezer's public search endpoint does not require an API key.
    const url = new URL("https://api.deezer.com/search/artist");
    url.searchParams.set("q", name);
    url.searchParams.set("limit", "5");
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    const wanted = name.trim().toLowerCase();
    const candidates = Array.isArray(data.data) ? data.data : [];
    const exact = candidates.find((x: any) => String(x?.name ?? "").trim().toLowerCase() === wanted) ?? candidates[0];
    const genreId = exact?.genre_id;
    if (!genreId) return [];

    const genreRes = await fetch(`https://api.deezer.com/genre/${genreId}`, { cache: "no-store" });
    if (!genreRes.ok) return [];
    const genre = await genreRes.json();
    return genre?.name ? [String(genre.name)] : [];
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ artists: [] });

  try {
    const token = await getToken();
    const url = new URL("https://api.spotify.com/v1/search");
    url.searchParams.set("q", q);
    url.searchParams.set("type", "artist");
    url.searchParams.set("limit", "8");

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!res.ok) return NextResponse.json({ artists: [] }, { status: res.status });

    const data = await res.json();
    const base = (data.artists?.items ?? []).map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      spotifyUrl: artist.external_urls?.spotify ?? `https://open.spotify.com/artist/${artist.id}`,
      genres: Array.isArray(artist.genres) ? artist.genres : [],
    }));

    // Spotify genre metadata is deprecated on some responses. Add a free
    // secondary source so arbitrary artists don't silently become "indie".
    const artists = await Promise.all(base.map(async (artist: any) => {
      if (artist.genres.length) return artist;
      const extra = await deezerGenres(artist.name);
      return { ...artist, genres: extra };
    }));

    return NextResponse.json({ artists });
  } catch {
    return NextResponse.json({ artists: [], error: "Spotify search is not configured yet." }, { status: 200 });
  }
}
