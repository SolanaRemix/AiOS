import { Request, Response, NextFunction } from 'express';

export type Role = 'super-admin' | 'admin' | 'dev' | 'user';

const ROLE_HIERARCHY: Record<Role, number> = {
  'super-admin': 100,
  'admin': 75,
  'dev': 50,
  'user': 25,
};

/**
 * requireRole(['admin', 'super-admin']) – allows any of the listed roles.
 * Uses hierarchy: super-admin > admin > dev > user.
 */
export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    const userRole = req.user.role as Role;
    const userLevel = ROLE_HIERARCHY[userRole] ?? 0;

    const hasPermission = allowedRoles.some((role) => {
      const requiredLevel = ROLE_HIERARCHY[role] ?? 0;
      // Allow if user's level meets or exceeds the required level
      return userLevel >= requiredLevel;
    });

    if (!hasPermission) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole,
      });
      return;
    }

    next();
  };
}

/** Convenience shortcuts */
export const requireSuperAdmin = requireRole(['super-admin']);
export const requireAdmin = requireRole(['admin']);
export const requireDev = requireRole(['dev']);

/** Check if the user's role has at least a given rank */
export function hasRole(userRole: string, minimumRole: Role): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as Role] ?? 0;
  const minLevel = ROLE_HIERARCHY[minimumRole] ?? 0;
  return userLevel >= minLevel;
}
