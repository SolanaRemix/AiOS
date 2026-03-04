import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { prisma } from '../config/database';
import { cacheDel } from '../config/redis';

const router = Router();
router.use(authenticate);

const createTenantSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']).default('free'),
});

const updateTenantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']).optional(),
  status: z.enum(['active', 'suspended', 'cancelled']).optional(),
});

// ─── GET /tenants – list all (super-admin only) ───────────────────────────────
router.get('/', requireRole(['super-admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page ?? '1'));
    const limit = Math.min(parseInt(String(req.query.limit ?? '20')), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;

    const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { slug: { contains: search } }] } : {};

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: { _count: { select: { users: true, projects: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tenant.count({ where }),
    ]);

    res.json({ tenants, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /tenants/:id ─────────────────────────────────────────────────────────
router.get('/:id', requireRole(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isSuperAdmin = req.user!.role === 'super-admin';
    const queryId = isSuperAdmin ? id : req.user!.tenantId;
    // Non-super-admins can only view their own tenant
    if (!isSuperAdmin && id !== req.user!.tenantId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: queryId },
      include: { _count: { select: { users: true, projects: true } } },
    });

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /tenants – create (super-admin only) ────────────────────────────────
router.post('/', requireRole(['super-admin']), async (req: Request, res: Response): Promise<void> => {
  const result = createTenantSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    const existing = await prisma.tenant.findUnique({ where: { slug: result.data.slug } });
    if (existing) {
      res.status(409).json({ error: 'Tenant with this slug already exists' });
      return;
    }
    const tenant = await prisma.tenant.create({ data: result.data });
    res.status(201).json(tenant);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── PATCH /tenants/:id ───────────────────────────────────────────────────────
router.patch('/:id', requireRole(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isSuperAdmin = req.user!.role === 'super-admin';
    if (!isSuperAdmin && id !== req.user!.tenantId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const result = updateTenantSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
      return;
    }

    // Only super-admins can suspend/cancel tenants
    if (result.data.status && !isSuperAdmin) {
      res.status(403).json({ error: 'Only super-admins can change tenant status' });
      return;
    }

    const tenant = await prisma.tenant.update({ where: { id }, data: result.data });
    await cacheDel(`tenant:${id}`);
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── DELETE /tenants/:id (super-admin only) ───────────────────────────────────
router.delete('/:id', requireRole(['super-admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.tenant.delete({ where: { id } });
    await cacheDel(`tenant:${id}`);
    res.json({ message: 'Tenant deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
