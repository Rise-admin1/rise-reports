import { UPSTREAM } from './upstream.js';

let cachedToken = null;
let cachedAt = 0;
const TOKEN_TTL_MS = 50 * 60 * 1000;

function getCredentials() {
  const email = (process.env.VELO_ADMIN_EMAIL || '').trim();
  const password = process.env.VELO_ADMIN_PASSWORD || '';
  return { email, password };
}

export async function getVeloAdminToken(force = false) {
  const { email, password } = getCredentials();
  if (!email || !password) {
    throw new Error(
      'Velo upstream credentials missing. Set VELO_ADMIN_EMAIL and VELO_ADMIN_PASSWORD.'
    );
  }

  if (!force && cachedToken && Date.now() - cachedAt < TOKEN_TTL_MS) {
    return cachedToken;
  }

  const response = await fetch(`${UPSTREAM.VELO}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json().catch(() => null);
  const token = body?.accountExists?.token;
  if (!response.ok || !token) {
    cachedToken = null;
    throw new Error(body?.message || `Velo admin login failed (${response.status})`);
  }

  cachedToken = token;
  cachedAt = Date.now();
  return cachedToken;
}

export async function veloFetch(pathWithQuery, options = {}) {
  const token = await getVeloAdminToken(options.forceLogin);
  const url = `${UPSTREAM.VELO}${pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`}`;

  let response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    const retryToken = await getVeloAdminToken(true);
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

export async function getVeloStats() {
  const statsRes = await veloFetch('/admin/stats');
  if (!statsRes.ok) {
    const err = await statsRes.json().catch(() => null);
    throw new Error(err?.message || `Failed to load Velo stats (${statsRes.status})`);
  }
  return statsRes.json();
}
