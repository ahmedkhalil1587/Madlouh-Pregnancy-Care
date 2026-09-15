import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionCookieValue } from "@/lib/session";

export type SessionUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const email = await verifySessionCookieValue(cookieStore.get(SESSION_COOKIE)?.value);
  if (!email) return null;
  return { userId: email, email, displayName: email, fullName: null };
}

export async function requireSessionUser(returnTo: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (user) return user;
  redirect(`/login?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`);
}

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local") return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
