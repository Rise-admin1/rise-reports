import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { getSafariBooksAdminToken, getSafariBooksStats } from '../services/safariBooks.js';
import { UPSTREAM, proxyTo } from '../services/upstream.js';

const router = Router();

router.use(requireAuth);

async function proxySafariBooks(upstreamPath, req, res) {
  try {
    const token = await getSafariBooksAdminToken();
    return proxyTo(UPSTREAM.SAFARI_BOOKS, upstreamPath, req, res, {
      Authorization: `Bearer ${token}`,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error instanceof Error ? error.message : 'Safari Books upstream error',
    });
  }
}

router.get('/stats', requirePermission('SAFARI_BOOKS_STATS'), async (_req, res) => {
  try {
    const data = await getSafariBooksStats();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to load Safari Books stats',
    });
  }
});

router.get('/listeners', requirePermission('SAFARI_BOOKS_LISTENERS'), (req, res) =>
  proxySafariBooks('/admin/listeners', req, res)
);
router.get('/publishers', requirePermission('SAFARI_BOOKS_PUBLISHERS'), (req, res) =>
  proxySafariBooks('/admin/publishers', req, res)
);
router.get('/books', requirePermission('SAFARI_BOOKS_BOOKS'), (req, res) =>
  proxySafariBooks('/admin/books', req, res)
);
router.get('/pending-verifications', requirePermission('SAFARI_BOOKS_PENDING'), (req, res) =>
  proxySafariBooks('/admin/pending-verifications', req, res)
);

router.post('/reject-publisher/:id', requirePermission('SAFARI_BOOKS_PENDING'), (req, res) => {
  const isCompany = req.query.isCompany ?? req.body?.isCompany;
  const qs = isCompany !== undefined ? `?isCompany=${encodeURIComponent(String(isCompany))}` : '';
  return proxySafariBooks(
    `/admin/reject-publisher/${encodeURIComponent(req.params.id)}${qs}`,
    req,
    res
  );
});

export default router;
