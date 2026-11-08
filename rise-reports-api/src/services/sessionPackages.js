import { prisma } from './prisma.js';
import { UPSTREAM } from './upstream.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function asWholeNumber(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

export function packageView(pkg, funyulaUsed) {
  const extraUsed = Math.max(0, Number(funyulaUsed || 0) - pkg.funyulaUsedBaseline);
  const used = Math.min(pkg.totalSessions, pkg.manualFulfilled + extraUsed);
  return {
    totalSessions: pkg.totalSessions,
    usedSessions: used,
    remainingSessions: Math.max(0, pkg.totalSessions - used),
  };
}

async function funyulaJson(path, { method = 'GET', query, body } = {}) {
  const url = new URL(`${UPSTREAM.FUNYULA}${path}`);
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { message: text };
  }
  return { ok: response.ok, status: response.status, json };
}

export async function readScheduling(path, query) {
  return funyulaJson(path, { query });
}

export async function fetchRemoteCredit(email, appSource) {
  const result = await funyulaJson('/scheduling/session-credits', {
    query: { email, appSource },
  });
  if (result.ok) return result.json;
  const message = result.json?.message || '';
  if (result.status === 404 || /no session credits/i.test(message)) return null;
  const error = new Error(message || 'Failed to fetch session credits');
  error.status = result.status;
  throw error;
}

async function grantBookable({ email, appSource, sessions, notes, sendEmail }) {
  const result = await funyulaJson('/scheduling/session-credits/grant', {
    method: 'POST',
    body: {
      email,
      appSource,
      sessions,
      notes,
      sendEmail,
    },
  });
  if (!result.ok) {
    const error = new Error(result.json?.message || 'Failed to grant session credits');
    error.status = result.status;
    throw error;
  }
  return result.json;
}

function missingTable(error) {
  return error?.code === 'P2021' || String(error?.message || '').includes('SessionPackage');
}

export async function applyGrant({ email, appSource, sessions, alreadyFulfilled = 0, notes, sendEmail }) {
  const add = asWholeNumber(sessions);
  const fulfilled = asWholeNumber(alreadyFulfilled);
  if (!normalizeEmail(email)) {
    const error = new Error('Valid email is required');
    error.status = 400;
    throw error;
  }
  if (add === null || add < 1) {
    const error = new Error('Package size must be a whole number of at least 1');
    error.status = 400;
    throw error;
  }
  if (fulfilled === null || fulfilled > add) {
    const error = new Error('Already fulfilled cannot be larger than the package size');
    error.status = 400;
    throw error;
  }

  const normalized = normalizeEmail(email);
  const bookable = add - fulfilled;
  const remoteBefore = await fetchRemoteCredit(normalized, appSource);
  let upstream = null;
  if (bookable > 0) {
    upstream = await grantBookable({
      email: normalized,
      appSource,
      sessions: bookable,
      notes,
      sendEmail,
    });
  }

  const funyulaUsed = remoteBefore?.credit?.usedSessions ?? 0;
  const existing = await prisma.sessionPackage.findUnique({
    where: { email_appSource: { email: normalized, appSource } },
  });
  const pkg = existing
    ? await prisma.sessionPackage.update({
        where: { id: existing.id },
        data: {
          totalSessions: existing.totalSessions + add,
          manualFulfilled: existing.manualFulfilled + fulfilled,
        },
      })
    : await prisma.sessionPackage.create({
        data: {
          email: normalized,
          appSource,
          totalSessions: (remoteBefore?.credit?.totalSessions ?? 0) + add,
          manualFulfilled: (remoteBefore?.credit?.usedSessions ?? 0) + fulfilled,
          funyulaUsedBaseline: funyulaUsed,
        },
      });

  const remoteCredit = upstream?.credit ?? remoteBefore?.credit ?? null;
  return {
    credit: shapeCredit(remoteCredit, pkg, normalized, appSource),
    invite: upstream?.invite ?? remoteBefore?.invite ?? null,
    emailSent: Boolean(upstream?.emailSent),
    emailSkipped: upstream ? Boolean(upstream.emailSkipped) : true,
  };
}

export async function setPackage({ email, appSource, totalSessions, fulfilledSessions }) {
  const total = asWholeNumber(totalSessions);
  const fulfilled = asWholeNumber(fulfilledSessions);
  const normalized = normalizeEmail(email);
  if (!normalized) {
    const error = new Error('Valid email is required');
    error.status = 400;
    throw error;
  }
  if (total === null || total < 1) {
    const error = new Error('Package size must be a whole number of at least 1');
    error.status = 400;
    throw error;
  }
  if (fulfilled === null || fulfilled > total) {
    const error = new Error('Fulfilled sessions cannot be larger than the package size');
    error.status = 400;
    throw error;
  }

  const remoteBefore = await fetchRemoteCredit(normalized, appSource);
  const funyulaRemaining = remoteBefore?.credit?.remainingSessions ?? 0;
  const targetLeft = total - fulfilled;
  let upstream = null;
  if (targetLeft > funyulaRemaining) {
    upstream = await grantBookable({
      email: normalized,
      appSource,
      sessions: targetLeft - funyulaRemaining,
      sendEmail: false,
    });
  }

  const funyulaUsed = upstream?.credit?.usedSessions ?? remoteBefore?.credit?.usedSessions ?? 0;
  const pkg = await prisma.sessionPackage.upsert({
    where: { email_appSource: { email: normalized, appSource } },
    create: {
      email: normalized,
      appSource,
      totalSessions: total,
      manualFulfilled: fulfilled,
      funyulaUsedBaseline: funyulaUsed,
    },
    update: {
      totalSessions: total,
      manualFulfilled: fulfilled,
      funyulaUsedBaseline: funyulaUsed,
    },
  });

  const remoteCredit = upstream?.credit ?? remoteBefore?.credit ?? null;
  return {
    credit: shapeCredit(remoteCredit, pkg, normalized, appSource),
    invite: upstream?.invite ?? remoteBefore?.invite ?? null,
    recentUsages: remoteBefore?.recentUsages ?? [],
  };
}

function shapeCredit(remoteCredit, pkg, email, appSource) {
  const view = packageView(pkg, remoteCredit?.usedSessions ?? pkg.funyulaUsedBaseline);
  return {
    ...(remoteCredit || {}),
    id: remoteCredit?.id ?? pkg.id,
    email,
    appSource,
    totalSessions: view.totalSessions,
    usedSessions: view.usedSessions,
    remainingSessions: view.remainingSessions,
    notes: remoteCredit?.notes ?? null,
    inviteId: remoteCredit?.inviteId ?? null,
    shareUrl: remoteCredit?.shareUrl ?? null,
    createdAt: remoteCredit?.createdAt ?? pkg.createdAt,
    updatedAt: pkg.updatedAt,
  };
}

export async function overlayCreditResponse(body, email, appSource) {
  if (!body?.credit) return body;
  const pkg = await prisma.sessionPackage.findUnique({
    where: { email_appSource: { email: normalizeEmail(email), appSource } },
  });
  if (!pkg) return body;
  return {
    ...body,
    credit: shapeCredit(body.credit, pkg, normalizeEmail(email), appSource),
  };
}

export async function overlayCreditList(body, appSource) {
  const credits = Array.isArray(body?.credits) ? body.credits : [];
  const packages = await prisma.sessionPackage.findMany({ where: { appSource } });
  const byEmail = new Map(packages.map((pkg) => [pkg.email, pkg]));
  const seen = new Set();
  const merged = credits.map((item) => {
    const email = normalizeEmail(item.email);
    seen.add(email);
    const pkg = byEmail.get(email);
    if (!pkg) return item;
    const view = packageView(pkg, item.usedSessions);
    return { ...item, email, ...view };
  });
  for (const pkg of packages) {
    if (seen.has(pkg.email)) continue;
    merged.push({ email: pkg.email, ...packageView(pkg, pkg.funyulaUsedBaseline) });
  }
  return { ...body, credits: merged };
}

export async function overlayBookingStats(body, email, appSource) {
  if (!body) return body;
  const pkg = await prisma.sessionPackage.findUnique({
    where: { email_appSource: { email: normalizeEmail(email), appSource } },
  });
  if (!pkg) return body;
  const view = packageView(pkg, body.packageSessionsUsed);
  return {
    ...body,
    packageSessionsTotal: view.totalSessions,
    packageSessionsUsed: view.usedSessions,
    packageSessionsLeft: view.remainingSessions,
  };
}

export function isMissingPackageTable(error) {
  return missingTable(error);
}
