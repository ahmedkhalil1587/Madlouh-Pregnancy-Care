import { getD1, getSetupCode } from "@/db/raw";
import { currentAppUser, jsonError, clean } from "../_shared";
export async function POST(request: Request) {
  const { auth, app } = await currentAppUser();
  if (!auth) return jsonError("يلزم تسجيل الدخول", 401);
  if (app) return jsonError("الحساب مفعّل مسبقًا");
  const body = await request.json() as Record<string, unknown>;
  if (!getSetupCode() || clean(body.code, 100) !== getSetupCode()) return jsonError("رمز تفعيل الطبيب غير صحيح", 403);
  await getD1().prepare("INSERT INTO users (auth_user_id, email, display_name, role, created_at) VALUES (?, ?, ?, 'doctor', ?)")
    .bind(auth.userId, auth.email, auth.displayName, new Date().toISOString()).run();
  return Response.json({ ok: true });
}
