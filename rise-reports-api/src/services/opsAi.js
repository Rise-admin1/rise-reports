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
        max_tokens: 400,
        messages: [
          {
            role: 'system',
            content: `You explain why this ${assetName} API error happened. Use the route context below. Answer the operator's question. Do not suggest code changes unless they ask. ${JSON.stringify({
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
  const text = String(message || '').trim() || (existing.length === 0 ? 'Why did this error happen?' : '');
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
