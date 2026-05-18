// Email-safe HTML templates (table layout + inline styles) — pensés
// pour un rendu impeccable sur Gmail, Apple Mail, Outlook.

export type LeadData = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  type: string;
  message: string;
  createdAt: Date;
};

const BRONZE = "#b09472";
const BRONZE_LIGHT = "#c9ad88";
const BG = "#0c0a08";
const SURFACE = "#15110c";
const TEXT = "#ece3d0";
const DIM = "#95897a";
const LINE = "rgba(232,220,199,0.12)";

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function frDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(d);
}

function shell(inner: string): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light"></head>
<body style="margin:0;padding:0;background:${BG};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${SURFACE};border:1px solid ${LINE};border-radius:18px;overflow:hidden;">
${inner}
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="padding:22px 8px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#5a5247;">
Maison Parissim · Paris · Saint-Tropez · Côte d'Azur
</td></tr></table>
</td></tr></table></body></html>`;
}

function header(): string {
  return `<tr><td style="padding:40px 44px 28px;border-bottom:1px solid ${LINE};">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;color:${TEXT};letter-spacing:.5px;">
Maison <span style="color:${BRONZE_LIGHT};font-style:italic;">Parissim</span>.</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${DIM};margin-top:8px;">
Événementiel &amp; communication d'exception</div>
</td></tr>`;
}

/** Email de confirmation envoyé au client. */
export function clientConfirmationEmail(lead: LeadData): {
  subject: string;
  html: string;
} {
  const subject = "Votre demande a bien été reçue — Maison Parissim";
  const html = shell(`
${header()}
<tr><td style="padding:40px 44px;font-family:Arial,Helvetica,sans-serif;color:${TEXT};">
  <p style="margin:0 0 22px;font-family:Georgia,serif;font-size:21px;line-height:1.4;color:${TEXT};">
    ${esc(lead.firstName)}, votre message<br><span style="color:${BRONZE_LIGHT};font-style:italic;">nous est bien parvenu.</span>
  </p>
  <p style="margin:0 0 18px;font-size:14.5px;line-height:1.75;color:${DIM};">
    Nous vous remercions de la confiance que vous accordez à la maison.
    Votre demande a été transmise à notre équipe : un membre de la Maison
    Parissim reviendra vers vous <strong style="color:${TEXT};">personnellement
    sous vingt-quatre heures</strong> afin d'échanger sur votre projet.
  </p>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    style="margin:28px 0;border:1px solid ${LINE};border-radius:12px;">
    <tr><td style="padding:20px 22px;">
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${DIM};margin-bottom:12px;">
        Récapitulatif de votre demande</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13.5px;color:${TEXT};">
        <tr><td style="padding:5px 0;color:${DIM};width:120px;">Nature</td>
            <td style="padding:5px 0;">${esc(lead.type)}</td></tr>
        <tr><td style="padding:5px 0;color:${DIM};">Reçue le</td>
            <td style="padding:5px 0;">${frDate(lead.createdAt)}</td></tr>
      </table>
      <div style="border-top:1px solid ${LINE};margin:14px 0 12px;"></div>
      <div style="font-size:13.5px;line-height:1.7;color:${DIM};white-space:pre-wrap;">${esc(
        lead.message,
      )}</div>
    </td></tr>
  </table>

  <p style="margin:0 0 6px;font-size:14.5px;line-height:1.75;color:${DIM};">
    Pour toute précision, vous pouvez simplement répondre à cet email.
  </p>
  <p style="margin:26px 0 0;font-family:Georgia,serif;font-size:15px;color:${TEXT};">
    Avec toute notre considération,<br>
    <span style="color:${BRONZE_LIGHT};font-style:italic;">La Maison Parissim</span>
  </p>
</td></tr>`);
  return { subject, html };
}

/** Notification interne envoyée à l'équipe. */
export function internalNotificationEmail(
  lead: LeadData,
  dashboardUrl: string,
): { subject: string; html: string } {
  const subject = `Nouvelle demande · ${lead.firstName} ${lead.lastName} — ${lead.type}`;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:7px 0;color:${DIM};width:130px;font-size:13px;">${label}</td>
     <td style="padding:7px 0;color:${TEXT};font-size:13.5px;">${value}</td></tr>`;
  const html = shell(`
${header()}
<tr><td style="padding:36px 44px;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:inline-block;font-size:10px;letter-spacing:2px;text-transform:uppercase;
    color:#1a1409;background:${BRONZE};padding:5px 12px;border-radius:999px;margin-bottom:22px;">
    Nouvelle demande</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${row("Nom", `${esc(lead.firstName)} ${esc(lead.lastName)}`)}
    ${row("Email", `<a href="mailto:${esc(lead.email)}" style="color:${BRONZE_LIGHT};">${esc(lead.email)}</a>`)}
    ${row("Téléphone", lead.phone ? `<a href="tel:${esc(lead.phone)}" style="color:${BRONZE_LIGHT};">${esc(lead.phone)}</a>` : "—")}
    ${row("Nature", esc(lead.type))}
    ${row("Reçue le", frDate(lead.createdAt))}
  </table>
  <div style="border-top:1px solid ${LINE};margin:20px 0;"></div>
  <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${DIM};margin-bottom:10px;">Message</div>
  <div style="font-size:14px;line-height:1.7;color:${TEXT};white-space:pre-wrap;">${esc(lead.message)}</div>
  <div style="margin-top:30px;">
    <a href="${esc(dashboardUrl)}" style="display:inline-block;background:${BRONZE};color:#1a1409;
      font-size:13px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:9px;">
      Ouvrir le dashboard →</a>
  </div>
</td></tr>`);
  return { subject, html };
}
