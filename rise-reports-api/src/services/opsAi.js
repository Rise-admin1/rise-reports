import { prisma } from './prisma.js';

const ROUTE_NOTES = {
  'coach-academ': [
    ['/api/auth/super-admin/login', 'Signs in a Coach Academ admin.'],
    ['/api/auth/register', 'Creates a student, teacher, parent, or organization account.'],
    ['/api/auth/login', 'Signs in a verified user and starts a session.'],
    ['/api/auth/verify', 'Confirms an email verification link.'],
    ['/api/auth/forgot-password', 'Sends a password reset email.'],
    ['/api/auth/reset-password', 'Sets a new password from a reset token.'],
    ['/api/auth', 'Account, profile, and organization actions.'],
    ['/api/subjects', 'Course catalog, course detail, creation, and verification.'],
    ['/api/enrollments', 'Joining or leaving a course.'],
    ['/api/stripe-webhook', 'Stripe payment webhook.'],
    ['/api/stripe', 'Card payments and purchase checks.'],
    ['/api/stripe-onboard', 'Teacher Stripe onboarding.'],
    ['/api/bookings', 'Class booking and availability.'],
    ['/api/zoom/webhook', 'Zoom webhook.'],
    ['/api/zoom', 'Zoom meeting setup.'],
    ['/api/conversation', 'Chat conversations.'],
    ['/api/message', 'Chat messages.'],
    ['/api/community', 'Community rooms.'],
    ['/api/parent', 'Parent links and parent chat.'],
    ['/api/student', 'Student responses to parent invites.'],
    ['/api/billing', 'Student or parent billing.'],
    ['/api/reports', 'Abuse reports and blocked users.'],
    ['/api/reviews', 'Course reviews.'],
    ['/api/student-ratings', 'Student ratings.'],
    ['/api/s3', 'File uploads.'],
    ['/api/admin', 'Coach Academ admin lists.'],
    ['/api/app', 'App version check.'],
  ].sort((a, b) => b[0].length - a[0].length),
};

const SERVER_NOTES = {
  'coach-academ': [
    'Public API is https://api.coachacadem.ae. Express on Node, MySQL through Prisma. Mail is Resend. Payments are Stripe. Classes use Zoom. Files use S3. Live chat is Socket.IO and is not in these HTTP logs.',
    'These rows are failed HTTP calls only, status 400 and above, kept for 14 days. GET /health is not logged. The ops page reads them through rise-reports-api. A failure to load this page is a gateway problem, not one of these rows.',
    'Every /api route allows 100 requests per IP per 60 seconds. Over that, the API returns 429 and "Too many requests. Please try again later." Wait for the minute window to pass. This is per IP, so one shared network can trip it for everyone on that network.',
    'Login and super-admin login add a tighter limit: 5 requests per IP per 15 minutes. Forgot-password allows 3 per IP per hour. Reset-password allows 5 per IP per 15 minutes. The same 429 message is used. Waiting out the window is the fix. These limits sit on top of the global 100-per-minute limit.',
    'A separate account lock is not the rate limit. Five wrong passwords lock that account for 15 minutes. While locked, login still says "Invalid email or password". A correct password works again after lockUntil passes. A successful login clears the failure count.',
    'Registration stores one email verification token, 40 hex characters, with no timer. The link is GET /api/auth/verify/{token} on the API host. It works once. Success sets verified and deletes the token. A teacher verification also creates their Zoom user. "Invalid or expired verification token" means that token is not on any user: it was already used, a newer registration email replaced it, or the link is wrong. If the account is already verified, sign in. If not, send a new verification email from the app and open only the latest link.',
    'Login returns 400 "Please verify your email" until that token has been used. Passwords must be at least 10 characters and must not equal the email.',
    'Session JWTs are signed with the server secret and have no expiry time. Non-admin tokens carry one session id. A new login replaces it, and the old token gets 401 "Session ended". The fix is to sign in again on this device. Missing Authorization is 401 "You are not authenticated!". A bad signature is 403 "Token is not valid". The wrong account type is 403 "You are not allowed to perform this action". Admin tokens skip the single-session check.',
    'Password reset emails a 6-digit code that lasts 15 minutes. Five wrong codes delete it. Forgot-password returns the same 200 whether or not the email exists, so 200 does not prove the mail went out. If the account exists and Resend fails, the request errors. Check the Resend sender and spam before treating it as a missing user.',
    'Stripe webhook needs the raw body and a matching webhook secret. 400 "Webhook Error" means the signature check failed. Booking conflicts are 409: the student or tutor should pick another time.',
    'Zoom webhook needs the raw body, x-zm-signature, x-zm-request-timestamp, and the Zoom secret. Missing any of those is 400 "Invalid Zoom webhook headers". A mismatch is 401 "Invalid signature". The Zoom URL-validation event does not use that signature.',
    'Browser calls must come from an allowed site origin. The native app sends no Origin and is allowed. A browser block often never becomes one of these rows.',
  ].join(' '),
};

function routeNote(asset, path) {
  const notes = ROUTE_NOTES[asset] || [];
  const match = notes.find(([prefix]) => path === prefix || String(path || '').startsWith(`${prefix}/`));
  return match ? match[1] : 'API request.';
}

function asMessages(value) {
  return Array.isArray(value) ? value : [];
}

export async function attachAiMessages(asset, logs) {
  if (!Array.isArray(logs) || logs.length === 0) return logs;
  const rows = await prisma.opsAiConversation.findMany({
    where: { asset, logId: { in: logs.map((log) => log.id).filter(Boolean) } },
  });
  const byLogId = new Map(rows.map((row) => [row.logId, asMessages(row.messages)]));
  return logs.map((log) => ({ ...log, aiMessages: byLogId.get(log.id) || [] }));
}

async function completeConversation(asset, assetName, log, thread) {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    const error = new Error('OPENAI_API_KEY is not set');
    error.status = 503;
    throw error;
  }
  const model = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 700,
        messages: [
          {
            role: 'system',
            content: `You help a ${assetName} operator troubleshoot one failed API request. Use only the server notes and this request. Do not invent limits, secrets, or code. Reply in short plain sentences: what failed, why it matches this status and route, and what to do next. Say what is still unknown if the log is not enough. Do not propose code edits unless the operator asks. Server notes: ${SERVER_NOTES[asset] || 'No extra server notes.'} Request: ${JSON.stringify({
              asset: assetName,
              method: log.method,
              path: log.path,
              route: routeNote(asset, log.path),
              status: log.statusCode,
              error: log.errorMessage,
              email: log.email,
              accountType: log.accountType,
              headers: log.requestHeaders,
              data: log.requestBody,
            })}`,
          },
          ...thread.map((message) => ({ role: message.role, content: message.content })),
        ],
      }),
    });
    const body = await response.json().catch(() => null);
    const text = body?.choices?.[0]?.message?.content;
    if (!response.ok || typeof text !== 'string' || !text.trim()) {
      const error = new Error(body?.error?.message || 'OpenAI request failed');
      error.status = 502;
      throw error;
    }
    return text.trim().slice(0, 4000);
  } finally {
    clearTimeout(timer);
  }
}

export async function askAboutLog({ asset, assetName, log, message }) {
  const existingRow = await prisma.opsAiConversation.findUnique({
    where: { asset_logId: { asset, logId: log.id } },
  });
  const existing = asMessages(existingRow?.messages);
  const text = String(message || '').trim() || (existing.length === 0 ? 'Why did this error happen, and what should I check or do next?' : '');
  if (!text) {
    const error = new Error('Message is required');
    error.status = 400;
    throw error;
  }
  const userMessage = {
    role: 'user',
    content: text.slice(0, 2000),
    createdAt: new Date().toISOString(),
  };
  const thread = [...existing, userMessage].slice(-40);
  const reply = await completeConversation(asset, assetName, log, thread);
  const messages = [
    ...thread,
    { role: 'assistant', content: reply, createdAt: new Date().toISOString() },
  ];
  await prisma.opsAiConversation.upsert({
    where: { asset_logId: { asset, logId: log.id } },
    create: { asset, logId: log.id, messages },
    update: { messages },
  });
  return messages;
}
