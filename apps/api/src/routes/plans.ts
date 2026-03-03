import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// ─── GET /plans  (public) ─────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      include: { featureGates: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /plans/:id  (public) ─────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await prisma.plan.findFirst({
      where: { OR: [{ id: req.params.id }, { name: req.params.id }] },
      include: { featureGates: true },
    });
    if (!plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Admin-only routes below
router.use(authenticate, requireRole(['admin', 'super-admin']));

const planSchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  priceMonthly: z.number().min(0).default(0),
  priceYearly: z.number().min(0).default(0),
  stripePriceId: z.string().optional(),
  features: z.array(z.string()).default([]),
  limits: z.record(z.unknown()).default({}),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

// ─── POST /plans ──────────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const result = planSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    const plan = await prisma.plan.create({ data: result.data });
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── PUT /plans/:id ───────────────────────────────────────────────────────────
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const result = planSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    const plan = await prisma.plan.update({
      where: { id: req.params.id },
      data: result.data,
    });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── DELETE /plans/:id ────────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.plan.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'Plan deactivated' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
