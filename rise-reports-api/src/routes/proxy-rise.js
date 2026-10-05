import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { proxyTo, UPSTREAM } from '../services/upstream.js';

const router = Router();

router.use(requireAuth);

router.get('/get-profile-reports', requirePermission('RISE_PROFILES'), (req, res) =>
  proxyTo(UPSTREAM.RISE, '/get-profile-reports', req, res)
);

router.get('/get-rise-investors', requirePermission('RISE_INVESTORS'), (req, res) =>
  proxyTo(UPSTREAM.RISE, '/get-rise-investors', req, res)
);

export default router;
