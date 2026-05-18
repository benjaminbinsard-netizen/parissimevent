import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, COOKIE_NAME, cookieOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_PASSWORD non configuré côté serveur." },
      { status: 500 },
    );
  }

  if (!parsed.success || parsed.data.password !== expected) {
    // Petit délai pour ralentir le brute force.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json(
      { ok: false, error: "Mot de passe incorrect." },
      { status: 401 },
    );
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, cookieOptions);
  return res;
}
