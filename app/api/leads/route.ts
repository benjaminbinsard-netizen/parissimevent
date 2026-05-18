import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authed(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function GET() {
  if (!(await authed())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const [leads, newCount, readCount, archivedCount] = await Promise.all([
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.lead.count({ where: { status: "new" } }),
    prisma.lead.count({ where: { status: "read" } }),
    prisma.lead.count({ where: { status: "archived" } }),
  ]);

  return NextResponse.json({
    ok: true,
    leads,
    counts: {
      new: newCount,
      read: readCount,
      archived: archivedCount,
      total: newCount + readCount + archivedCount,
    },
    serverTime: new Date().toISOString(),
  });
}
