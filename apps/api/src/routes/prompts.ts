import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenantIsolation';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

const router = Router();
router.use(authenticate, tenantIsolation);

// ─── Validation schemas ───────────────────────────────────────────────────────
const createPromptSchema = z.object({
  title:       z.string().min(1).max(200),
  content:     z.string().min(1),
  description: z.string().max(1000).optional(),
  tags:        z.array(z.string()).default([]),
  category:    z.string().default('general'),
  visibility:  z.enum(['public', 'private']).default('private'),
  price:       z.number().min(0).default(0),
});

const updatePromptSchema = createPromptSchema.partial();

const listQuerySchema = z.object({
  category:   z.string().optional(),
  visibility: z.enum(['public', 'private']).optional(),
  free:       z.enum(['true', 'false']).optional(),
  page:       z.coerce.number().min(1).default(1),
  limit:      z.coerce.number().min(1).max(100).default(20),
});

// ─── GET /prompts – list (my prompts by default) ─────────────────────────────
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const q = listQuerySchema.safeParse(req.query);
  if (!q.success) {
    res.status(400).json({ error: 'Invalid query', details: q.error.flatten() });
    return;
  }
  const { category, visibility, free, page, limit } = q.data;
  try {
    const where = {
      userId:     req.user!.sub,
      tenantId:   req.tenant!.id,
      ...(category   && { category }),
      ...(visibility && { visibility }),
      ...(free === 'true'  && { price: 0 }),
      ...(free === 'false' && { price: { gt: 0 } }),
    };
    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        include: { _count: { select: { likes: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.prompt.count({ where }),
    ]);
    res.json({ prompts, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /prompts/marketplace – public marketplace ───────────────────────────
router.get('/marketplace', async (req: Request, res: Response): Promise<void> => {
  const q = listQuerySchema.safeParse(req.query);
  if (!q.success) {
    res.status(400).json({ error: 'Invalid query', details: q.error.flatten() });
    return;
  }
  const { category, free, page, limit } = q.data;
  try {
    const where = {
      visibility: 'public' as const,
      ...(category  && { category }),
      ...(free === 'true'  && { price: 0 }),
      ...(free === 'false' && { price: { gt: 0 } }),
    };
    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          _count: { select: { likes: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.prompt.count({ where }),
    ]);
    res.json({ prompts, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /prompts – create ───────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const result = createPromptSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    const prompt = await prisma.prompt.create({
      data: {
        ...result.data,
        userId:   req.user!.sub,
        tenantId: req.tenant!.id,
      },
    });
    logger.info('Prompt created', { promptId: prompt.id, userId: req.user!.sub });
    res.status(201).json(prompt);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /prompts/:id – read single ──────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const prompt = await prisma.prompt.findFirst({
      where: {
        id:       req.params.id,
        OR: [
          { userId: req.user!.sub },
          { visibility: 'public' },
        ],
      },
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { likes: true } },
      },
    });
    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }
    // Increment view count (fire-and-forget)
    if (prompt.userId !== req.user!.sub) {
      prisma.prompt.update({ where: { id: prompt.id }, data: { viewCount: { increment: 1 } } }).catch(() => null);
    }
    res.json(prompt);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── PATCH /prompts/:id – update ─────────────────────────────────────────────
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  const result = updatePromptSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    const prompt = await prisma.prompt.findFirst({
      where: { id: req.params.id, userId: req.user!.sub },
    });
    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }
    const updated = await prisma.prompt.update({
      where: { id: req.params.id },
      data: result.data,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── DELETE /prompts/:id – delete ────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const prompt = await prisma.prompt.findFirst({
      where: { id: req.params.id, userId: req.user!.sub },
    });
    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }
    await prisma.prompt.delete({ where: { id: req.params.id } });
    res.json({ message: 'Prompt deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /prompts/:id/like – like ───────────────────────────────────────────
router.post('/:id/like', async (req: Request, res: Response): Promise<void> => {
  try {
    const prompt = await prisma.prompt.findFirst({
      where: {
        id: req.params.id,
        OR: [{ userId: req.user!.sub }, { visibility: 'public' }],
      },
    });
    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }
    await prisma.promptLike.create({
      data: { promptId: req.params.id, userId: req.user!.sub },
    });
    res.status(201).json({ message: 'Liked' });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('Unique constraint')) {
      res.status(409).json({ error: 'Already liked' });
    } else {
      res.status(500).json({ error: msg });
    }
  }
});

// ─── DELETE /prompts/:id/like – unlike ───────────────────────────────────────
router.delete('/:id/like', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.promptLike.deleteMany({
      where: { promptId: req.params.id, userId: req.user!.sub },
    });
    res.json({ message: 'Unliked' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
