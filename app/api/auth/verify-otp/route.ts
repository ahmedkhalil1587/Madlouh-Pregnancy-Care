import { jsonError, clean } from "../../_shared";
import { verifyOtp } from "@/lib/otp-gateway";
import { createSessionCookieValue, sessionCookieHeader } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const email = clean(body.email, 200).toLowerCase();
  const code = clean(body.code, 10);
  if (!email || !code) return jsonError("البريد ورمز التحقق مطلوبان");

  const result = await verifyOtp(email, code);
  if (!result.ok) return jsonError(result.error, 401);

  const cookieValue = await createSessionCookieValue(email);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Set-Cookie": sessionCookieHeader(cookieValue) },
  });
}
