import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { getDubaiAnalyticaAdminToken, getDubaiAnalyticaStats } from '../services/dubaiAnalytica.js';
import { UPSTREAM, proxyTo } from '../services/upstream.js';

const router = Router();

router.use(requireAuth);

async function proxyDubaiAnalytica(upstreamPath, req, res) {
  try {
    const token = await getDubaiAnalyticaAdminToken();
    return proxyTo(UPSTREAM.DUBAI_ANALYTICA, upstreamPath, req, res, {
      Authorization: `Bearer ${token}`,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error instanceof Error ? error.message : 'Dubai Analytica upstream error',
    });
  }
}

router.get('/stats', requirePermission('DUBAI_ANALYTICA_STATS'), async (_req, res) => {
  try {
    const data = await getDubaiAnalyticaStats();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to load Dubai Analytica stats',
    });
  }
});

router.get('/users', requirePermission('DUBAI_ANALYTICA_USERS'), (req, res) =>
  proxyDubaiAnalytica('/admin/users', req, res)
);
router.get('/surveys', requirePermission('DUBAI_ANALYTICA_SURVEYS'), (req, res) =>
  proxyDubaiAnalytica('/admin/surveys', req, res)
);
router.get('/purchases', requirePermission('DUBAI_ANALYTICA_PURCHASES'), (req, res) =>
  proxyDubaiAnalytica('/admin/purchases', req, res)
);
router.get('/subscriptions', requirePermission('DUBAI_ANALYTICA_SUBSCRIPTIONS'), (req, res) =>
  proxyDubaiAnalytica('/admin/subscriptions', req, res)
);
router.get('/dri-payments', requirePermission('DUBAI_ANALYTICA_DRI_PAYMENTS'), (req, res) =>
  proxyDubaiAnalytica('/admin/dri-payments', req, res)
);

export default router;
