import { getD1 } from "@/db/raw";
import { getSessionUser } from "@/app/auth";

export async function currentAppUser() {
  const auth = await getSessionUser();
  if (!auth) return { auth: null, app: null };
  const app = await getD1().prepare("SELECT auth_user_id as authUserId, email, display_name as displayName, role FROM users WHERE auth_user_id = ?")
    .bind(auth.userId).first<{ authUserId: string; email: string; displayName: string; role: "doctor" }>();
  return { auth, app };
}
export function jsonError(message: string, status = 400) { return Response.json({ error: message }, { status }); }
export function clean(value: unknown, max = 2000) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
export function intValue(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? Math.round(parsed) : fallback; }
