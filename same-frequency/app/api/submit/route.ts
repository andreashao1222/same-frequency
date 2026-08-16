import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTasteProfile } from "@/lib/taste";

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function makeAlias() {
  return `listener-${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const artists = Array.isArray(body.artists)
      ? body.artists.map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 5)
      : [];
    const spotifyUrl = String(body.spotifyUrl ?? "").trim() || null;

    if (artists.length !== 5) {
      return NextResponse.json({ error: "Choose exactly 5 artists." }, { status: 400 });
    }
    if (spotifyUrl && !/^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}(?:-[A-Z]{2})?\/)?(?:user|profile)\//i.test(spotifyUrl)) {
      return NextResponse.json({ error: "Please paste a valid Spotify profile link." }, { status: 400 });
    }

    const taste = getTasteProfile(artists);
    const db = client();

    const { data: existing } = spotifyUrl
      ? await db
          .from("profiles")
          .select("id, alias, artists, spotify_url, taste_tags, created_at")
          .eq("spotify_url", spotifyUrl)
          .maybeSingle()
      : { data: null };

    if (existing) {
      return NextResponse.json({ profile: existing, existing: true });
    }

    const { data, error } = await db.from("profiles").insert({
      alias: makeAlias(),
      artists,
      spotify_url: spotifyUrl,
      taste_tags: taste.tags
    }).select("id, alias, artists, spotify_url, taste_tags, created_at").single();

    if (error) throw error;
    return NextResponse.json({ profile: data });
  } catch {
    return NextResponse.json({ error: "Could not save your profile. Check your Supabase settings." }, { status: 500 });
  }
}
