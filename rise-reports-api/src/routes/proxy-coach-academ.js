import { Router } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { getCoachAcademAdminToken, getCoachAcademStats } from '../services/coachAcadem.js';
import { proxyTo, UPSTREAM } from '../services/upstream.js';

const router = Router();

router.use(requireAuth);

async function proxyCoachAcadem(upstreamPath, req, res) {
  try {
    const token = await getCoachAcademAdminToken();
    return proxyTo(UPSTREAM.COACH_ACADEM, upstreamPath, req, res, {
      Authorization: `Bearer ${token}`,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error instanceof Error ? error.message : 'Coach Academ upstream error',
    });
  }
}

router.get('/stats', requirePermission('COACH_ACADEM_STATS'), async (_req, res) => {
  try {
    const data = await getCoachAcademStats();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to load Coach Academ stats',
    });
  }
});

router.get(
  '/subjects/pending',
  requirePermission('COACH_ACADEM_PENDING_SUBJECTS'),
  (req, res) => proxyCoachAcadem('/subjects/verify', req, res)
);

router.put(
  '/subjects/:subjectId/verify',
  requirePermission('COACH_ACADEM_PENDING_SUBJECTS'),
  (req, res) =>
    proxyCoachAcadem(`/subjects/verify/${encodeURIComponent(req.params.subjectId)}`, req, res)
);

router.put(
  '/subjects/:subjectId/reject',
  requirePermission('COACH_ACADEM_PENDING_SUBJECTS'),
  (req, res) =>
    proxyCoachAcadem(`/subjects/reject/${encodeURIComponent(req.params.subjectId)}`, req, res)
);

router.get('/subjects/verified', requirePermission('COACH_ACADEM_PENDING_SUBJECTS'), (req, res) =>
  proxyCoachAcadem('/subjects', req, res)
);

router.get('/teachers', requirePermission('COACH_ACADEM_TEACHERS'), (req, res) =>
  proxyCoachAcadem('/admin/teachers', req, res)
);

router.get('/parents', requirePermission('COACH_ACADEM_PARENTS'), (req, res) =>
  proxyCoachAcadem('/admin/parents', req, res)
);

router.get('/organizations', requirePermission('COACH_ACADEM_ORGANIZATIONS'), (req, res) =>
  proxyCoachAcadem('/admin/organizations', req, res)
);

router.get('/purchases', requirePermission('COACH_ACADEM_PURCHASES'), (req, res) =>
  proxyCoachAcadem('/admin/purchases', req, res)
);

router.get('/reports', requirePermission('COACH_ACADEM_REPORTS'), (req, res) =>
  proxyCoachAcadem('/reports/', req, res)
);

export default router;
