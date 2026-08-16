import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function overlap(a: string[], b: string[]) {
  const A = new Set(a.map(x => x.toLowerCase().trim()));
  const B = new Set(b.map(x => x.toLowerCase().trim()));
  return [...A].filter(x => B.has(x));
}

function score(artistsA: string[], tagsA: string[], artistsB: string[], tagsB: string[]) {
  const sharedArtists = overlap(artistsA, artistsB);
  const sharedTags = overlap(tagsA, tagsB);
  const artistScore = (sharedArtists.length / 5) * 60;
  const tagScore = (sharedTags.length / Math.max(tagsA.length, tagsB.length, 1)) * 40;
  return Math.round(Math.min(100, artistScore + tagScore));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const currentId = url.searchParams.get("exclude");

  const { data, error } = await client()
    .from("profiles")
    .select("id, alias, artists, spotify_url, taste_tags, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const current = data?.find(p => p.id === currentId);
  if (!current) return NextResponse.json({ matches: [] });

  const matches = (data ?? [])
    .filter(p => p.id !== currentId)
    .map(p => ({
      ...p,
      score: score(current.artists, current.taste_tags, p.artists, p.taste_tags),
      sharedArtists: overlap(current.artists, p.artists),
      sharedTags: overlap(current.taste_tags, p.taste_tags),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return NextResponse.json({ matches });
}
