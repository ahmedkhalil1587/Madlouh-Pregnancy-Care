"use client";

import { FormEvent, useEffect, useState } from "react";
import { Baby, CalendarDays, ClipboardPlus, HeartPulse, LockKeyhole, LogOut, Plus, ShieldCheck, TriangleAlert, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientRecord, RecordHeader, LabSection, type Pregnancy, type Visit, type LabResult } from "@/components/patient-record-view";

type Role = "doctor" | null;
type Dashboard = { user: { displayName: string; email: string; role: Role }; pregnancies?: Pregnancy[]; visits?: Visit[]; labs?: LabResult[] };

const fieldClass = "field";
const today = new Date().toISOString().slice(0, 10);

async function api(path: string, body?: Record<string, unknown>) {
  const response = await fetch(path, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(String(data.error || "تعذر إتمام العملية"));
  return data;
}

function collect(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

export default function PregnancyApp({ authName }: { authName: string }) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const next = await api("/api/me") as unknown as Dashboard;
      setData(next);
      if (!selectedId && next.pregnancies?.length) setSelectedId(next.pregnancies[0].id);
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر تحميل الملف"); }
  };
  useEffect(() => { void load(); }, []);

  const run = async (path: string, payload: Record<string, unknown>, success: string, form?: HTMLFormElement) => {
    setSaving(true); setError(""); setNotice("");
    try { await api(path, payload); setNotice(success); form?.reset(); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "تعذر الحفظ"); }
    finally { setSaving(false); }
  };

  const signOut = async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; };

  if (!data) return <div className="loading"><Baby /><p>يتم تجهيز سجل المتابعة…</p></div>;
  if (!data.user.role) return <Onboarding name={authName} run={run} saving={saving} error={error} notice={notice} />;

  const pregnancies = data.pregnancies || [];
  const visits = data.visits || [];
  const labs = data.labs || [];
  const selected = pregnancies.find((p) => p.id === selectedId) || pregnancies[0];
  const selectedVisits = selected ? visits.filter((v) => v.pregnancyId === selected.id) : [];
  const selectedLabs = selected ? labs.filter((lab) => lab.pregnancyId === selected.id) : [];

  return (
    <main className="app-shell">
      <WebMcpBridge pregnancy={selected} visits={selectedVisits} />
      <header className="topbar">
        <div className="brand"><img className="brand-logo" src="/madlouhmed-logo.jfif" alt="مجمع المدلوح الطبي MadlouhMed" /><div><strong>بكج متابعة الحمل</strong><small>Pregnancy Follow-up Package</small></div></div>
        <div className="account"><span><b>الطبيبة</b><small>{data.user.displayName}</small></span><a aria-label="تسجيل الخروج" onClick={signOut}><LogOut /></a></div>
      </header>
      <div className="confidential"><ShieldCheck /> سجل خاص — كل مستخدم يشاهد البيانات المصرح له بها فقط</div>
      {notice && <div className="notice success">{notice}</div>}
      {error && <div className="notice error">{error}</div>}

      <DoctorDashboard pregnancies={pregnancies} visits={visits} selected={selected} selectedVisits={selectedVisits} selectedLabs={selectedLabs}
        selectedId={selectedId} setSelectedId={setSelectedId} run={run} saving={saving} />
      <footer>نسخة تجريبية — لا تستخدم للبيانات الطبية الحقيقية قبل اعتمادها رسميًا</footer>
    </main>
  );
}

function Onboarding({ name, run, saving, error, notice }: { name: string; run: Function; saving: boolean; error: string; notice: string }) {
  return <main className="onboarding">
    <section className="welcome-card">
      <img className="welcome-logo" src="/madlouhmed-logo.jfif" alt="مجمع المدلوح الطبي MadlouhMed" /><p className="eyebrow">بكج متابعة الحمل · Pregnancy Follow-up Package</p><h1>مرحبًا، {name}</h1>
      <p>أدخلي رمز تفعيل الطبيبة لإكمال إنشاء الحساب.</p>
      {notice && <div className="notice success">{notice}</div>}{error && <div className="notice error">{error}</div>}
      <CodeForm label="رمز تفعيل الطبيبة" hint="هذا الرمز يسلّمه مسؤول النظام للطبيبة المعتمدة فقط" button="تفعيل الحساب" saving={saving} onSubmit={(code) => run("/api/onboard-doctor", { code }, "تم تفعيل الحساب")} />
    </section>
  </main>;
}

function WebMcpBridge({ pregnancy, visits }: { pregnancy?: Pregnancy; visits: Visit[] }) {
  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!modelContext?.registerTool || !pregnancy) return;
    const lifecycle = new AbortController();
    void Promise.resolve(modelContext.registerTool({
      name: "read_current_pregnancy_summary",
      title: "قراءة ملخص الحمل الحالي",
      description: "يعرض ملخص ملف الحمل المفتوح وعدد زيارات المتابعة والطوارئ دون تغيير أي بيانات.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute() {
        return {
          patientName: pregnancy.patientName,
          medicalRecordNumber: pregnancy.medicalRecordNumber,
          estimatedDueDate: pregnancy.estimatedDueDate,
          monthlyVisits: visits.filter((v) => v.visitType === "monthly").length,
          emergencyVisits: visits.filter((v) => v.visitType === "emergency").length,
          latestVisitDate: visits[0]?.visitDate || null,
        };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [pregnancy, visits]);
  return null;
}

function CodeForm({ label, hint, button, saving, onSubmit }: { label: string; hint: string; button: string; saving: boolean; onSubmit: (code: string) => void }) {
  return <form className="code-form" onSubmit={(e) => { e.preventDefault(); onSubmit(String(new FormData(e.currentTarget).get("code") || "")); }}>
    <label>{label}<input name="code" required autoComplete="one-time-code" placeholder="••••••••••" /></label><small>{hint}</small>
    <button className="primary" disabled={saving}>{saving ? "جارٍ التحقق…" : button}</button>
  </form>;
}

function DoctorDashboard({ pregnancies, visits, selected, selectedVisits, selectedLabs, selectedId, setSelectedId, run, saving }: {
  pregnancies: Pregnancy[]; visits: Visit[]; selected?: Pregnancy; selectedVisits: Visit[]; selectedLabs: LabResult[]; selectedId: number | null;
  setSelectedId: (id: number) => void; run: Function; saving: boolean;
}) {
  const emergencyCount = visits.filter((v) => v.visitType === "emergency").length;
  return <div className="workspace">
    <section className="stats"><Stat icon={<UserRound />} label="ملفات الحمل" value={pregnancies.length} /><Stat icon={<CalendarDays />} label="الزيارات المحفوظة" value={visits.length} /><Stat icon={<TriangleAlert />} label="زيارات الطوارئ" value={emergencyCount} /></section>
    <Tabs defaultValue={pregnancies.length ? "records" : "new"} dir="rtl">
      <TabsList className="main-tabs"><TabsTrigger value="records"><ClipboardPlus /> الملفات</TabsTrigger><TabsTrigger value="new"><Plus /> إضافة ملف حمل</TabsTrigger></TabsList>
      <TabsContent value="records">
        {!pregnancies.length ? <EmptyDoctor /> : <div className="records-layout">
          <aside className="patient-list"><h2>المراجعات</h2>{pregnancies.map((p) => <button key={p.id} className={p.id === selectedId ? "patient active" : "patient"} onClick={() => setSelectedId(p.id)}><span>{String(p.patientName).slice(0,1)}</span><div><b>{p.patientName}</b><small>ملف {p.medicalRecordNumber}</small></div></button>)}</aside>
          {selected && <section className="record"><RecordHeader pregnancy={selected} />
            <Tabs defaultValue="timeline" dir="rtl"><TabsList className="record-tabs"><TabsTrigger value="timeline">سجل الزيارات</TabsTrigger><TabsTrigger value="labs">نتائج التحاليل</TabsTrigger><TabsTrigger value="monthly">زيارة متابعة</TabsTrigger><TabsTrigger value="emergency">زيارة طوارئ</TabsTrigger></TabsList>
              <TabsContent value="timeline"><PatientRecord pregnancy={selected} visits={selectedVisits} labs={selectedLabs} compact /></TabsContent>
              <TabsContent value="labs"><LabSection pregnancyId={selected.id} labs={selectedLabs} canAdd run={run} saving={saving} /></TabsContent>
              <TabsContent value="monthly"><VisitForm pregnancyId={selected.id} type="monthly" visitNumber={selectedVisits.filter((v) => v.visitType === "monthly").length + 1} run={run} saving={saving} /></TabsContent>
              <TabsContent value="emergency"><VisitForm pregnancyId={selected.id} type="emergency" run={run} saving={saving} /></TabsContent>
            </Tabs>
          </section>}
        </div>}
      </TabsContent>
      <TabsContent value="new"><PregnancyForm run={run} saving={saving} /></TabsContent>
    </Tabs>
  </div>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <article className="stat"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>; }

function PregnancyForm({ run, saving }: { run: Function; saving: boolean }) {
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); run("/api/pregnancies", collect(e.currentTarget), "تم إنشاء ملف الحمل وحفظه نهائيًا", e.currentTarget); };
  return <form className="form-card" onSubmit={submit}><div className="form-title"><span><UserRound /></span><div><h2>برنامج متابعة الحمل - A.N.C</h2><p>الخانات مطابقة للملف الورقي المرفق.</p></div></div>
    <FieldSet title="بيانات المراجعة"><Input name="patientName" label="الاسم - Name" required /><Input name="medicalRecordNumber" label="رقم الملف - File No" required /><Input name="age" label="العمر - Age" type="number" min="10" max="65" required /><Input name="nationality" label="الجنسية - Nationality" required /><Input name="doctorName" label="الطبيب - Doctor" required /><Input name="mobile" label="رقم الجوال (اختياري)" /></FieldSet>
    <FieldSet title="بيانات الحمل والتاريخ المرضي"><Input name="lastMenstrualPeriod" label="آخر دورة - LMP" type="date" required /><Input name="estimatedDueDate" label="موعد الولادة المتوقع - EDD" type="date" required /><Input name="gravida" label="G - عدد مرات الحمل" type="number" defaultValue="1" /><Input name="para" label="P - عدد الولادات" type="number" defaultValue="0" /><Input name="abortions" label="+ - عدد الإجهاضات" type="number" defaultValue="0" /><Text name="previousPregnancyNotes" label="ملاحظات التاريخ الولادي - Obstetric History" /><Text name="chronicDiseases" label="التاريخ المرضي السابق - Past Medical History" /><Text name="pastSurgicalHistory" label="التاريخ الجراحي السابق - Past Surgical History" /></FieldSet>
    <LockNote /><button className="primary wide" disabled={saving}><LockKeyhole />{saving ? "جارٍ الحفظ…" : "حفظ وإنشاء الملف"}</button>
  </form>;
}

function VisitForm({ pregnancyId, type, visitNumber = 0, run, saving }: { pregnancyId: number; type: "monthly" | "emergency"; visitNumber?: number; run: Function; saving: boolean }) {
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); run("/api/visits", { ...collect(e.currentTarget), pregnancyId, visitType: type }, "تم حفظ الزيارة وقفلها نهائيًا", e.currentTarget); };
  if (type === "monthly" && visitNumber > 10) return <div className="empty"><ShieldCheck /><h3>اكتملت الزيارات العشر</h3><p>لا يمكن حذف أو استبدال أي زيارة محفوظة. ما زال بالإمكان إضافة زيارات الطوارئ ونتائج التحاليل.</p></div>;
  return <form className="form-card inner" onSubmit={submit}><div className="form-title"><span className={type === "emergency" ? "danger-icon" : ""}>{type === "emergency" ? <TriangleAlert /> : <HeartPulse />}</span><div><h2>{type === "emergency" ? "زيارة طوارئ - Emergency Visit" : `الزيارة ${visitNumber} من 10 - VISIT ${visitNumber}`}</h2><p>تُضاف إلى الملف نفسه وتُقفل بعد الحفظ دون تغيير أي زيارة سابقة.</p></div></div>
    {type === "emergency" && <FieldSet title="سبب الطوارئ"><Text name="emergencyReason" label="الشكوى الرئيسية ووقت بدايتها" required /><Text name="emergencyOutcome" label="الإجراء والنتيجة أو التحويل" required /></FieldSet>}
    <FieldSet title="بيانات الزيارة - Visit Information"><Input name="visitDate" label="التاريخ - Date" type="date" defaultValue={today} required /><Text name="complaint" label="الشكوى - C/O" /><Input name="bloodPressure" label="ضغط الدم - BP" placeholder="120/80" /><Input name="bValue" label="B" /><Input name="weightKg" label="الوزن - WT" type="number" step="0.1" /><Text name="examination" label="الفحص - Examination" /><Text name="investigation" label="الاستقصاءات - Investigation" /><Text name="treatment" label="العلاج - Treatment" /></FieldSet>
    <LockNote /><button className={type === "emergency" ? "primary danger wide" : "primary wide"} disabled={saving}><LockKeyhole />{saving ? "جارٍ الحفظ…" : "حفظ الزيارة وقفلها"}</button>
  </form>;
}

function FieldSet({ title, children }: { title: string; children: React.ReactNode }) { return <fieldset><legend>{title}</legend><div className="fields">{children}</div></fieldset>; }
function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label className={fieldClass}><span>{label}{props.required && " *"}</span><input {...props} /></label>; }
function Text({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) { return <label className={`${fieldClass} full`}><span>{label}{props.required && " *"}</span><textarea rows={3} {...props} /></label>; }
function Select({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[] }) { return <label className={fieldClass}><span>{label}</span><select {...props}>{options.map((o) => <option key={o}>{o}</option>)}</select></label>; }
function LockNote() { return <div className="lock-note"><LockKeyhole /><p><b>تأكيد الحفظ النهائي</b><br/>بعد الضغط على الحفظ لن يمكن تعديل هذا السجل أو حذفه.</p></div>; }
function EmptyDoctor() { return <div className="empty tall"><ClipboardPlus /><h3>لا توجد ملفات حمل</h3><p>ابدئي بإضافة بيانات المراجعة والحمل الحالي.</p></div>; }
