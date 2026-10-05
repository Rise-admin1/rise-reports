import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { proxyTo, UPSTREAM } from '../services/upstream.js';

const router = Router();

function schedulingPermission(req, res, next) {
  const appSource =
    (typeof req.query?.appSource === 'string' && req.query.appSource) ||
    (typeof req.body?.appSource === 'string' && req.body.appSource) ||
    '';

  if (appSource === 'rise') {
    return requirePermission('RISE_SCHEDULING')(req, res, next);
  }
  if (appSource === 'phd-success') {
    return requirePermission('PHD_SCHEDULING')(req, res, next);
  }

  // Availability settings list has no appSource — allow either scheduling permission
  return requirePermission('RISE_SCHEDULING', 'PHD_SCHEDULING')(req, res, next);
}

router.use(requireAuth, schedulingPermission);

router.get('/metrics', (req, res) => proxyTo(UPSTREAM.FUNYULA, '/scheduling/metrics', req, res));
router.get('/booking-stats', (req, res) =>
  proxyTo(UPSTREAM.FUNYULA, '/scheduling/booking-stats', req, res)
);
router.get('/session-credits/list', (req, res) =>
  proxyTo(UPSTREAM.FUNYULA, '/scheduling/session-credits/list', req, res)
);
router.get('/session-credits', (req, res) =>
  proxyTo(UPSTREAM.FUNYULA, '/scheduling/session-credits', req, res)
);
router.post('/session-credits/grant', (req, res) =>
  proxyTo(UPSTREAM.FUNYULA, '/scheduling/session-credits/grant', req, res)
);
router.get('/availability-settings', (req, res) =>
  proxyTo(UPSTREAM.FUNYULA, '/scheduling/availability-settings', req, res)
);
router.post('/availability-settings', (req, res) =>
  proxyTo(UPSTREAM.FUNYULA, '/scheduling/availability-settings', req, res)
);
router.put('/availability-settings/:id', (req, res) =>
  proxyTo(
    UPSTREAM.FUNYULA,
    `/scheduling/availability-settings/${encodeURIComponent(req.params.id)}`,
    req,
    res
  )
);
router.delete('/availability-settings/:id', (req, res) =>
  proxyTo(
    UPSTREAM.FUNYULA,
    `/scheduling/availability-settings/${encodeURIComponent(req.params.id)}`,
    req,
    res
  )
);
router.post('/invites', (req, res) => proxyTo(UPSTREAM.FUNYULA, '/scheduling/invites', req, res));
router.get('/meetings', (req, res) => proxyTo(UPSTREAM.FUNYULA, '/scheduling/meetings', req, res));
router.post('/meetings/:id/cancel', (req, res) =>
  proxyTo(UPSTREAM.FUNYULA, `/scheduling/meetings/${encodeURIComponent(req.params.id)}/cancel`, req, res)
);
router.patch('/meetings/:id/reschedule', (req, res) =>
  proxyTo(
    UPSTREAM.FUNYULA,
    `/scheduling/meetings/${encodeURIComponent(req.params.id)}/reschedule`,
    req,
    res
  )
);

export default router;
