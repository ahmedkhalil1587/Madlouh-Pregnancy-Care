<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');

function respond(int $status, array $payload)
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'POST requests only']);
}

$configFile = dirname(__DIR__, 2) . '/otp-config.php';
if (!is_file($configFile)) {
    respond(503, ['ok' => false, 'error' => 'OTP gateway is not configured']);
}

$config = require $configFile;
if (!is_array($config) || empty($config['api_key']) || empty($config['from_email'])) {
    respond(503, ['ok' => false, 'error' => 'OTP gateway configuration is invalid']);
}

$providedKey = (string) ($_SERVER['HTTP_X_OTP_API_KEY'] ?? '');
if ($providedKey === '' || !hash_equals((string) $config['api_key'], $providedKey)) {
    respond(401, ['ok' => false, 'error' => 'Unauthorized']);
}

$rawBody = file_get_contents('php://input');
if ($rawBody === false || strlen($rawBody) > 4096) {
    respond(400, ['ok' => false, 'error' => 'Invalid request']);
}

$body = json_decode($rawBody, true);
if (!is_array($body)) {
    respond(400, ['ok' => false, 'error' => 'Invalid JSON']);
}

$recipient = strtolower(trim((string) ($body['email'] ?? '')));
$otp = trim((string) ($body['otp'] ?? ''));
$expiresAt = (int) ($body['expires_at'] ?? 0);
$allowedDomain = strtolower((string) ($config['allowed_domain'] ?? 'madlouh.com.sa'));

if (!filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['ok' => false, 'error' => 'Invalid recipient']);
}

$recipientDomain = substr(strrchr($recipient, '@') ?: '', 1);
if ($recipientDomain !== $allowedDomain) {
    respond(403, ['ok' => false, 'error' => 'Recipient domain is not allowed']);
}

if (!preg_match('/^\d{6}$/', $otp)) {
    respond(422, ['ok' => false, 'error' => 'Invalid OTP']);
}

$now = time();
if ($expiresAt < $now || $expiresAt > $now + 600) {
    respond(422, ['ok' => false, 'error' => 'Invalid expiration']);
}

$rateLimitFile = sys_get_temp_dir() . '/madlouh-otp-' . hash('sha256', $recipient);
$lastSentAt = is_file($rateLimitFile) ? (int) file_get_contents($rateLimitFile) : 0;
if ($lastSentAt > 0 && ($now - $lastSentAt) < 60) {
    respond(429, ['ok' => false, 'error' => 'Please wait before requesting another code']);
}

$fromEmail = (string) $config['from_email'];
$fromName = (string) ($config['from_name'] ?? 'Madlouh Medical Complex');
$subjectText = 'رمز تفعيل حساب الطبيب | Doctor account activation code';
$subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
$safeOtp = htmlspecialchars($otp, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$minutes = max(1, (int) ceil(($expiresAt - $now) / 60));

$message = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"></head>'
    . '<body style="font-family:Arial,Tahoma,sans-serif;background:#f7f5f9;padding:24px;color:#241b28">'
    . '<div style="max-width:520px;margin:auto;background:#fff;border:1px solid #e7dfea;border-radius:18px;padding:28px">'
    . '<h2 style="color:#4b275d;margin-top:0">بكج متابعة الحمل</h2>'
    . '<p>رمز تفعيل حساب الطبيب هو:</p>'
    . '<div dir="ltr" style="font-size:34px;font-weight:700;letter-spacing:8px;text-align:center;padding:18px;background:#f4eef7;border-radius:12px;color:#4b275d">' . $safeOtp . '</div>'
    . '<p>الرمز صالح لمدة ' . $minutes . ' دقائق ويُستخدم مرة واحدة فقط.</p>'
    . '<p style="color:#736a78;font-size:13px">إذا لم تطلب هذا الرمز فتجاهل الرسالة.</p>'
    . '<hr style="border:0;border-top:1px solid #eee6f0;margin:22px 0">'
    . '<p dir="ltr" style="text-align:left">Your doctor account activation code is <strong>' . $safeOtp . '</strong>. It expires in ' . $minutes . ' minutes.</p>'
    . '</div></body></html>';

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'From: ' . $fromName . ' <' . $fromEmail . '>',
    'Reply-To: ' . $fromEmail,
    'X-Auto-Response-Suppress: All',
];

$sent = mail($recipient, $subject, $message, implode("\r\n", $headers));
if (!$sent) {
    respond(502, ['ok' => false, 'error' => 'Email could not be queued']);
}

@file_put_contents($rateLimitFile, (string) $now, LOCK_EX);
respond(200, ['ok' => true]);
