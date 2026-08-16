import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rebuildLocalReport } from "@/lib/ai";

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

  // Older profiles may not have a saved report. Rebuild it locally from the
  // stored artist names instead of calling an external AI API.
  if (!data.ai_report && Array.isArray(data.artists) && data.artists.length === 5) {
    try {
      const report = rebuildLocalReport(data.artists, Array.isArray(data.taste_tags) ? data.taste_tags : []);
      const { data: updated, error: updateError } = await db
        .from("profiles")
        .update({ taste_tags: report.tags, ai_report: report })
        .eq("id", id)
        .select("id, alias, artists, music_platform, music_profile_url, spotify_url, taste_tags, ai_report, created_at")
        .single();
      if (updateError) throw updateError;
      return NextResponse.json({ profile: updated, regenerated: true });
    } catch (regenerationError) {
      console.error("Local profile regeneration failed:", regenerationError);
      return NextResponse.json(
        { error: regenerationError instanceof Error ? regenerationError.message : "Could not build taste report." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ profile: data });
}
