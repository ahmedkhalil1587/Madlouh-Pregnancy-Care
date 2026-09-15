"use client";

import { useMemo } from "react";
import { HeartPulse, LockKeyhole, TriangleAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export type Pregnancy = Record<string, string | number | null> & {
  id: number; patientName: string; medicalRecordNumber: string; estimatedDueDate: string; lastMenstrualPeriod: string;
  inviteCode?: string; patientUserId?: string | null;
};
export type Visit = Record<string, string | number | null> & {
  id: number; pregnancyId: number; visitType: "monthly" | "emergency"; visitDate: string; gestationalWeek: number; visitNumber: number;
};
export type LabResult = { id: number; pregnancyId: number; investigation: string; examination: string; resultDate: string };

export const investigations = [
  ["BLOOD GROUP", "فصيلة الدم"], ["RH", "عامل ريسوس"], ["RUBELLA IgG", "مناعة الحصبة الألمانية"],
  ["VDRL", "فحص الزهري"], ["HbsAg", "التهاب الكبد ب"], ["Toxoplasma IgG", "داء المقوسات"],
  ["CBC 1", "صورة دم كاملة 1"], ["CBC 2", "صورة دم كاملة 2"], ["CBC 3", "صورة دم كاملة 3"],
  ["BLOOD SUGAR 1", "سكر الدم 1"], ["BLOOD SUGAR 2", "سكر الدم 2"], ["BLOOD SUGAR 3", "سكر الدم 3"],
  ["URINE ANALYSIS 1", "تحليل البول 1"], ["URINE ANALYSIS 2", "تحليل البول 2"], ["URINE ANALYSIS 3", "تحليل البول 3"],
] as const;

export function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

export function Info({ label, value }: { label: string; value: unknown }) {
  return <div className="info"><small>{label}</small><strong>{String(value || "—")}</strong></div>;
}

export function RecordHeader({ pregnancy }: { pregnancy: Pregnancy }) {
  return <div className="record-header">
    <div><p className="eyebrow">ملف الحمل</p><h1>{pregnancy.patientName}</h1><p>رقم الملف {pregnancy.medicalRecordNumber} · موعد الولادة المتوقع {formatDate(pregnancy.estimatedDueDate)}</p></div>
    {pregnancy.inviteCode && <div className="invite"><small>رمز ربط المراجعة</small><strong>{pregnancy.inviteCode}</strong><Badge variant="outline">{pregnancy.patientUserId ? "تم الربط" : "بانتظار الربط"}</Badge></div>}
  </div>;
}

export function VisitCard({ visit: v }: { visit: Visit }) {
  const rows = [["الشكوى - C/O", v.symptoms], ["ضغط الدم - BP", v.bloodPressure], ["B", v.bValue], ["الوزن - WT", v.weightKg && `${v.weightKg} كجم`], ["الفحص - Examination", v.assessment], ["الاستقصاءات - Investigation", v.labResults], ["العلاج - Treatment", v.medications], ["الموعد القادم", v.nextVisitDate && formatDate(String(v.nextVisitDate))]];
  return <article className={v.visitType === "emergency" ? "visit emergency" : "visit"}>
    <div className="visit-head"><span>{v.visitType === "emergency" ? <TriangleAlert /> : <HeartPulse />}</span>
      <div><Badge variant={v.visitType === "emergency" ? "destructive" : "secondary"}>{v.visitType === "emergency" ? "طوارئ - Emergency" : `VISIT ${v.visitNumber || ""} - الزيارة ${v.visitNumber || ""}`}</Badge><h3>{formatDate(v.visitDate)}</h3></div>
      <LockKeyhole className="locked" /></div>
    {v.visitType === "emergency" && <div className="emergency-note"><b>سبب الزيارة:</b> {v.emergencyReason || "—"}<br/><b>الإجراء والنتيجة:</b> {v.emergencyOutcome || "—"}</div>}
    <div className="visit-grid">{rows.filter(([, value]) => value).map(([label, value]) => <Info key={String(label)} label={String(label)} value={value} />)}</div>
  </article>;
}

export function LabSection({ pregnancyId, labs, canAdd = false, run, saving = false }: { pregnancyId: number; labs: LabResult[]; canAdd?: boolean; run?: Function; saving?: boolean }) {
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    run?.("/api/labs", { ...Object.fromEntries(new FormData(e.currentTarget).entries()), pregnancyId }, "تم حفظ نتيجة التحليل وقفلها نهائيًا", e.currentTarget);
  };
  return <section className="timeline lab-section">
    <div className="section-heading"><div><h2>نتائج التحاليل - LAB RESULTS</h2><p>كل نتيجة جديدة تُضاف دون حذف النتائج السابقة</p></div><Badge variant="secondary">{labs.length} نتيجة</Badge></div>
    {canAdd && <form className="lab-form" onSubmit={submit}>
      <label className="field"><span>التحليل - Investigation *</span><select name="investigation" required>{investigations.map(([en, ar]) => <option value={en} key={en}>{en} - {ar}</option>)}</select></label>
      <label className="field"><span>النتيجة - Examination *</span><input name="examination" required /></label>
      <label className="field"><span>التاريخ - Date DD/MM/YY *</span><input name="resultDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
      <button className="primary" disabled={saving}><LockKeyhole />حفظ النتيجة</button>
    </form>}
    <div className="lab-table"><div className="lab-row lab-head"><b>التحليل<br/>Investigation</b><b>النتيجة<br/>Examination</b><b>التاريخ<br/>Date DD/MM/YY</b></div>
      {investigations.map(([en, ar]) => {
        const entries = labs.filter((lab) => lab.investigation === en);
        return <div className="lab-row" key={en}><strong>{en}<small>{ar}</small></strong>
          <span>{entries.length ? entries.map((entry) => <em key={entry.id}>{entry.examination}</em>) : <i>لم تُسجل نتيجة<br/>Not entered yet</i>}</span>
          <time>{entries.length ? entries.map((entry) => <em key={entry.id}>{formatDate(entry.resultDate)}</em>) : "—"}</time></div>;
      })}
    </div>
  </section>;
}

export function PatientRecord({ pregnancy, visits, labs, compact = false }: { pregnancy: Pregnancy; visits: Visit[]; labs: LabResult[]; compact?: boolean }) {
  const week = useMemo(() => Math.max(1, Math.min(40, Math.floor((Date.now() - new Date(pregnancy.lastMenstrualPeriod).getTime()) / 604800000) + 1)), [pregnancy.lastMenstrualPeriod]);
  const monthlyVisits = visits.filter((v) => v.visitType === "monthly").sort((a, b) => a.visitDate.localeCompare(b.visitDate)).map((v, index) => ({ ...v, visitNumber: v.visitNumber || index + 1 }));
  const emergencyVisits = visits.filter((v) => v.visitType === "emergency");
  return <div className={compact ? "patient-view compact" : "patient-view"}>{!compact && <RecordHeader pregnancy={pregnancy} />}
    <section className="journey"><div className="journey-top"><div><p className="eyebrow">رحلة الحمل</p><h2>الأسبوع {week} من 40</h2></div><strong>{Math.ceil(week / 4.4)}<small>الشهر</small></strong></div><Progress value={(week / 40) * 100} /><div className="months">{Array.from({ length: 9 }, (_, i) => <span key={i} className={i < Math.ceil(week / 4.4) ? "done" : ""}>{i + 1}</span>)}</div></section>
    <section className="info-grid"><Info label="العمر - Age" value={pregnancy.age} /><Info label="الجنسية - Nationality" value={pregnancy.nationality} /><Info label="الطبيب - Doctor" value={pregnancy.doctorName} /><Info label="آخر دورة - LMP" value={formatDate(pregnancy.lastMenstrualPeriod)} /><Info label="موعد الولادة - EDD" value={formatDate(pregnancy.estimatedDueDate)} /><Info label="التاريخ الولادي G / P / +" value={`${pregnancy.gravida || 0} / ${pregnancy.para || 0} / ${pregnancy.abortions || 0}`} /><Info label="التاريخ المرضي السابق" value={pregnancy.chronicDiseases || "لا يوجد مسجل"} /><Info label="التاريخ الجراحي السابق" value={pregnancy.pastSurgicalHistory || "لا يوجد مسجل"} /><Info label="ملاحظات التاريخ الولادي" value={pregnancy.previousPregnancyNotes || "لا يوجد مسجل"} /></section>
    <section className="timeline"><div className="section-heading"><div><h2>زيارات متابعة الحمل - A.N.C Visits</h2><p>10 زيارات ثابتة؛ كل زيارة محفوظة للقراءة فقط</p></div><Badge variant="secondary">{monthlyVisits.length} / 10</Badge></div>
      <div className="visit-slots">{Array.from({ length: 10 }, (_, index) => { const item = monthlyVisits.find((v) => v.visitNumber === index + 1); return item ? <VisitCard key={item.id} visit={item} /> : <div className="empty-visit" key={index}><span>{index + 1}</span><div><b>VISIT {index + 1} - الزيارة {index + 1}</b><small>بانتظار إضافة الطبيب - Not entered yet</small></div><LockKeyhole /></div>; })}</div>
    </section>
    {emergencyVisits.length > 0 && <section className="timeline emergency-list"><div className="section-heading"><div><h2>زيارات الطوارئ - Emergency Visits</h2><p>سجل إضافي مستقل لا يؤثر على الزيارات العشر</p></div><Badge variant="destructive">{emergencyVisits.length}</Badge></div>{emergencyVisits.map((v) => <VisitCard key={v.id} visit={v} />)}</section>}
    <LabSection pregnancyId={pregnancy.id} labs={labs} />
  </div>;
}
