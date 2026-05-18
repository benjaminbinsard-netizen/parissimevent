import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authed(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

const patchSchema = z.object({
  status: z.enum(["new", "read", "archived"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await authed())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 422 });
  }

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ ok: true, lead });
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await authed())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
}
