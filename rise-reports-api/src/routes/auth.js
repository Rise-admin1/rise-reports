import { Router } from 'express';
import { prisma } from '../services/prisma.js';
import {
  createSession,
  deleteSessionByToken,
  getEffectivePermissions,
  serializeUser,
  verifyPassword,
} from '../services/session.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const user = await prisma.appUser.findUnique({ where: { username } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const permissions = await getEffectivePermissions(user);
    const session = await createSession(user.id);

    return res.json({
      success: true,
      data: {
        token: session.token,
        expiresAt: session.expiresAt.toISOString(),
        user: serializeUser(user, permissions),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Login failed',
    });
  }
});

router.post('/logout', requireAuth, async (req, res) => {
  try {
    const token = req.auth.session.token;
    await deleteSessionByToken(token);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Logout failed',
    });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  return res.json({
    success: true,
    data: {
      user: req.auth.user,
      expiresAt: req.auth.session.expiresAt.toISOString(),
    },
  });
});

export default router;
