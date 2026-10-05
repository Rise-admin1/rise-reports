import { Router } from 'express';
import { prisma } from '../services/prisma.js';
import { normalizePermissions } from '../constants/permissions.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';
import { getEffectivePermissions, hashPassword, serializeUser } from '../services/session.js';

const router = Router();
const ALLOWED_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'USER']);

async function loadSerializedUser(userId) {
  const user = await prisma.appUser.findUnique({ where: { id: userId } });
  if (!user) return null;
  const permissions = await getEffectivePermissions(user);
  return serializeUser(user, permissions);
}

async function replacePermissions(userId, permissions) {
  await prisma.appUserPermission.deleteMany({ where: { userId } });
  if (permissions.length === 0) return;
  await prisma.appUserPermission.createMany({
    data: permissions.map((permission) => ({ userId, permission })),
  });
}

router.use(requireAuth, requireSuperAdmin);

router.get('/', async (_req, res) => {
  try {
    const users = await prisma.appUser.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const data = await Promise.all(
      users.map(async (user) => serializeUser(user, await getEffectivePermissions(user)))
    );
    return res.json({ success: true, data: { users: data } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to list users',
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    const displayName =
      req.body?.displayName === undefined || req.body?.displayName === null
        ? null
        : String(req.body.displayName).trim() || null;
    const role = String(req.body?.role || 'USER').toUpperCase();
    const permissions = normalizePermissions(req.body?.permissions);

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (role !== 'ADMIN' && permissions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Report permissions can only be assigned to ADMIN accounts',
      });
    }

    const existing = await prisma.appUser.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.appUser.create({
      data: {
        username,
        passwordHash,
        displayName,
        role,
        createdById: req.auth.user.id,
      },
    });

    if (role === 'ADMIN') {
      await replacePermissions(user.id, permissions);
    }

    const serialized = await loadSerializedUser(user.id);
    return res.status(201).json({ success: true, data: { user: serialized } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create user',
    });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const target = await prisma.appUser.findUnique({ where: { id } });
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const data = {};
    if (req.body?.displayName !== undefined) {
      data.displayName =
        req.body.displayName === null ? null : String(req.body.displayName).trim() || null;
    }
    if (req.body?.isActive !== undefined) {
      data.isActive = Boolean(req.body.isActive);
    }
    if (req.body?.role !== undefined) {
      const role = String(req.body.role).toUpperCase();
      if (!ALLOWED_ROLES.has(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }
      data.role = role;
    }

    const nextRole = data.role || target.role;
    if (req.body?.permissions !== undefined && nextRole !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Report permissions can only be assigned to ADMIN accounts',
      });
    }

    const updated = await prisma.appUser.update({
      where: { id },
      data,
    });

    if (updated.role === 'ADMIN' && req.body?.permissions !== undefined) {
      await replacePermissions(id, normalizePermissions(req.body.permissions));
    } else if (updated.role !== 'ADMIN') {
      await prisma.appUserPermission.deleteMany({ where: { userId: id } });
    }

    if (data.isActive === false) {
      await prisma.appSession.deleteMany({ where: { userId: id } });
    }

    const serialized = await loadSerializedUser(id);
    return res.json({ success: true, data: { user: serialized } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update user',
    });
  }
});

router.post('/:id/reset-password', async (req, res) => {
  try {
    const id = req.params.id;
    const password = String(req.body?.password || '');
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const target = await prisma.appUser.findUnique({ where: { id } });
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const passwordHash = await hashPassword(password);
    await prisma.appUser.update({ where: { id }, data: { passwordHash } });
    await prisma.appSession.deleteMany({ where: { userId: id } });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to reset password',
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const caller = req.auth.user;

    if (id === caller.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    if (caller.createdById && id === caller.createdById) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete the account that created yours',
      });
    }

    const target = await prisma.appUser.findUnique({ where: { id } });
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await prisma.appUser.delete({ where: { id } });
    return res.json({ success: true, data: { id } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete user',
    });
  }
});

export default router;
