import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import { logger } from '../config/logger';

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
}

// Augment Express Request for tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantInfo;
    }
  }
}

export async function tenantIsolation(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required before tenant isolation' });
    return;
  }

  const tenantId = req.user.tenantId;
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID missing from token' });
    return;
  }

  const cacheKey = `tenant:${tenantId}`;

  try {
    // Try cache first
    let tenant = await cacheGet<TenantInfo>(cacheKey);

    if (!tenant) {
      const dbTenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, slug: true, plan: true, status: true },
      });

      if (!dbTenant) {
        res.status(403).json({ error: 'Tenant not found' });
        return;
      }

      tenant = dbTenant;
      await cacheSet(cacheKey, tenant, 120); // 2-minute TTL
    }

    if (tenant!.status !== 'active') {
      res.status(403).json({
        error: 'Tenant account is not active',
        status: tenant!.status,
      });
      return;
    }

    req.tenant = tenant ?? undefined;
    next();
  } catch (err) {
    logger.error('Tenant isolation error', { tenantId, error: (err as Error).message });
    res.status(500).json({ error: 'Tenant verification failed' });
  }
}
