import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenantIsolation';
import { requireRole } from '../middleware/rbac';
import { AgentService, AgentType } from '../services/agentService';
import { logger } from '../config/logger';

const router = Router();
const agentService = new AgentService();

router.use(authenticate, tenantIsolation);

const submitJobSchema = z.object({
  agentType: z.enum([
    'builder', 'debugger', 'tester', 'deployment', 'refactor',
    'security', 'designer', 'analytics', 'devops',
  ]),
  input: z.string().min(1).max(50000),
  projectId: z.string().optional(),
  title: z.string().max(200).optional(),
  model: z.string().optional(),
  priority: z.number().int().min(1).max(10).default(5),
});

// ─── POST /jobs  (submit a job) ───────────────────────────────────────────────
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const result = submitJobSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    const { agentType, input, projectId, title, model, priority } = result.data;

    // Create job record
    const job = await prisma.job.create({
      data: {
        tenantId: req.tenant!.id,
        userId: req.user!.sub,
        projectId,
        agentType,
        title: title ?? `${agentType} task`,
        input,
        model,
        priority,
        status: 'queued',
      },
    });

    // Enqueue in Bull via AgentService
    const queueJobId = await agentService.enqueueJob({
      projectId,
      agentType: agentType as AgentType,
      task: input,
      model,
      tenantId: req.tenant!.id,
      userId: req.user!.sub,
    });

    // Store queue job id (keep status as 'queued'; worker updates to 'running' when it picks up the job)
    await prisma.job.update({
      where: { id: job.id },
      data: { queueJobId: String(queueJobId) },
    });

    res.status(202).json({ jobId: job.id, queueJobId, status: 'queued' });
  } catch (err) {
    logger.error('Job submission error', { error: (err as Error).message });
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /jobs  (list jobs for tenant) ───────────────────────────────────────
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const status = req.query.status as string | undefined;
    const agentType = req.query.agentType as string | undefined;
    const projectId = req.query.projectId as string | undefined;

    const where = {
      tenantId: req.tenant!.id,
      ...(status && { status }),
      ...(agentType && { agentType }),
      ...(projectId && { projectId }),
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { logs: { take: 5, orderBy: { createdAt: 'desc' } } },
      }),
      prisma.job.count({ where }),
    ]);

    res.json({ jobs, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /jobs/stats/summary  (admin: aggregate stats) ───────────────────────
// NOTE: Must be declared BEFORE /:id to avoid Express matching 'stats' as an ID
router.get('/stats/summary', requireRole(['admin', 'super-admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const [byStatus, byAgent] = await Promise.all([
      prisma.job.groupBy({
        by: ['status'],
        where: { tenantId: req.tenant!.id },
        _count: { id: true },
      }),
      prisma.job.groupBy({
        by: ['agentType'],
        where: { tenantId: req.tenant!.id },
        _count: { id: true },
        _sum: { tokens: true, cost: true },
      }),
    ]);
    res.json({ byStatus, byAgent });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /jobs/:id  (job detail + logs) ──────────────────────────────────────
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, tenantId: req.tenant!.id },
      include: { logs: { orderBy: { createdAt: 'asc' } } },
    });
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /jobs/:id/cancel  (cancel a queued/running job) ────────────────────
router.post('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, tenantId: req.tenant!.id },
    });
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    if (!['queued', 'running'].includes(job.status)) {
      res.status(400).json({ error: `Cannot cancel job with status: ${job.status}` });
      return;
    }

    await prisma.job.update({
      where: { id: job.id },
      data: { status: 'cancelled', completedAt: new Date() },
    });

    await prisma.jobLog.create({
      data: {
        jobId: job.id,
        level: 'info',
        message: `Job cancelled by user ${req.user!.sub}`,
      },
    });

    res.json({ message: 'Job cancelled', jobId: job.id });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /jobs/:id/logs  (job logs only) ─────────────────────────────────────
router.get('/:id/logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, tenantId: req.tenant!.id },
      select: { id: true },
    });
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    const logs = await prisma.jobLog.findMany({
      where: { jobId: job.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
