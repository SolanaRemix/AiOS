import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

/**
 * Check whether the current tenant's plan allows a specific feature.
 * Usage: router.post('/agents', featureGate('max_agents'), handler)
 */
export function featureGate(feature: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({ error: 'Tenant context required' });
        return;
      }

      // Get the tenant's current plan
      const billing = await prisma.billing.findUnique({
        where: { tenantId },
        select: { plan: true },
      });
      const planName = billing?.plan ?? 'free';

      // Look up the feature gate for this plan
      const gate = await prisma.featureGate.findFirst({
        where: {
          feature,
          plan: { name: planName, isActive: true },
        },
        include: { plan: true },
      });

      if (!gate) {
        // No gate defined → allow by default
        next();
        return;
      }

      // "false", "0", or "unlimited" check
      if (gate.value === 'false' || gate.value === '0') {
        res.status(403).json({
          error: 'Feature not available on your current plan',
          feature,
          plan: planName,
          upgrade: true,
        });
        return;
      }

      // "unlimited" means no limit – allow through
      if (gate.value === 'unlimited') {
        next();
        return;
      }

      // Numeric limit check (e.g. max_agents = "5")
      const limit = parseInt(gate.value, 10);
      if (!isNaN(limit) && limit >= 0) {
        const count = await getResourceCount(feature, tenantId);
        if (count >= limit) {
          res.status(403).json({
            error: `Plan limit reached for ${feature}`,
            feature,
            plan: planName,
            limit,
            current: count,
            upgrade: true,
          });
          return;
        }
      }

      next();
    } catch (err) {
      logger.error('FeatureGate error', { error: (err as Error).message, feature, tenantId: req.tenant?.id });
      // Fail closed: surface the error rather than silently allowing bypass of plan limits
      res.status(503).json({ error: 'Feature gate check temporarily unavailable. Please try again.' });
    }
  };
}

async function getResourceCount(feature: string, tenantId: string): Promise<number> {
  switch (feature) {
    case 'max_projects':
      return prisma.project.count({ where: { tenantId, status: { not: 'archived' } } });
    case 'max_agents':
    case 'max_jobs':
      return prisma.job.count({
        where: {
          tenantId,
          status: { in: ['queued', 'running'] },
        },
      });
    default:
      return 0;
  }
}
