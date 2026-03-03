import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

const router = Router();
router.use(authenticate, requireRole(['super-admin']));

// ─── GET /admin/overview ──────────────────────────────────────────────────────
router.get('/overview', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [tenantCount, userCount, projectCount, agentLogCount, usageAgg] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.agentLog.count(),
      prisma.usage.aggregate({
        _sum: { tokens: true, cost: true },
        where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    res.json({
      totals: {
        tenants: tenantCount,
        users: userCount,
        projects: projectCount,
        agentLogs: agentLogCount,
      },
      last30Days: {
        tokens: usageAgg._sum.tokens ?? 0,
        cost: usageAgg._sum.cost ?? 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /admin/tenants ───────────────────────────────────────────────────────
router.get('/tenants', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page ?? '1'));
    const limit = Math.min(parseInt(String(req.query.limit ?? '20')), 100);
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        include: {
          _count: { select: { users: true, projects: true } },
          billing: { select: { plan: true, status: true, currentPeriodEnd: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tenant.count(),
    ]);

    res.json({ tenants, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /admin/users ─────────────────────────────────────────────────────────
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page ?? '1'));
    const limit = Math.min(parseInt(String(req.query.limit ?? '20')), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;

    const where = search
      ? { OR: [{ email: { contains: search, mode: 'insensitive' as const } }, { name: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true, role: true, tenantId: true, createdAt: true, tenant: { select: { name: true, slug: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /admin/usage ─────────────────────────────────────────────────────────
router.get('/usage', async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(String(req.query.days ?? '30'));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const usage = await prisma.usage.groupBy({
      by: ['model', 'date'],
      _sum: { tokens: true, cost: true },
      where: { date: { gte: since } },
      orderBy: { date: 'desc' },
    });

    const byTenant = await prisma.usage.groupBy({
      by: ['tenantId'],
      _sum: { tokens: true, cost: true },
      where: { date: { gte: since } },
      orderBy: { _sum: { cost: 'desc' } },
      take: 10,
    });

    res.json({ daily: usage, topTenants: byTenant });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /admin/agent-logs ────────────────────────────────────────────────────
router.get('/agent-logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page ?? '1'));
    const limit = Math.min(parseInt(String(req.query.limit ?? '20')), 100);
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const where = status ? { status } : {};
    const [logs, total] = await Promise.all([
      prisma.agentLog.findMany({
        where,
        include: { tenant: { select: { name: true, slug: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.agentLog.count({ where }),
    ]);

    res.json({ logs, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /admin/flush-cache ──────────────────────────────────────────────────
router.post('/flush-cache', async (_req: Request, res: Response): Promise<void> => {
  try {
    await redis.flushdb();
    logger.info('Admin: Redis cache flushed');
    res.json({ message: 'Cache flushed successfully' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /admin/system-health ─────────────────────────────────────────────────
router.get('/system-health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [dbResult, redisPing] = await Promise.all([
      prisma.$queryRaw<[{ now: Date }]>`SELECT NOW() as now`,
      redis.ping(),
    ]);
    res.json({
      db: { status: 'ok', serverTime: (dbResult as any)[0]?.now },
      redis: { status: redisPing === 'PONG' ? 'ok' : 'error' },
      process: {
        uptime: process.uptime(),
        memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        nodeVersion: process.version,
      },
    });
  } catch (err) {
    res.status(503).json({ error: (err as Error).message });
  }
});

export default router;
