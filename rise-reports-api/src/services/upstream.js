import 'dotenv/config';

export const UPSTREAM = {
  FUNYULA: (process.env.UPSTREAM_FUNYULA_API_URL || 'https://future.funyula.com/api').replace(/\/$/, ''),
  RISE: (process.env.UPSTREAM_RISE_API_URL || 'https://react-journal1.onrender.com/api/rise').replace(
    /\/$/,
    ''
  ),
  COACH_ACADEM: (
    process.env.UPSTREAM_COACH_ACADEM_API_URL || 'https://api.coachacadem.ae/api'
  ).replace(/\/$/, ''),
  VELO: (process.env.UPSTREAM_VELO_API_URL || 'http://localhost:3001/api').replace(/\/$/, ''),
  SAFARI_BOOKS: (process.env.UPSTREAM_SAFARI_BOOKS_API_URL || 'http://localhost:3001/api').replace(
    /\/$/,
    ''
  ),
  SJP: (
    process.env.UPSTREAM_SJP_API_URL || 'https://react-journal1.onrender.com/api'
  ).replace(/\/$/, ''),
  DUBAI_ANALYTICA: (
    process.env.UPSTREAM_DUBAI_ANALYTICA_API_URL || 'http://localhost:3001/api'
  ).replace(/\/$/, ''),
};

/**
 * Forward a request to an upstream API and pipe the response back.
 * Preserves status and JSON/text body as returned by the upstream.
 * @param {Record<string, string>} [extraHeaders] - merged into the upstream request (e.g. Authorization)
 */
export async function proxyTo(upstreamBase, upstreamPath, req, res, extraHeaders = {}) {
  const url = new URL(`${upstreamBase}${upstreamPath}`);
  for (const [key, value] of Object.entries(req.query || {})) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, String(item));
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  const headers = { ...extraHeaders };
  const contentType = req.headers['content-type'];
  if (contentType) headers['Content-Type'] = contentType;
  const accept = req.headers['accept'];
  if (accept) headers['Accept'] = accept;

  const init = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (req.body !== undefined && req.body !== null && Object.keys(req.body || {}).length > 0) {
      init.body = JSON.stringify(req.body);
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    } else if (typeof req.body === 'string' && req.body.length > 0) {
      init.body = req.body;
    }
  }

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(url.toString(), init);
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: `Upstream request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  const responseContentType = upstreamResponse.headers.get('content-type') || '';
  const buffer = Buffer.from(await upstreamResponse.arrayBuffer());

  res.status(upstreamResponse.status);
  if (responseContentType) {
    res.setHeader('Content-Type', responseContentType);
  }

  if (responseContentType.includes('application/json')) {
    try {
      const json = JSON.parse(buffer.toString('utf8') || 'null');
      return res.json(json);
    } catch {
      return res.send(buffer);
    }
  }

  return res.send(buffer);
}
