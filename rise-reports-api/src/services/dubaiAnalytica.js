import { UPSTREAM } from './upstream.js';

let cachedToken = null;
let cachedAt = 0;
const TOKEN_TTL_MS = 50 * 60 * 1000;

function getCredentials() {
  const email = (process.env.DUBAI_ANALYTICA_ADMIN_EMAIL || '').trim();
  const password = process.env.DUBAI_ANALYTICA_ADMIN_PASSWORD || '';
  return { email, password };
}

function isTruthySuperAdmin(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

export async function getDubaiAnalyticaAdminToken(force = false) {
  const { email, password } = getCredentials();
  if (!email || !password) {
    throw new Error(
      'Dubai Analytica upstream credentials missing. Set DUBAI_ANALYTICA_ADMIN_EMAIL and DUBAI_ANALYTICA_ADMIN_PASSWORD.'
    );
  }

  if (!force && cachedToken && Date.now() - cachedAt < TOKEN_TTL_MS) {
    return cachedToken;
  }

  const response = await fetch(`${UPSTREAM.DUBAI_ANALYTICA}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.accessToken) {
    cachedToken = null;
    throw new Error(body?.message || `Dubai Analytica admin login failed (${response.status})`);
  }

  if (!isTruthySuperAdmin(body.isSuperAdmin)) {
    cachedToken = null;
    throw new Error(
      'Dubai Analytica credentials are valid but the account is not a super admin (isSuperAdmin=false).'
    );
  }

  cachedToken = body.accessToken;
  cachedAt = Date.now();
  return cachedToken;
}

export async function dubaiAnalyticaFetch(pathWithQuery, options = {}) {
  const token = await getDubaiAnalyticaAdminToken(options.forceLogin);
  const url = `${UPSTREAM.DUBAI_ANALYTICA}${pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`}`;

  let response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    const retryToken = await getDubaiAnalyticaAdminToken(true);
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

export async function getDubaiAnalyticaStats() {
  const statsRes = await dubaiAnalyticaFetch('/admin/stats');
  if (!statsRes.ok) {
    const err = await statsRes.json().catch(() => null);
    throw new Error(err?.message || `Failed to load Dubai Analytica stats (${statsRes.status})`);
  }
  return statsRes.json();
}
