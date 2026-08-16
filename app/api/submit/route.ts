import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyzeTasteWithAI } from "@/lib/ai";
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
      ? body.artists
          .map((x: unknown) => String(x).trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];

    const musicProfileUrl =
      String(body.musicProfileUrl ?? "").trim() || null;

    const artistGenres = Array.isArray(body.artistGenres)
      ? body.artistGenres
          .slice(0, 5)
          .map((g: unknown) =>
            Array.isArray(g)
              ? g.map((x: unknown) => String(x))
              : []
          )
      : [];

    if (artists.length !== 5) {
      return NextResponse.json(
        { error: "Choose exactly 5 artists." },
        { status: 400 }
      );
    }

    if (musicProfileUrl) {
      try {
        const parsed = new URL(musicProfileUrl);

        if (parsed.protocol !== "https:") {
          throw new Error();
        }
      } catch {
        return NextResponse.json(
          { error: "Please paste a valid https profile link." },
          { status: 400 }
        );
      }
    }

    const db = client();

    /*
     * If this music profile already exists,
     * reuse its saved report.
     *
     * If it does not have a report yet,
     * generate one locally using the artists
     * and genre information from the current submission.
     */
    if (musicProfileUrl) {
      const { data: existing, error: existingError } = await db
        .from("profiles")
        .select(
          "id, alias, artists, music_platform, music_profile_url, spotify_url, taste_tags, ai_report, created_at"
        )
        .eq("music_profile_url", musicProfileUrl)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existing) {
        // Already has a report → reuse it.
        if (existing.ai_report) {
          return NextResponse.json({
            profile: existing,
            existing: true,
          });
        }

        /*
         * No saved report yet.
         *
         * IMPORTANT:
         * Do NOT use existing.artist_genres here.
         * That field is not part of the database query.
         *
         * Use the genre information supplied with
         * the current submission instead.
         */
        const aiReport = await analyzeTasteWithAI(
          existing.artists,
          artistGenres
        );

        const { data: updated, error: updateError } = await db
          .from("profiles")
          .update({
            taste_tags: aiReport.tags,
            ai_report: aiReport,
          })
          .eq("id", existing.id)
          .select(
            "id, alias, artists, music_platform, music_profile_url, spotify_url, taste_tags, ai_report, created_at"
          )
          .single();

        if (updateError) {
          throw updateError;
        }

        return NextResponse.json({
          profile: updated,
          existing: true,
          regenerated: true,
        });
      }
    }

    /*
     * Generate the taste report locally.
     * No OpenAI / Doubao / external API credits are required.
     */
    const aiReport = await analyzeTasteWithAI(
      artists,
      artistGenres
    );

    const { data, error } = await db
      .from("profiles")
      .insert({
        alias: makeAlias(),
        artists,
        music_platform: null,
        music_profile_url: musicProfileUrl,
        spotify_url: null,
        taste_tags: aiReport.tags,
        ai_report: aiReport,
      })
      .select(
        "id, alias, artists, music_platform, music_profile_url, spotify_url, taste_tags, ai_report, created_at"
      )
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      profile: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save your profile. Please try again.",
      },
      { status: 500 }
    );
  }
}
