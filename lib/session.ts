import { env } from "cloudflare:workers";

export const SESSION_COOKIE = "madlouh_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 يوم

function getSecret(): string {
  const secret = env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("SESSION_SECRET غير مضبوط بشكل صحيح");
  return secret;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

// جلسة الطبيبة الموقّعة: base64(email).expiry.hmac — بدون حالة مخزّنة على الخادم.
export async function createSessionCookieValue(email: string): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${btoa(email)}.${expiresAt}`;
  const signature = await hmac(payload);
  return `${payload}.${signature}`;
}

export async function verifySessionCookieValue(value: string | undefined | null): Promise<string | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [encodedEmail, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return null;
  const expectedSignature = await hmac(`${encodedEmail}.${expiresAtRaw}`);
  if (expectedSignature !== signature) return null;
  try {
    return atob(encodedEmail);
  } catch {
    return null;
  }
}

export function sessionCookieHeader(value: string): string {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
