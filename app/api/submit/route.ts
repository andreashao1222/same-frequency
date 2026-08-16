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
    const musicPlatform = String(body.musicPlatform ?? "").trim() || null;
    const musicProfileUrl = String(body.musicProfileUrl ?? "").trim() || null;

    if (artists.length !== 5) {
      return NextResponse.json({ error: "Choose exactly 5 artists." }, { status: 400 });
    }

    if (musicProfileUrl) {
      try {
        const parsed = new URL(musicProfileUrl);
        if (parsed.protocol !== "https:") throw new Error();
      } catch {
        return NextResponse.json({ error: "Please paste a valid https profile link." }, { status: 400 });
      }
    }

    const taste = getTasteProfile(artists);
    const db = client();

    const { data: existing } = musicProfileUrl
      ? await db
          .from("profiles")
          .select("id, alias, artists, music_platform, music_profile_url, spotify_url, taste_tags, created_at")
          .eq("music_profile_url", musicProfileUrl)
          .maybeSingle()
      : { data: null };

    if (existing) return NextResponse.json({ profile: existing, existing: true });

    const { data, error } = await db.from("profiles").insert({
      alias: makeAlias(),
      artists,
      music_platform: null,
      music_profile_url: musicProfileUrl,
      spotify_url: null,
      taste_tags: taste.tags
    }).select("id, alias, artists, music_platform, music_profile_url, spotify_url, taste_tags, created_at").single();

    if (error) throw error;
    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not save your profile. Check your Supabase settings." }, { status: 500 });
  }
}
