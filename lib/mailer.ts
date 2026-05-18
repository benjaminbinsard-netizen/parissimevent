import nodemailer from "nodemailer";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

function getTransport() {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null; // SMTP non configuré -> on n'envoie rien.

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER || process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
}

/**
 * Sends an email. Never throws: a mail failure must not break the
 * contact submission (the lead is already stored). Returns a status.
 */
export async function sendMail(
  args: SendArgs,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const transport = getTransport();
  if (!transport) {
    console.warn(
      `[mailer] SMTP non configuré — email "${args.subject}" non envoyé à ${args.to}.`,
    );
    return { ok: false, skipped: true };
  }

  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM || "Maison Parissim <no-reply@localhost>",
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
    });
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(`[mailer] échec d'envoi à ${args.to}:`, error);
    return { ok: false, error };
  }
}
