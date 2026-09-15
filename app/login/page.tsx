"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";

async function api(path: string, body: Record<string, unknown>) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(String(data.error || "تعذر إتمام العملية"));
  return data;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("return_to") || "/";
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const sendCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      await api("/api/auth/request-otp", { email });
      setStep("code");
      setNotice("تم إرسال رمز التحقق إلى بريدك");
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر إرسال الرمز"); }
    finally { setSaving(false); }
  };

  const verify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api("/api/auth/verify-otp", { email, code });
      router.replace(returnTo);
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "رمز التحقق غير صحيح"); }
    finally { setSaving(false); }
  };

  return (
    <main className="onboarding">
      <section className="welcome-card">
        <img className="welcome-logo" src="/madlouhmed-logo.jfif" alt="مجمع المدلوح الطبي MadlouhMed" />
        <p className="eyebrow">بكج متابعة الحمل · Pregnancy Follow-up Package</p>
        <h1>تسجيل دخول الطبيبة</h1>
        <p>الدخول مخصص لطبيبات المجمع عبر البريد الرسمي فقط.</p>
        {notice && <div className="notice success">{notice}</div>}
        {error && <div className="notice error">{error}</div>}
        {step === "email" ? (
          <form className="code-form" onSubmit={sendCode}>
            <label>البريد الإلكتروني الرسمي
              <input type="email" required dir="ltr" placeholder="name@madlouh.com.sa" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <small>سيصلك رمز تحقق من 6 أرقام على هذا البريد</small>
            <button className="primary" disabled={saving}><ShieldCheck />{saving ? "جارٍ الإرسال…" : "إرسال رمز التحقق"}</button>
          </form>
        ) : (
          <form className="code-form" onSubmit={verify}>
            <label>رمز التحقق
              <input required autoComplete="one-time-code" inputMode="numeric" maxLength={6} placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value)} />
            </label>
            <small>الرمز صالح لمدة 10 دقائق</small>
            <button className="primary" disabled={saving}><ShieldCheck />{saving ? "جارٍ التحقق…" : "دخول"}</button>
          </form>
        )}
      </section>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
