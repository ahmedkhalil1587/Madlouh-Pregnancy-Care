import { getD1 } from "@/db/raw";
import { PatientRecord, type Pregnancy, type Visit, type LabResult } from "@/components/patient-record-view";

export const dynamic = "force-dynamic";

const pregnancyFields = `id, patient_name as patientName, medical_record_number as medicalRecordNumber,
  age, doctor_name as doctorName, date_of_birth as dateOfBirth, nationality, blood_type as bloodType, rh_factor as rhFactor,
  allergies, chronic_diseases as chronicDiseases, current_medications as currentMedications, gravida, para, abortions,
  living_children as livingChildren, previous_pregnancy_notes as previousPregnancyNotes, past_surgical_history as pastSurgicalHistory,
  last_menstrual_period as lastMenstrualPeriod, estimated_due_date as estimatedDueDate, fetus_count as fetusCount, pregnancy_risk as pregnancyRisk`;
const visitFields = `id, pregnancy_id as pregnancyId, visit_type as visitType, visit_date as visitDate,
  gestational_week as gestationalWeek, visit_number as visitNumber, b_value as bValue, weight_kg as weightKg, blood_pressure as bloodPressure,
  symptoms, fundal_height_cm as fundalHeightCm, ultrasound_summary as ultrasoundSummary, assessment, plan, medications,
  emergency_reason as emergencyReason, emergency_outcome as emergencyOutcome, next_visit_date as nextVisitDate`;

export default async function PatientViewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const inviteCode = code.trim().toUpperCase().slice(0, 40);
  const db = getD1();
  const pregnancy = await db.prepare(`SELECT ${pregnancyFields} FROM pregnancies WHERE invite_code = ?`)
    .bind(inviteCode).first<Pregnancy>();

  if (!pregnancy) {
    return <main className="onboarding"><section className="welcome-card">
      <p className="eyebrow">بكج متابعة الحمل · Pregnancy Follow-up Package</p>
      <h1>الرابط غير صحيح</h1>
      <p>الرمز المستخدم غير صحيح أو لم يعد فعالًا. تأكدي من الرابط مع الطبيبة المتابعة لحالتك.</p>
    </section></main>;
  }

  const [visitsResult, labsResult] = await Promise.all([
    db.prepare(`SELECT ${visitFields} FROM visits WHERE pregnancy_id = ? ORDER BY visit_date DESC, id DESC`).bind(pregnancy.id).all<Visit>(),
    db.prepare(`SELECT id, pregnancy_id as pregnancyId, investigation, examination, result_date as resultDate FROM lab_results WHERE pregnancy_id = ? ORDER BY result_date DESC, id DESC`).bind(pregnancy.id).all<LabResult>(),
  ]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><img className="brand-logo" src="/madlouhmed-logo.jfif" alt="مجمع المدلوح الطبي MadlouhMed" /><div><strong>بكج متابعة الحمل</strong><small>Pregnancy Follow-up Package</small></div></div>
      </header>
      <div className="confidential">سجل للقراءة فقط — لا تشاركي هذا الرابط مع أي شخص آخر</div>
      <PatientRecord pregnancy={pregnancy} visits={visitsResult.results} labs={labsResult.results} />
      <footer>نسخة تجريبية — لا تستخدم للبيانات الطبية الحقيقية قبل اعتمادها رسميًا</footer>
    </main>
  );
}
