import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

function expectedToken(password: string) {
  return createHmac("sha256", password).update("same-frequency-admin-session").digest("hex");
}

export async function POST(req: Request) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) {
    return NextResponse.json({ error: "Admin password is not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const password = String(body.password ?? "");
  const a = Buffer.from(password);
  const b = Buffer.from(configured);
  const valid = a.length === b.length && timingSafeEqual(a, b);

  if (!valid) return NextResponse.json({ error: "Incorrect password." }, { status: 401 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("sf_admin", expectedToken(configured), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
