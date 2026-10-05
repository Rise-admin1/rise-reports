import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { getSjpAdminToken, getSjpStats } from '../services/sjp.js';
import { UPSTREAM, proxyTo } from '../services/upstream.js';

const router = Router();

router.use(requireAuth);

async function proxySjp(upstreamPath, req, res) {
  try {
    const token = await getSjpAdminToken();
    return proxyTo(UPSTREAM.SJP, upstreamPath, req, res, {
      Authorization: `Bearer ${token}`,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error instanceof Error ? error.message : 'Scientific Journals Portal upstream error',
    });
  }
}

router.get('/stats', requirePermission('SCIENTIFIC_JOURNALS_STATS'), async (_req, res) => {
  try {
    const data = await getSjpStats();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to load SJP stats',
    });
  }
});

router.get('/users', requirePermission('SCIENTIFIC_JOURNALS_USERS'), (req, res) =>
  proxySjp('/admin/users', req, res)
);
router.get('/reviewers', requirePermission('SCIENTIFIC_JOURNALS_REVIEWERS'), (req, res) =>
  proxySjp('/admin/reviewers', req, res)
);
router.get('/articles', requirePermission('SCIENTIFIC_JOURNALS_ARTICLES'), (req, res) =>
  proxySjp('/admin/articles', req, res)
);
router.get('/payments', requirePermission('SCIENTIFIC_JOURNALS_PAYMENTS'), (req, res) =>
  proxySjp('/admin/payments', req, res)
);
router.get('/subscriptions', requirePermission('SCIENTIFIC_JOURNALS_SUBSCRIPTIONS'), (req, res) =>
  proxySjp('/admin/subscriptions', req, res)
);
router.get('/full-issue-purchases', requirePermission('SCIENTIFIC_JOURNALS_FULL_ISSUES'), (req, res) =>
  proxySjp('/admin/full-issue-purchases', req, res)
);

router.post(
  '/reviewers/:userId/approve',
  requirePermission('SCIENTIFIC_JOURNALS_REVIEWERS'),
  (req, res) =>
    proxySjp(`/admin/reviewers/${encodeURIComponent(req.params.userId)}/approve`, req, res)
);

router.post(
  '/reviewers/:userId/reject',
  requirePermission('SCIENTIFIC_JOURNALS_REVIEWERS'),
  (req, res) =>
    proxySjp(`/admin/reviewers/${encodeURIComponent(req.params.userId)}/reject`, req, res)
);

export default router;
