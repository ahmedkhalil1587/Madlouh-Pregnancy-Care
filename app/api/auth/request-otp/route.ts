import { jsonError, clean } from "../../_shared";
import { requestOtp } from "@/lib/otp-gateway";

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const email = clean(body.email, 200);
  if (!email) return jsonError("البريد الإلكتروني مطلوب");
  const result = await requestOtp(email);
  if (!result.ok) return jsonError(result.error, 429);
  return Response.json({ ok: true });
}
