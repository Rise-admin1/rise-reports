import { UPSTREAM } from './upstream.js';

let cachedToken = null;
let cachedAt = 0;
const TOKEN_TTL_MS = 50 * 60 * 1000; // refresh hourly-ish; JWTs may not expire soon but keep fresh

function getCredentials() {
  const email = (process.env.COACH_ACADEM_ADMIN_EMAIL || '').trim();
  const password = process.env.COACH_ACADEM_ADMIN_PASSWORD || '';
  return { email, password };
}

export async function getCoachAcademAdminToken(force = false) {
  const { email, password } = getCredentials();
  if (!email || !password) {
    throw new Error(
      'Coach Academ upstream credentials missing. Set COACH_ACADEM_ADMIN_EMAIL and COACH_ACADEM_ADMIN_PASSWORD.'
    );
  }

  if (!force && cachedToken && Date.now() - cachedAt < TOKEN_TTL_MS) {
    return cachedToken;
  }

  const response = await fetch(`${UPSTREAM.COACH_ACADEM}/auth/super-admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.token) {
    cachedToken = null;
    throw new Error(body?.message || `Coach Academ admin login failed (${response.status})`);
  }

  cachedToken = body.token;
  cachedAt = Date.now();
  return cachedToken;
}

export async function coachAcademFetch(pathWithQuery, options = {}) {
  const token = await getCoachAcademAdminToken(options.forceLogin);
  const url = `${UPSTREAM.COACH_ACADEM}${pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`}`;

  let response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    const retryToken = await getCoachAcademAdminToken(true);
    response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${retryToken}`,
      },
    });
  }

  return response;
}

export async function getCoachAcademStats() {
  const [statsRes, verifiedRes, pendingRes, reportsRes] = await Promise.all([
    coachAcademFetch('/admin/stats'),
    coachAcademFetch('/subjects'),
    coachAcademFetch('/subjects/verify'),
    coachAcademFetch('/reports/'),
  ]);

  if (!statsRes.ok) {
    const err = await statsRes.json().catch(() => null);
    throw new Error(err?.message || `Failed to load Coach Academ stats (${statsRes.status})`);
  }

  const stats = await statsRes.json();
  const verifiedSubjects = verifiedRes.ok ? await verifiedRes.json().catch(() => []) : [];
  const pendingSubjects = pendingRes.ok ? await pendingRes.json().catch(() => []) : [];
  const reports = reportsRes.ok ? await reportsRes.json().catch(() => []) : [];

  const verifiedCount = Array.isArray(verifiedSubjects) ? verifiedSubjects.length : 0;
  const pendingCount = Array.isArray(pendingSubjects)
    ? pendingSubjects.length
    : Number(stats.pendingSubjects || 0);
  const reportsCount = Array.isArray(reports) ? reports.length : 0;

  return {
    studentsJoined: Number(stats.students || 0),
    teachersJoined: Number(stats.teachers || 0),
    parentsJoined: Number(stats.parents || 0),
    organizations: Number(stats.organizations || 0),
    subjectsVerified: verifiedCount,
    subjectsAwaitingReview: pendingCount,
    /** Best available “created” proxy: verified live catalog + awaiting review */
    subjectsCreatedEstimate: verifiedCount + pendingCount,
    confirmedPurchases: Number(stats.confirmedPurchases || 0),
    totalSpendMinor: Number(stats.totalSpendMinor || 0),
    abuseReports: reportsCount,
  };
}
