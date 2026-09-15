import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "بكج متابعة الحمل | MadlouhMed",
  description: "بكج إلكتروني ثنائي اللغة لمتابعة الحمل والزيارات والتحاليل لدى مجمع المدلوح الطبي",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
