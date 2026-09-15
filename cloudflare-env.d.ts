declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    SETUP_CODE?: string;
    SESSION_SECRET?: string;
    OTP_GATEWAY_URL?: string;
    OTP_GATEWAY_API_KEY?: string;
    ALLOWED_DOCTOR_EMAIL_DOMAIN?: string;
  }
}
