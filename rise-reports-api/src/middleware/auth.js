import { loadUserFromToken } from '../services/session.js';

function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

export async function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);
    const context = await loadUserFromToken(token);
    if (!context) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.auth = context;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Auth error',
    });
  }
}

export function requireSuperAdmin(req, res, next) {
  if (!req.auth?.user || req.auth.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Super admin access required' });
  }
  return next();
}

export function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.auth?.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (req.auth.user.role === 'SUPER_ADMIN') {
      return next();
    }
    const granted = new Set(req.auth.permissions || []);
    const allowed = permissions.some((permission) => granted.has(permission));
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Missing required permission' });
    }
    return next();
  };
}

export function requireAnyAuthenticatedRole(req, res, next) {
  if (!req.auth?.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  return next();
}
