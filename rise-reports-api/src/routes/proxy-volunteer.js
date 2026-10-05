import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { proxyTo, UPSTREAM } from '../services/upstream.js';

const router = Router();

router.use(requireAuth);

router.get('/all', requirePermission('FUNYULA_VOLUNTEERS'), (req, res) =>
  proxyTo(UPSTREAM.FUNYULA, '/volunteer/all', req, res)
);

router.delete('/entry/:id', requirePermission('FUNYULA_VOLUNTEERS'), (req, res) =>
  proxyTo(UPSTREAM.FUNYULA, `/volunteer/entry/${encodeURIComponent(req.params.id)}`, req, res)
);

router.get('/expo-register/all', requirePermission('FUNYULA_SAMIA_WOMEN'), (req, res) =>
  proxyTo(UPSTREAM.FUNYULA, '/volunteer/expo-register/all', req, res)
);

router.delete('/expo-register/:id', requirePermission('FUNYULA_SAMIA_WOMEN'), (req, res) =>
  proxyTo(UPSTREAM.FUNYULA, `/volunteer/expo-register/${encodeURIComponent(req.params.id)}`, req, res)
);

router.get('/get-manifesto-users', requirePermission('FUNYULA_MANIFESTO'), (req, res) =>
  proxyTo(UPSTREAM.FUNYULA, '/volunteer/get-manifesto-users', req, res)
);

export default router;
