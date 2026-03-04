import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenantIsolation';
import { federationLimiter } from '../middleware/rateLimiter';
import { FederationService } from '../services/federationService';

const router = Router();
router.use(authenticate, tenantIsolation);
const federationService = new FederationService();

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string().min(1),
    }),
  ).min(1),
  model: z.string().optional(),
  taskType: z.enum(['general', 'code', 'analysis', 'creative', 'math', 'fast']).default('general'),
  maxTokens: z.number().int().min(1).max(32_000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  stream: z.boolean().default(false),
});

const completionSchema = z.object({
  prompt: z.string().min(1).max(50_000),
  model: z.string().optional(),
  taskType: z.enum(['general', 'code', 'analysis', 'creative', 'math', 'fast']).default('general'),
  maxTokens: z.number().int().min(1).max(32_000).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

const selectModelSchema = z.object({
  taskType: z.enum(['general', 'code', 'analysis', 'creative', 'math', 'fast']),
  preferCost: z.boolean().default(false),
  preferSpeed: z.boolean().default(false),
  maxCostPer1k: z.number().positive().optional(),
});

// ─── POST /federation/chat ────────────────────────────────────────────────────
router.post('/chat', federationLimiter, async (req: Request, res: Response): Promise<void> => {
  const result = chatSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    const response = await federationService.chat({
      ...result.data,
      tenantId: req.tenant!.id,
      userId: req.user!.sub,
    });
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /federation/complete ────────────────────────────────────────────────
router.post('/complete', federationLimiter, async (req: Request, res: Response): Promise<void> => {
  const result = completionSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    const response = await federationService.complete({
      ...result.data,
      tenantId: req.tenant!.id,
      userId: req.user!.sub,
    });
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /federation/models ───────────────────────────────────────────────────
router.get('/models', async (req: Request, res: Response): Promise<void> => {
  try {
    const models = await federationService.listAvailableModels(req.tenant!.id);
    res.json({ models });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /federation/select-model ────────────────────────────────────────────
router.post('/select-model', async (req: Request, res: Response): Promise<void> => {
  const result = selectModelSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    const model = await federationService.selectModel(result.data, req.tenant!.id);
    res.json({ selectedModel: model });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /federation/usage ────────────────────────────────────────────────────
router.get('/usage', async (req: Request, res: Response): Promise<void> => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;
    const usage = await federationService.getUsageSummary(req.tenant!.id, { from, to });
    res.json(usage);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
