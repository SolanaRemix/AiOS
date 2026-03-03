import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenantIsolation';
import { agentLimiter } from '../middleware/rateLimiter';
import { AgentService } from '../services/agentService';

const router = Router();
router.use(authenticate, tenantIsolation);
const agentService = new AgentService();

const executeSchema = z.object({
  projectId: z.string().optional(),
  agentType: z.enum([
    'builder', 'debugger', 'tester', 'deployment',
    'refactor', 'security', 'designer', 'analytics', 'devops',
  ]),
  task: z.string().min(1).max(10_000),
  context: z.record(z.unknown()).optional(),
  model: z.string().optional(),
  stream: z.boolean().default(false),
});

// ─── POST /agents/execute ─────────────────────────────────────────────────────
router.post('/execute', agentLimiter, async (req: Request, res: Response): Promise<void> => {
  const result = executeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    const job = await agentService.enqueueTask({
      ...result.data,
      tenantId: req.tenant!.id,
      userId: req.user!.sub,
    });
    res.status(202).json({
      jobId: job.id,
      status: 'queued',
      message: 'Task queued for processing',
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /agents/status/:jobId ────────────────────────────────────────────────
router.get('/status/:jobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await agentService.getJobStatus(req.params.jobId, req.tenant!.id);
    if (!status) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /agents/logs ─────────────────────────────────────────────────────────
router.get('/logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page ?? '1'));
    const limit = Math.min(parseInt(String(req.query.limit ?? '20')), 100);
    const projectId = req.query.projectId as string | undefined;
    const agentType = req.query.agentType as string | undefined;

    const logs = await agentService.getLogs(req.tenant!.id, { page, limit, projectId, agentType });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /agents/logs/:id ─────────────────────────────────────────────────────
router.get('/logs/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const log = await agentService.getLogById(req.params.id, req.tenant!.id);
    if (!log) {
      res.status(404).json({ error: 'Log not found' });
      return;
    }
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /agents/cancel/:jobId ───────────────────────────────────────────────
router.post('/cancel/:jobId', async (req: Request, res: Response): Promise<void> => {
  try {
    await agentService.cancelJob(req.params.jobId, req.tenant!.id);
    res.json({ message: 'Job cancelled' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
