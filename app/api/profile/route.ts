import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyzeTasteWithAI } from "@/lib/ai";

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing profile id." }, { status: 400 });

  const db = client();

  const { data, error } = await db
    .from("profiles")
    .select("id, alias, artists, music_platform, music_profile_url, spotify_url, taste_tags, ai_report, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  // Old profiles created before the AI version may not have ai_report.
  // Generate it on first view instead of falling back to the old hardcoded
  // indie/alternative system.
  if (!data.ai_report && Array.isArray(data.artists) && data.artists.length === 5) {
    try {
      const aiReport = await analyzeTasteWithAI(data.artists);
      const { data: updated, error: updateError } = await db
        .from("profiles")
        .update({
          taste_tags: aiReport.tags,
          ai_report: aiReport
        })
        .eq("id", id)
        .select("id, alias, artists, music_platform, music_profile_url, spotify_url, taste_tags, ai_report, created_at")
        .single();

      if (updateError) throw updateError;
      return NextResponse.json({ profile: updated, regenerated: true });
    } catch (regenerationError) {
      console.error("AI profile regeneration failed:", regenerationError);
      return NextResponse.json(
        { error: regenerationError instanceof Error ? regenerationError.message : "AI taste report is unavailable." },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ profile: data });
}
