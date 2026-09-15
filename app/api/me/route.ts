import { getD1 } from "@/db/raw";
import { currentAppUser, jsonError } from "../_shared";

const pregnancyFields = `id, patient_name as patientName, medical_record_number as medicalRecordNumber,
  age, doctor_name as doctorName, date_of_birth as dateOfBirth, nationality, blood_type as bloodType, rh_factor as rhFactor, height_cm as heightCm,
  pre_pregnancy_weight_kg as prePregnancyWeightKg, allergies, chronic_diseases as chronicDiseases,
  current_medications as currentMedications, gravida, para, abortions, living_children as livingChildren,
  previous_pregnancy_notes as previousPregnancyNotes, past_surgical_history as pastSurgicalHistory, last_menstrual_period as lastMenstrualPeriod,
  estimated_due_date as estimatedDueDate, fetus_count as fetusCount, pregnancy_risk as pregnancyRisk, created_at as createdAt`;
const visitFields = `id, pregnancy_id as pregnancyId, visit_type as visitType, visit_date as visitDate,
  gestational_week as gestationalWeek, visit_number as visitNumber, b_value as bValue, weight_kg as weightKg, blood_pressure as bloodPressure, pulse, temperature,
  symptoms, fetal_heart_rate as fetalHeartRate, fetal_movement as fetalMovement, fundal_height_cm as fundalHeightCm,
  fetal_presentation as fetalPresentation, ultrasound_summary as ultrasoundSummary, lab_results as labResults,
  assessment, plan, medications, emergency_reason as emergencyReason, emergency_outcome as emergencyOutcome,
  next_visit_date as nextVisitDate, created_at as createdAt`;

export async function GET() {
  const { auth, app } = await currentAppUser();
  if (!auth) return jsonError("يلزم تسجيل الدخول", 401);
  if (!app) return Response.json({ user: { displayName: auth.displayName, email: auth.email, role: null } });
  const db = getD1();
  const pregnancyResult = await db.prepare(`SELECT ${pregnancyFields}, mobile, invite_code as inviteCode FROM pregnancies WHERE doctor_user_id = ? ORDER BY created_at DESC`)
    .bind(auth.userId).all();
  const pregnancies = pregnancyResult.results as { id: number }[];
  let visits: unknown[] = [];
  let labs: unknown[] = [];
  if (pregnancies.length) {
    const placeholders = pregnancies.map(() => "?").join(",");
    const result = await db.prepare(`SELECT ${visitFields} FROM visits WHERE pregnancy_id IN (${placeholders}) ORDER BY visit_date DESC, id DESC`)
      .bind(...pregnancies.map((p) => p.id)).all();
    visits = result.results;
    const labResult = await db.prepare(`SELECT id, pregnancy_id as pregnancyId, investigation, examination,
      result_date as resultDate, created_at as createdAt FROM lab_results WHERE pregnancy_id IN (${placeholders})
      ORDER BY result_date DESC, id DESC`).bind(...pregnancies.map((p) => p.id)).all();
    labs = labResult.results;
  }
  return Response.json({ user: app, pregnancies, visits, labs });
}
