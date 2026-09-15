import { getD1 } from "@/db/raw";
import { currentAppUser, jsonError, clean, intValue } from "../_shared";

export async function POST(request: Request) {
  const { auth, app } = await currentAppUser();
  if (!auth || app?.role !== "doctor") return jsonError("غير مصرح", 403);
  const body = await request.json() as Record<string, unknown>;
  const pregnancyId = intValue(body.pregnancyId);
  const owns = await getD1().prepare("SELECT id FROM pregnancies WHERE id = ? AND doctor_user_id = ?")
    .bind(pregnancyId, auth.userId).first();
  if (!owns) return jsonError("ملف الحمل غير موجود", 404);
  const investigation = clean(body.investigation, 200);
  const examination = clean(body.examination, 2000);
  const resultDate = clean(body.resultDate, 20);
  if (!investigation || !examination || !resultDate) return jsonError("اسم التحليل والنتيجة والتاريخ مطلوبة");
  await getD1().prepare(`INSERT INTO lab_results (pregnancy_id, investigation, examination, result_date, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)`).bind(pregnancyId, investigation, examination, resultDate, auth.userId, new Date().toISOString()).run();
  return Response.json({ ok: true, locked: true });
}
