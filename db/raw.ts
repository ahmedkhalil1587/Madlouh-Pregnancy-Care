import { env } from "cloudflare:workers";
export function getD1(): D1Database { if (!env.DB) throw new Error("قاعدة البيانات غير متاحة حاليًا"); return env.DB; }
export function getSetupCode(): string { return env.SETUP_CODE || ""; }
