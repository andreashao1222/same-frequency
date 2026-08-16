import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";

function authorized(req: Request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const cookie = req.headers.get("cookie")?.match(/(?:^|; )sf_admin=([^;]+)/)?.[1] ?? "";
  const expected = createHmac("sha256", password).update("same-frequency-admin-session").digest("hex");
  const a = Buffer.from(cookie);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured." }, { status: 503 });
  }

  const { data, error } = await adminDb()
    .from("profiles")
    .select("id, alias, artists, music_platform, music_profile_url, spotify_url, taste_tags, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profiles: data ?? [] });
}
