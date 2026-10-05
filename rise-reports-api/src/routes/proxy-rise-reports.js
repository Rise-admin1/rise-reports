import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { proxyTo, UPSTREAM } from '../services/upstream.js';

const router = Router();

router.use(requireAuth);

router.get('/reports', requirePermission('FUNYULA_PAYMENTS'), (req, res) =>
  proxyTo(UPSTREAM.FUNYULA, '/rise-reports/reports', req, res)
);

export default router;
