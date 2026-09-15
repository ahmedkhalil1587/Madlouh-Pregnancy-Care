import { getD1 } from "@/db/raw";
import { currentAppUser, jsonError, clean, intValue } from "../_shared";
export async function POST(request: Request) {
  const { auth, app } = await currentAppUser();
  if (!auth || app?.role !== "doctor") return jsonError("غير مصرح", 403);
  const b = await request.json() as Record<string, unknown>;
  const pregnancyId = intValue(b.pregnancyId);
  const owns = await getD1().prepare("SELECT id, last_menstrual_period as lmp FROM pregnancies WHERE id = ? AND doctor_user_id = ?")
    .bind(pregnancyId, auth.userId).first<{ id: number; lmp: string }>();
  if (!owns) return jsonError("ملف الحمل غير موجود", 404);
  const type = b.visitType === "emergency" ? "emergency" : "monthly";
  if (!clean(b.visitDate)) return jsonError("تاريخ الزيارة مطلوب");
  const countRow = await getD1().prepare("SELECT COUNT(*) as total FROM visits WHERE pregnancy_id = ? AND visit_type = 'monthly'")
    .bind(pregnancyId).first<{ total: number }>();
  const visitNumber = type === "monthly" ? Number(countRow?.total || 0) + 1 : 0;
  if (type === "monthly" && visitNumber > 10) return jsonError("اكتملت زيارات المتابعة العشر لهذا الملف", 409);
  const visitTime = new Date(`${clean(b.visitDate, 20)}T12:00:00`).getTime();
  const lmpTime = new Date(`${owns.lmp}T12:00:00`).getTime();
  const gestationalWeek = Number.isFinite(visitTime - lmpTime) ? Math.max(1, Math.min(42, Math.floor((visitTime - lmpTime) / 604800000) + 1)) : 1;
  await getD1().prepare(`INSERT INTO visits (pregnancy_id, visit_type, visit_date, gestational_week, visit_number, b_value, weight_kg, blood_pressure,
    pulse, temperature, symptoms, fetal_heart_rate, fetal_movement, fundal_height_cm, fetal_presentation, ultrasound_summary,
    lab_results, assessment, plan, medications, emergency_reason, emergency_outcome, next_visit_date, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(pregnancyId, type, clean(b.visitDate, 20), gestationalWeek, visitNumber, clean(b.bValue, 100), clean(b.weightKg, 20), clean(b.bloodPressure, 20),
      null, "", clean(b.complaint), null, "", "", "", "", clean(b.investigation, 5000), clean(b.examination), "",
      clean(b.treatment), clean(b.emergencyReason),
      clean(b.emergencyOutcome), clean(b.nextVisitDate, 20) || null, auth.userId, new Date().toISOString()).run();
  return Response.json({ ok: true, locked: true });
}
