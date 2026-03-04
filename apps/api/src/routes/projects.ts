import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { tenantIsolation } from '../middleware/tenantIsolation';
import { ProjectService } from '../services/projectService';

const router = Router();
router.use(authenticate, tenantIsolation);
const projectService = new ProjectService();

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['active', 'archived', 'draft']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ─── GET /projects ────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page ?? '1'));
    const limit = Math.min(parseInt(String(req.query.limit ?? '20')), 100);
    const status = req.query.status as string | undefined;
    const result = await projectService.listProjects(req.tenant!.id, { page, limit, status });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /projects/:id ────────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await projectService.getProject(req.params.id, req.tenant!.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /projects ───────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const result = createProjectSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    const project = await projectService.createProject({
      ...result.data,
      tenantId: req.tenant!.id,
      userId: req.user!.sub,
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── PATCH /projects/:id ──────────────────────────────────────────────────────
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  const result = updateProjectSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    const project = await projectService.updateProject(req.params.id, req.tenant!.id, result.data);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── DELETE /projects/:id ─────────────────────────────────────────────────────
router.delete('/:id', requireRole(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    await projectService.deleteProject(req.params.id, req.tenant!.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('not found')) {
      res.status(404).json({ error: msg });
    } else {
      res.status(500).json({ error: msg });
    }
  }
});

// ─── GET /projects/:id/stats ──────────────────────────────────────────────────
router.get('/:id/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await projectService.getProjectStats(req.params.id, req.tenant!.id);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
