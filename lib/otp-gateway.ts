import { env } from "cloudflare:workers";
import { getD1 } from "@/db/raw";

const OTP_TTL_SECONDS = 10 * 60; // 10 دقائق
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

function allowedDomain(): string {
  return (env.ALLOWED_DOCTOR_EMAIL_DOMAIN || "madlouh.com.sa").toLowerCase();
}

export function isAllowedDoctorEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) && normalized.endsWith(`@${allowedDomain()}`);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateCode(): string {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return String(100000 + (buffer[0] % 900000));
}

export async function requestOtp(rawEmail: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = rawEmail.trim().toLowerCase();
  if (!isAllowedDoctorEmail(email)) return { ok: false, error: "البريد يجب أن ينتهي بـ @" + allowedDomain() };

  const db = getD1();
  const now = Math.floor(Date.now() / 1000);
  const existing = await db.prepare("SELECT created_at as createdAt FROM otp_codes WHERE email = ?").bind(email).first<{ createdAt: string }>();
  if (existing && now - Math.floor(new Date(existing.createdAt).getTime() / 1000) < RESEND_COOLDOWN_SECONDS) {
    return { ok: false, error: "الرجاء الانتظار قليلًا قبل طلب رمز جديد" };
  }

  const code = generateCode();
  const codeHash = await sha256Hex(code);
  const expiresAt = now + OTP_TTL_SECONDS;
  await db.prepare(
    "INSERT INTO otp_codes (email, code_hash, expires_at, attempts, created_at) VALUES (?, ?, ?, 0, ?) " +
      "ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0, created_at = excluded.created_at",
  ).bind(email, codeHash, expiresAt, new Date().toISOString()).run();

  const gatewayUrl = env.OTP_GATEWAY_URL;
  const gatewayKey = env.OTP_GATEWAY_API_KEY;
  if (!gatewayUrl || !gatewayKey) return { ok: false, error: "بوابة إرسال الرمز غير مضبوطة" };

  const response = await fetch(gatewayUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Otp-Api-Key": gatewayKey },
    body: JSON.stringify({ email, otp: code, expires_at: expiresAt }),
  });
  if (!response.ok) return { ok: false, error: "تعذر إرسال رمز التحقق، حاولي لاحقًا" };
  return { ok: true };
}

export async function verifyOtp(rawEmail: string, rawCode: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = rawEmail.trim().toLowerCase();
  const code = rawCode.trim();
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "رمز التحقق غير صحيح" };

  const db = getD1();
  const row = await db.prepare("SELECT code_hash as codeHash, expires_at as expiresAt, attempts FROM otp_codes WHERE email = ?")
    .bind(email).first<{ codeHash: string; expiresAt: number; attempts: number }>();
  if (!row) return { ok: false, error: "لا يوجد طلب تحقق نشط لهذا البريد" };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, error: "تجاوزت عدد المحاولات المسموحة، اطلبي رمزًا جديدًا" };
  if (row.expiresAt < Math.floor(Date.now() / 1000)) return { ok: false, error: "انتهت صلاحية الرمز، اطلبي رمزًا جديدًا" };

  const codeHash = await sha256Hex(code);
  if (codeHash !== row.codeHash) {
    await db.prepare("UPDATE otp_codes SET attempts = attempts + 1 WHERE email = ?").bind(email).run();
    return { ok: false, error: "رمز التحقق غير صحيح" };
  }
  await db.prepare("DELETE FROM otp_codes WHERE email = ?").bind(email).run();
  return { ok: true };
}
