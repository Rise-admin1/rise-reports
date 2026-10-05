import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { getVeloAdminToken, getVeloStats } from '../services/velo.js';
import { UPSTREAM, proxyTo } from '../services/upstream.js';

const router = Router();

router.use(requireAuth);

async function proxyVelo(upstreamPath, req, res) {
  try {
    const token = await getVeloAdminToken();
    return proxyTo(UPSTREAM.VELO, upstreamPath, req, res, {
      Authorization: `Bearer ${token}`,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error instanceof Error ? error.message : 'Velo upstream error',
    });
  }
}

router.get('/stats', requirePermission('VELO_STATS'), async (_req, res) => {
  try {
    const data = await getVeloStats();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to load Velo stats',
    });
  }
});

router.get('/senders', requirePermission('VELO_SENDERS'), (req, res) =>
  proxyVelo('/admin/senders', req, res)
);
router.get('/agents', requirePermission('VELO_AGENTS'), (req, res) =>
  proxyVelo('/admin/agents', req, res)
);
router.get('/shipments', requirePermission('VELO_SHIPMENTS'), (req, res) =>
  proxyVelo('/admin/shipments', req, res)
);
router.get('/purchases', requirePermission('VELO_PURCHASES'), (req, res) =>
  proxyVelo('/admin/purchases', req, res)
);
router.get('/contact-inquiries', requirePermission('VELO_CONTACT_INQUIRIES'), (req, res) =>
  proxyVelo('/admin/contact-inquiries', req, res)
);
router.get('/listings', requirePermission('VELO_LISTINGS'), (req, res) =>
  proxyVelo('/admin/listings', req, res)
);
router.get('/appointment-requests', requirePermission('VELO_APPOINTMENTS'), (req, res) =>
  proxyVelo('/admin/appointment-requests', req, res)
);

router.put('/agents/:agentId/approve', requirePermission('VELO_APPOINTMENTS'), (req, res) =>
  proxyVelo(`/admin/agents/${encodeURIComponent(req.params.agentId)}/approve`, req, res)
);

router.put('/agents/:agentId/decline', requirePermission('VELO_APPOINTMENTS'), (req, res) =>
  proxyVelo(`/admin/agents/${encodeURIComponent(req.params.agentId)}/decline`, req, res)
);

export default router;
