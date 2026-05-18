// Lightweight signed-cookie session for the single admin.
// Uses Web Crypto (HMAC-SHA256) so it works in both the Node.js
// runtime (route handlers) and the Edge runtime (middleware).

export const COOKIE_NAME = "psm_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 h

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET manquant ou trop court (voir .env).");
  }
  return s;
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return b64urlEncode(new Uint8Array(sig));
}

/** Build a signed token. Payload carries an expiry timestamp. */
export async function createSessionToken(): Promise<string> {
  const payload = b64urlEncode(
    new TextEncoder().encode(
      JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      }),
    ),
  );
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

/** Constant-time-ish verification of token signature + expiry. */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;

  const expected = await hmac(payload);
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) return false;

  try {
    const data = JSON.parse(
      new TextDecoder().decode(b64urlDecode(payload)),
    ) as { exp?: number };
    return typeof data.exp === "number" && data.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
