import { UPSTREAM } from './upstream.js';

let cachedToken = null;
let cachedAt = 0;
const TOKEN_TTL_MS = 50 * 60 * 1000;

function getCredentials() {
  const email = (process.env.SJP_ADMIN_EMAIL || '').trim();
  const password = process.env.SJP_ADMIN_PASSWORD || '';
  return { email, password };
}

export async function getSjpAdminToken(force = false) {
  const { email, password } = getCredentials();
  if (!email || !password) {
    throw new Error(
      'Scientific Journals Portal upstream credentials missing. Set SJP_ADMIN_EMAIL and SJP_ADMIN_PASSWORD.'
    );
  }

  if (!force && cachedToken && Date.now() - cachedAt < TOKEN_TTL_MS) {
    return cachedToken;
  }

  const response = await fetch(`${UPSTREAM.SJP}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.token) {
    cachedToken = null;
    throw new Error(body?.message || `SJP admin login failed (${response.status})`);
  }

  if (!body?.user?.isAdmin) {
    cachedToken = null;
    throw new Error('SJP credentials are valid but the account is not an admin (isAdmin=false).');
  }

  cachedToken = body.token;
  cachedAt = Date.now();
  return cachedToken;
}

export async function sjpFetch(pathWithQuery, options = {}) {
  const token = await getSjpAdminToken(options.forceLogin);
  const url = `${UPSTREAM.SJP}${pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`}`;

  let response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    const retryToken = await getSjpAdminToken(true);
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

export async function getSjpStats() {
  const statsRes = await sjpFetch('/admin/stats');
  if (!statsRes.ok) {
    const err = await statsRes.json().catch(() => null);
    throw new Error(err?.message || `Failed to load SJP stats (${statsRes.status})`);
  }
  return statsRes.json();
}
