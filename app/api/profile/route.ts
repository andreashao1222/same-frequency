import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function client() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing profile id." }, { status: 400 });

  const { data, error } = await client()
    .from("profiles")
    .select("id, alias, artists, music_platform, music_profile_url, spotify_url, taste_tags, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  return NextResponse.json({ profile: data });
}
