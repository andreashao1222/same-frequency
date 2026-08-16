import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTasteProfile } from "@/lib/taste";
import { analyzeTasteWithAI } from "@/lib/ai";

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
    const musicPlatform = null;
    const musicProfileUrl = String(body.musicProfileUrl ?? "").trim() || null;
    const artistGenres = Array.isArray(body.artistGenres)
      ? body.artistGenres.slice(0, 5).map((g: unknown) => Array.isArray(g) ? g.map((x: unknown) => String(x)) : [])
      : [];

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

    const taste = getTasteProfile(artists, artistGenres);
    const aiReport = await analyzeTasteWithAI(artists, artistGenres);
    const db = client();

    const { data: existing } = musicProfileUrl
      ? await db
          .from("profiles")
          .select("id, alias, artists, music_platform, music_profile_url, spotify_url, taste_tags, ai_report, created_at")
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
      taste_tags: aiReport?.tags ?? taste.tags,
      ai_report: aiReport
    }).select("id, alias, artists, music_platform, music_profile_url, spotify_url, taste_tags, ai_report, created_at").single();

    if (error) throw error;
    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not save your profile. Check your Supabase settings." }, { status: 500 });
  }
}
