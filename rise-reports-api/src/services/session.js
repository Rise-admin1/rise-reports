import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../services/prisma.js';
import { ALL_REPORT_PERMISSIONS, expandPermissions } from '../constants/permissions.js';

const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS || 24);

export function getSessionExpiresAt() {
  return new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function serializeUser(user, permissions) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    createdById: user.createdById,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    permissions,
  };
}

export async function getEffectivePermissions(user) {
  if (user.role === 'SUPER_ADMIN') {
    return [...ALL_REPORT_PERMISSIONS];
  }
  if (user.role === 'USER') {
    return [];
  }
  const rows = await prisma.appUserPermission.findMany({
    where: { userId: user.id },
    select: { permission: true },
  });
  return expandPermissions(rows.map((row) => row.permission));
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = getSessionExpiresAt();
  await prisma.appSession.create({
    data: { token, userId, expiresAt },
  });
  return { token, expiresAt };
}

export async function deleteSessionByToken(token) {
  if (!token) return;
  await prisma.appSession.deleteMany({ where: { token } });
}

export async function deleteExpiredSessions() {
  await prisma.appSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}

export async function loadUserFromToken(token) {
  if (!token) return null;

  const session = await prisma.appSession.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.appSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (!session.user || !session.user.isActive) {
    return null;
  }

  const permissions = await getEffectivePermissions(session.user);
  return {
    session,
    user: serializeUser(session.user, permissions),
    rawUser: session.user,
    permissions,
  };
}
