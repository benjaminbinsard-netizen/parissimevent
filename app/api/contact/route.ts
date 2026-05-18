import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import {
  clientConfirmationEmail,
  internalNotificationEmail,
  type LeadData,
} from "@/lib/emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(80),
  lastName: z.string().trim().min(1, "Nom requis").max(80),
  email: z.string().trim().email("Email invalide").max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  type: z.string().trim().min(1, "Nature du projet requise").max(80),
  message: z.string().trim().min(1, "Message requis").max(5000),
  // Honeypot : accepté par le schéma mais traité plus bas — un bot qui
  // le remplit reçoit une réponse "ok" sans que rien soit enregistré.
  website: z.string().max(200).optional(),
});

function clientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Requête invalide." },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, error: first?.message ?? "Données invalides." },
      { status: 422 },
    );
  }

  const data = parsed.data;

  // Honeypot rempli -> on répond OK sans rien enregistrer (anti-bot).
  if (data.website && data.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const ip = clientIp(req);

  // Anti-spam léger : pas deux envois de la même IP en moins de 20 s.
  if (ip) {
    const recent = await prisma.lead.findFirst({
      where: { ip, createdAt: { gt: new Date(Date.now() - 20_000) } },
      select: { id: true },
    });
    if (recent) {
      return NextResponse.json(
        { ok: false, error: "Demande déjà envoyée. Merci de patienter." },
        { status: 429 },
      );
    }
  }

  const lead = await prisma.lead.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      type: data.type,
      message: data.message,
      ip,
    },
  });

  // Emails — best effort, n'empêchent jamais le succès de la demande.
  const leadData: LeadData = lead;
  const siteUrl = process.env.PUBLIC_SITE_URL || new URL(req.url).origin;

  const clientMail = clientConfirmationEmail(leadData);
  const internalMail = internalNotificationEmail(
    leadData,
    `${siteUrl}/admin`,
  );

  await Promise.allSettled([
    sendMail({
      to: lead.email,
      subject: clientMail.subject,
      html: clientMail.html,
    }),
    sendMail({
      to: process.env.NOTIFY_EMAIL || "contact@parissim-event.fr",
      subject: internalMail.subject,
      html: internalMail.html,
      replyTo: lead.email,
    }),
  ]);

  return NextResponse.json({ ok: true });
}
