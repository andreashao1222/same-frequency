import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function overlap(a: string[] = [], b: string[] = []) {
  const A = new Set(a.map(x => String(x).toLowerCase().trim()));
  const B = new Set(b.map(x => String(x).toLowerCase().trim()));
  return [...A].filter(x => B.has(x));
}

function score(artistsA: string[] = [], tagsA: string[] = [], artistsB: string[] = [], tagsB: string[] = []) {
  const sharedArtists = overlap(artistsA, artistsB);
  const sharedTags = overlap(tagsA, tagsB);
  const artistScore = (sharedArtists.length / 5) * 35;
  const tagScore = (sharedTags.length / Math.max(Math.min(tagsA.length, tagsB.length), 1)) * 65;
  return Math.round(Math.min(100, artistScore + tagScore));
}

export async function GET(req: Request) {
  const currentId = new URL(req.url).searchParams.get("exclude");

  const { data, error } = await client()
    .from("profiles")
    .select("id, alias, artists, taste_tags, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profiles = data ?? [];
  const current = currentId ? profiles.find(p => p.id === currentId) : null;

  const pool = profiles.map(profile => ({
    id: profile.id,
    alias: profile.alias,
    artists: Array.isArray(profile.artists) ? profile.artists.slice(0, 5) : [],
    taste_tags: Array.isArray(profile.taste_tags) ? profile.taste_tags.slice(0, 6) : [],
    created_at: profile.created_at,
    score: current && profile.id !== current.id
      ? score(current.artists ?? [], current.taste_tags ?? [], profile.artists ?? [], profile.taste_tags ?? [])
      : null,
    sharedArtists: current && profile.id !== current.id
      ? overlap(current.artists ?? [], profile.artists ?? [])
      : [],
    sharedTags: current && profile.id !== current.id
      ? overlap(current.taste_tags ?? [], profile.taste_tags ?? [])
      : [],
  }));

  if (current) {
    pool.sort((a, b) => {
      if (a.id === current.id) return -1;
      if (b.id === current.id) return 1;
      return (b.score ?? 0) - (a.score ?? 0);
    });
  }

  return NextResponse.json({ profiles: pool });
}
