import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import {
  applyGrant,
  isMissingPackageTable,
  overlayBookingStats,
  overlayCreditList,
  overlayCreditResponse,
  readScheduling,
  setPackage,
} from '../services/sessionPackages.js';
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
router.get('/booking-stats', async (req, res) => {
  try {
    const result = await readScheduling('/scheduling/booking-stats', req.query);
    if (!result.ok) return res.status(result.status).json(result.json);
    const body = await overlayBookingStats(result.json, req.query.email, req.query.appSource);
    return res.json(body);
  } catch (error) {
    if (isMissingPackageTable(error)) {
      return proxyTo(UPSTREAM.FUNYULA, '/scheduling/booking-stats', req, res);
    }
    return res.status(error.status || 500).json({ message: error.message });
  }
});
router.get('/session-credits/list', async (req, res) => {
  try {
    const result = await readScheduling('/scheduling/session-credits/list', req.query);
    if (!result.ok) return res.status(result.status).json(result.json);
    const body = await overlayCreditList(result.json, req.query.appSource);
    return res.json(body);
  } catch (error) {
    if (isMissingPackageTable(error)) {
      return proxyTo(UPSTREAM.FUNYULA, '/scheduling/session-credits/list', req, res);
    }
    return res.status(error.status || 500).json({ message: error.message });
  }
});
router.get('/session-credits', async (req, res) => {
  try {
    const result = await readScheduling('/scheduling/session-credits', req.query);
    if (!result.ok) return res.status(result.status).json(result.json);
    const body = await overlayCreditResponse(result.json, req.query.email, req.query.appSource);
    return res.json(body);
  } catch (error) {
    if (isMissingPackageTable(error)) {
      return proxyTo(UPSTREAM.FUNYULA, '/scheduling/session-credits', req, res);
    }
    return res.status(error.status || 500).json({ message: error.message });
  }
});
router.post('/session-credits/grant', async (req, res) => {
  try {
    const body = await applyGrant({
      email: req.body?.email,
      appSource: req.body?.appSource,
      sessions: req.body?.sessions,
      alreadyFulfilled: req.body?.alreadyFulfilled,
      notes: req.body?.notes,
      sendEmail: req.body?.sendEmail,
    });
    return res.json(body);
  } catch (error) {
    if (isMissingPackageTable(error)) {
      return proxyTo(UPSTREAM.FUNYULA, '/scheduling/session-credits/grant', req, res);
    }
    return res.status(error.status || 500).json({ message: error.message });
  }
});
router.post('/session-credits/update', async (req, res) => {
  try {
    const body = await setPackage({
      email: req.body?.email,
      appSource: req.body?.appSource,
      totalSessions: req.body?.totalSessions,
      fulfilledSessions: req.body?.fulfilledSessions,
    });
    return res.json(body);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});
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
