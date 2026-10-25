import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  roles: string[];
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionToken?: string;
    }
  }
}

// Secure scrypt password hashing
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

// Generate secure random session token
export function createSession(userId: string, ipAddress?: string, userAgent?: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  // 30 days session
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const stmt = db.prepare(`
    INSERT INTO user_sessions (id, user_id, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(token, userId, expiresAt, ipAddress || 'unknown', userAgent || 'unknown');

  return token;
}

export function revokeSession(token: string): void {
  const stmt = db.prepare(`DELETE FROM user_sessions WHERE id = ?`);
  stmt.run(token);
}

export function getUserBySession(token: string): AuthenticatedUser | null {
  const stmt = db.prepare(`
    SELECT s.user_id, s.expires_at, u.id, u.email, u.full_name, u.phone
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `);
  const row = stmt.get(token) as any;
  if (!row) return null;

  if (new Date(row.expires_at).getTime() < Date.now()) {
    revokeSession(token);
    return null;
  }

  // Fetch roles
  const rolesStmt = db.prepare(`
    SELECT role_id FROM user_roles WHERE user_id = ?
  `);
  const roleRows = rolesStmt.all(row.id) as any[];
  const roles = roleRows.map(r => r.role_id);

  // Fetch permissions across all roles
  const permsStmt = db.prepare(`
    SELECT DISTINCT rp.permission_id
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = ?
  `);
  const permRows = permsStmt.all(row.id) as any[];
  const permissions = permRows.map(p => p.permission_id);

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    roles,
    permissions
  };
}

export function authenticateMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-session-token']) {
    token = String(req.headers['x-session-token']);
  }

  if (token) {
    req.sessionToken = token;
    const user = getUserBySession(token);
    if (user) {
      req.user = user;
    }
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Для доступа к этому разделу требуется авторизация'
    });
  }
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Требуется авторизация'
      });
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      // Audit log the security rejection
      logAudit(req.user.id, 'ACCESS_DENIED_ROLE', 'ROUTE', req.originalUrl, {
        required: allowedRoles,
        userRoles: req.user.roles
      }, req.ip);

      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Недостаточно прав для выполнения действия'
      });
    }

    next();
  };
}

export function requirePermission(permissionId: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Требуется авторизация'
      });
    }

    if (!req.user.permissions.includes(permissionId)) {
      logAudit(req.user.id, 'ACCESS_DENIED_PERMISSION', 'PERMISSION', permissionId, {
        required: permissionId,
        userPermissions: req.user.permissions
      }, req.ip);

      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Требуется разрешение: ${permissionId}`
      });
    }

    next();
  };
}

export function logAudit(
  userId: string | null,
  action: string,
  entityType: string,
  entityId?: string | null,
  details?: Record<string, any>,
  ipAddress?: string
) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      crypto.randomUUID(),
      userId || null,
      action,
      entityType,
      entityId || null,
      details ? JSON.stringify(details) : null,
      ipAddress || 'unknown'
    );
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}
