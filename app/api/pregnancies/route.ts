import { getD1 } from "@/db/raw";
import { currentAppUser, jsonError, clean, intValue } from "../_shared";
function inviteCode() { return crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase(); }
export async function POST(request: Request) {
  const { auth, app } = await currentAppUser();
  if (!auth || app?.role !== "doctor") return jsonError("غير مصرح", 403);
  const b = await request.json() as Record<string, unknown>;
  const required = ["patientName", "medicalRecordNumber", "age", "nationality", "doctorName", "lastMenstrualPeriod", "estimatedDueDate"];
  if (required.some((key) => !clean(b[key]))) return jsonError("يرجى تعبئة جميع الحقول الأساسية");
  try {
    await getD1().prepare(`INSERT INTO pregnancies (patient_name, medical_record_number, age, doctor_name, mobile, date_of_birth, nationality,
      blood_type, rh_factor, height_cm, pre_pregnancy_weight_kg, allergies, chronic_diseases, current_medications,
      gravida, para, abortions, living_children, previous_pregnancy_notes, past_surgical_history, last_menstrual_period, estimated_due_date,
      fetus_count, pregnancy_risk, doctor_user_id, invite_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(clean(b.patientName, 200), clean(b.medicalRecordNumber, 80), intValue(b.age), clean(b.doctorName, 200), clean(b.mobile, 30), "", clean(b.nationality, 80),
        clean(b.bloodType, 8), clean(b.rhFactor, 8), intValue(b.heightCm) || null, clean(b.prePregnancyWeightKg, 20), clean(b.allergies),
        clean(b.chronicDiseases), clean(b.currentMedications), intValue(b.gravida, 1), intValue(b.para), intValue(b.abortions), intValue(b.livingChildren),
        clean(b.previousPregnancyNotes), clean(b.pastSurgicalHistory), clean(b.lastMenstrualPeriod, 20), clean(b.estimatedDueDate, 20), intValue(b.fetusCount, 1),
        clean(b.pregnancyRisk, 30) || "منخفض", auth.userId, inviteCode(), new Date().toISOString()).run();
    return Response.json({ ok: true });
  } catch { return jsonError("رقم الملف مستخدم مسبقًا أو تعذر الحفظ", 409); }
}
