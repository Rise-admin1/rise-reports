import { UPSTREAM } from './upstream.js';

let cachedToken = null;
let cachedAt = 0;
const TOKEN_TTL_MS = 50 * 60 * 1000;

function getCredentials() {
  const email = (process.env.SAFARI_BOOKS_ADMIN_EMAIL || '').trim();
  const password = process.env.SAFARI_BOOKS_ADMIN_PASSWORD || '';
  return { email, password };
}

export async function getSafariBooksAdminToken(force = false) {
  const { email, password } = getCredentials();
  if (!email || !password) {
    throw new Error(
      'Safari Books upstream credentials missing. Set SAFARI_BOOKS_ADMIN_EMAIL and SAFARI_BOOKS_ADMIN_PASSWORD.'
    );
  }

  if (!force && cachedToken && Date.now() - cachedAt < TOKEN_TTL_MS) {
    return cachedToken;
  }

  const response = await fetch(`${UPSTREAM.SAFARI_BOOKS}/auth/web-admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.token) {
    cachedToken = null;
    throw new Error(body?.message || `Safari Books admin login failed (${response.status})`);
  }

  cachedToken = body.token;
  cachedAt = Date.now();
  return cachedToken;
}

export async function safariBooksFetch(pathWithQuery, options = {}) {
  const token = await getSafariBooksAdminToken(options.forceLogin);
  const url = `${UPSTREAM.SAFARI_BOOKS}${pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`}`;

  let response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    const retryToken = await getSafariBooksAdminToken(true);
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

export async function getSafariBooksStats() {
  const statsRes = await safariBooksFetch('/admin/stats');
  if (!statsRes.ok) {
    const err = await statsRes.json().catch(() => null);
    throw new Error(err?.message || `Failed to load Safari Books stats (${statsRes.status})`);
  }
  return statsRes.json();
}
