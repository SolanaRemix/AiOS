import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { tenantIsolation } from '../middleware/tenantIsolation';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

const router = Router();

// All user routes require auth + tenant isolation
router.use(authenticate, tenantIsolation);

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['admin', 'dev', 'user']).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

// ─── GET /users ───────────────────────────────────────────────────────────────
router.get('/', requireRole(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page ?? '1'));
    const limit = Math.min(parseInt(String(req.query.limit ?? '20')), 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId: req.tenant!.id },
        select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: { tenantId: req.tenant!.id } }),
    ]);

    res.json({ users, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /users/:id ───────────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // Users can only view themselves; admins can view anyone in their tenant
    const isAdmin = ['admin', 'super-admin'].includes(req.user!.role);
    if (!isAdmin && req.user!.sub !== id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { id, tenantId: req.tenant!.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── PATCH /users/:id ─────────────────────────────────────────────────────────
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdmin = ['admin', 'super-admin'].includes(req.user!.role);
    if (!isAdmin && req.user!.sub !== id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const result = updateUserSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
      return;
    }

    // Only admins can change roles
    if (result.data.role && !isAdmin) {
      res.status(403).json({ error: 'Only admins can change user roles' });
      return;
    }

    const user = await prisma.user.update({
      where: { id, tenantId: req.tenant!.id },
      data: result.data,
      select: { id: true, email: true, name: true, role: true, updatedAt: true },
    });
    res.json(user);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('Record to update not found')) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: msg });
    }
  }
});

// ─── POST /users/:id/change-password ─────────────────────────────────────────
router.post('/:id/change-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (req.user!.sub !== id) {
      res.status(403).json({ error: 'You can only change your own password' });
      return;
    }

    const result = changePasswordSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
      return;
    }

    const user = await prisma.user.findFirst({ where: { id, tenantId: req.tenant!.id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const valid = await bcrypt.compare(result.data.currentPassword, user.password);
    if (!valid) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    const hashed = await bcrypt.hash(result.data.newPassword, 12);
    await prisma.user.update({ where: { id }, data: { password: hashed } });
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── DELETE /users/:id ────────────────────────────────────────────────────────
router.delete('/:id', requireRole(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // Prevent self-deletion
    if (req.user!.sub === id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    await prisma.user.delete({ where: { id, tenantId: req.tenant!.id } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('Record to delete does not exist')) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: msg });
    }
  }
});

export default router;
