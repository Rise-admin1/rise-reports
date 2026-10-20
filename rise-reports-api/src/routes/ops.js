import crypto from 'crypto';
import { Router } from 'express';
import { coachAcademFetch } from '../services/coachAcadem.js';
import { veloFetch } from '../services/velo.js';
import { safariBooksFetch } from '../services/safariBooks.js';
import { sjpFetch } from '../services/sjp.js';
import { dubaiAnalyticaFetch } from '../services/dubaiAnalytica.js';
import { askAboutLog, attachAiMessages } from '../services/opsAi.js';

const router = Router();
const TOKEN_TTL_SEC = 8 * 60 * 60;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX = 5;

const loginHits = new Map();

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function getOpsSecret() {
  return (process.env.OPS_LOG_SECRET || '').trim();
}

function safeEqual(leftValue, rightValue) {
  const left = crypto.createHash('sha256').update(String(leftValue)).digest();
  const right = crypto.createHash('sha256').update(String(rightValue)).digest();
  return crypto.timingSafeEqual(left, right);
}

function signOpsToken() {
  const secret = getOpsSecret();
  if (!secret) {
    throw new Error('OPS_LOG_SECRET is not set');
  }
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC;
  const payload = base64url(JSON.stringify({ role: 'OPS', exp }));
  const data = `${header}.${payload}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return { token: `${data}.${signature}`, exp };
}

function verifyOpsToken(token) {
  const secret = getOpsSecret();
  if (!secret || !token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const data = `${parts[0]}.${parts[1]}`;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  const actual = Buffer.from(parts[2]);
  const expectedBuf = Buffer.from(expected);
  if (actual.length !== expectedBuf.length || !crypto.timingSafeEqual(actual, expectedBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (payload?.role !== 'OPS' || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (typeof raw === 'string' && raw.trim()) return raw.split(',')[0].trim();
  return req.ip || 'unknown';
}

function loginLimited(ip) {
  const now = Date.now();
  const entry = loginHits.get(ip);
  if (!entry || entry.resetAt < now) {
    loginHits.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LOGIN_MAX;
}

function requireOps(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  const payload = verifyOpsToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  req.ops = payload;
  return next();
}

router.post('/login', (req, res) => {
  if (loginLimited(clientIp(req))) {
    return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
  }

  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const expectedUser = (process.env.OPS_LOG_USERNAME || '').trim();
  const expectedPassword = process.env.OPS_LOG_PASSWORD || '';
  if (!expectedUser || !expectedPassword || !getOpsSecret()) {
    return res.status(500).json({ success: false, message: 'Ops login is not configured' });
  }

  const userOk = safeEqual(username, expectedUser);
  const passOk = safeEqual(password, expectedPassword);
  if (!userOk || !passOk) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  try {
    const { token, exp } = signOpsToken();
    return res.json({
      success: true,
      data: {
        token,
        expiresAt: new Date(exp * 1000).toISOString(),
        username: expectedUser,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Login failed',
    });
  }
});

router.post('/logout', requireOps, (_req, res) => {
  return res.json({ success: true });
});

router.get('/me', requireOps, (req, res) => {
  return res.json({
    success: true,
    data: {
      username: (process.env.OPS_LOG_USERNAME || '').trim(),
      expiresAt: new Date(req.ops.exp * 1000).toISOString(),
    },
  });
});

router.get('/assets', requireOps, (_req, res) => {
  return res.json({
    success: true,
    data: [
      { id: 'coach-academ', name: 'Coach Academ' },
      { id: 'velo', name: 'Velo' },
      { id: 'safari-books', name: 'Safari Books' },
      { id: 'scientific-journals', name: 'Scientific Journals Portal' },
      { id: 'dubai-analytica', name: 'Dubai Analytica' },
    ],
  });
});

router.get('/assets/coach-academ/logs', requireOps, async (req, res) => {
  const params = new URLSearchParams();
  for (const key of ['page', 'pageSize', 'outcome', 'q']) {
    const value = req.query[key];
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  try {
    const response = await coachAcademFetch(`/admin/request-logs${query ? `?${query}` : ''}`);
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return res.status(response.status).json(
        body && typeof body === 'object'
          ? body
          : { success: false, message: 'Failed to load Coach Academ logs' }
      );
    }
    const logs = await attachAiMessages('coach-academ', Array.isArray(body?.logs) ? body.logs : []);
    return res.json({ success: true, data: { ...body, logs } });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to load Coach Academ logs',
    });
  }
});

router.post('/assets/coach-academ/logs/:logId/ask', requireOps, async (req, res) => {
  try {
    const response = await coachAcademFetch(
      `/admin/request-logs/${encodeURIComponent(req.params.logId)}`
    );
    const log = await response.json().catch(() => null);
    if (!response.ok || !log?.id) {
      return res.status(response.status === 404 ? 404 : 502).json(
        log && typeof log === 'object' && log.message
          ? log
          : { success: false, message: 'Failed to load this error' }
      );
    }
    const aiMessages = await askAboutLog({
      asset: 'coach-academ',
      assetName: 'Coach Academ',
      log,
      message: req.body?.message || '',
    });
    return res.json({ success: true, data: { aiMessages } });
  } catch (error) {
    const status = error?.status || 502;
    return res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to ask about this error',
    });
  }
});

router.get('/assets/velo/logs', requireOps, async (req, res) => {
  const params = new URLSearchParams();
  for (const key of ['page', 'pageSize', 'outcome', 'q']) {
    const value = req.query[key];
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  try {
    const response = await veloFetch(`/admin/request-logs${query ? `?${query}` : ''}`);
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return res.status(response.status).json(
        body && typeof body === 'object'
          ? body
          : { success: false, message: 'Failed to load Velo logs' }
      );
    }
    const logs = await attachAiMessages('velo', Array.isArray(body?.logs) ? body.logs : []);
    return res.json({ success: true, data: { ...body, logs } });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to load Velo logs',
    });
  }
});

router.post('/assets/velo/logs/:logId/ask', requireOps, async (req, res) => {
  try {
    const response = await veloFetch(
      `/admin/request-logs/${encodeURIComponent(req.params.logId)}`
    );
    const log = await response.json().catch(() => null);
    if (!response.ok || !log?.id) {
      return res.status(response.status === 404 ? 404 : 502).json(
        log && typeof log === 'object' && log.message
          ? log
          : { success: false, message: 'Failed to load this error' }
      );
    }
    const aiMessages = await askAboutLog({
      asset: 'velo',
      assetName: 'Velo',
      log,
      message: req.body?.message || '',
    });
    return res.json({ success: true, data: { aiMessages } });
  } catch (error) {
    const status = error?.status || 502;
    return res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to ask about this error',
    });
  }
});

router.get('/assets/safari-books/logs', requireOps, async (req, res) => {
  const params = new URLSearchParams();
  for (const key of ['page', 'pageSize', 'outcome', 'q']) {
    const value = req.query[key];
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  try {
    const response = await safariBooksFetch(`/admin/request-logs${query ? `?${query}` : ''}`);
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return res.status(response.status).json(
        body && typeof body === 'object'
          ? body
          : { success: false, message: 'Failed to load Safari Books logs' }
      );
    }
    const logs = await attachAiMessages('safari-books', Array.isArray(body?.logs) ? body.logs : []);
    return res.json({ success: true, data: { ...body, logs } });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to load Safari Books logs',
    });
  }
});

router.post('/assets/safari-books/logs/:logId/ask', requireOps, async (req, res) => {
  try {
    const response = await safariBooksFetch(
      `/admin/request-logs/${encodeURIComponent(req.params.logId)}`
    );
    const log = await response.json().catch(() => null);
    if (!response.ok || !log?.id) {
      return res.status(response.status === 404 ? 404 : 502).json(
        log && typeof log === 'object' && log.message
          ? log
          : { success: false, message: 'Failed to load this error' }
      );
    }
    const aiMessages = await askAboutLog({
      asset: 'safari-books',
      assetName: 'Safari Books',
      log,
      message: req.body?.message || '',
    });
    return res.json({ success: true, data: { aiMessages } });
  } catch (error) {
    const status = error?.status || 502;
    return res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to ask about this error',
    });
  }
});

function mountAssetLogs(assetId, assetName, fetchUpstream) {
  router.get(`/assets/${assetId}/logs`, requireOps, async (req, res) => {
    const params = new URLSearchParams();
    for (const key of ['page', 'pageSize', 'outcome', 'q']) {
      const value = req.query[key];
      if (value === undefined || value === null || value === '') continue;
      params.set(key, String(value));
    }
    const query = params.toString();
    try {
      const response = await fetchUpstream(`/admin/request-logs${query ? `?${query}` : ''}`);
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        return res.status(response.status).json(
          body && typeof body === 'object'
            ? body
            : { success: false, message: `Failed to load ${assetName} logs` }
        );
      }
      const logs = await attachAiMessages(assetId, Array.isArray(body?.logs) ? body.logs : []);
      return res.json({ success: true, data: { ...body, logs } });
    } catch (error) {
      return res.status(502).json({
        success: false,
        message: error instanceof Error ? error.message : `Failed to load ${assetName} logs`,
      });
    }
  });

  router.post(`/assets/${assetId}/logs/:logId/ask`, requireOps, async (req, res) => {
    try {
      const response = await fetchUpstream(
        `/admin/request-logs/${encodeURIComponent(req.params.logId)}`
      );
      const log = await response.json().catch(() => null);
      if (!response.ok || !log?.id) {
        return res.status(response.status === 404 ? 404 : 502).json(
          log && typeof log === 'object' && log.message
            ? log
            : { success: false, message: 'Failed to load this error' }
        );
      }
      const aiMessages = await askAboutLog({
        asset: assetId,
        assetName,
        log,
        message: req.body?.message || '',
      });
      return res.json({ success: true, data: { aiMessages } });
    } catch (error) {
      const status = error?.status || 502;
      return res.status(status).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to ask about this error',
      });
    }
  });
}

mountAssetLogs('scientific-journals', 'Scientific Journals Portal', sjpFetch);
mountAssetLogs('dubai-analytica', 'Dubai Analytica', dubaiAnalyticaFetch);

export default router;
