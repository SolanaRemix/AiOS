import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenantIsolation';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

const router = Router();
router.use(authenticate, tenantIsolation);

// ─── Profile schemas ──────────────────────────────────────────────────────────
const upsertProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  website: z.string().url().optional(),
  twitter: z.string().max(100).optional(),
  github: z.string().max(100).optional(),
  isPublic: z.boolean().optional(),
});

// ─── GET /social/profile – current user's profile ────────────────────────────
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: req.user!.sub },
      include: {
        _count: { select: { followers: true, following: true } },
      },
    });
    res.json(profile ?? {});
  } catch (err) {
    logger.error('GET /social/profile error', { error: (err as Error).message });
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── PUT /social/profile – upsert current user's profile ─────────────────────
router.put('/profile', async (req: Request, res: Response): Promise<void> => {
  const result = upsertProfileSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    const profile = await prisma.userProfile.upsert({
      where: { userId: req.user!.sub },
      create: { userId: req.user!.sub, ...result.data },
      update: result.data,
    });
    res.json(profile);
  } catch (err) {
    logger.error('PUT /social/profile error', { error: (err as Error).message });
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /social/profile/:userId – another user's public profile ──────────────
router.get('/profile/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await prisma.userProfile.findFirst({
      where: { userId: req.params.userId, isPublic: true },
      include: {
        user: { select: { id: true, name: true, email: false } },
        _count: { select: { followers: true, following: true } },
      },
    });
    if (!profile) {
      res.status(404).json({ error: 'Profile not found or private' });
      return;
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /social/follow/:userId – follow a user ─────────────────────────────
router.post('/follow/:userId', async (req: Request, res: Response): Promise<void> => {
  if (req.params.userId === req.user!.sub) {
    res.status(400).json({ error: 'Cannot follow yourself' });
    return;
  }
  try {
    // Verify the target user exists and belongs to the current tenant
    const targetUser = await prisma.user.findFirst({
      where: { id: req.params.userId, tenantId: req.tenant!.id },
    });
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Ensure both users have profiles
    const [followerProfile, followingProfile] = await Promise.all([
      prisma.userProfile.upsert({
        where: { userId: req.user!.sub },
        create: { userId: req.user!.sub },
        update: {},
      }),
      prisma.userProfile.upsert({
        where: { userId: req.params.userId },
        create: { userId: req.params.userId },
        update: {},
      }),
    ]);

    await prisma.follow.create({
      data: { followerId: followerProfile.id, followingId: followingProfile.id },
    });
    res.status(201).json({ message: 'Followed successfully' });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('Unique constraint')) {
      res.status(409).json({ error: 'Already following this user' });
    } else {
      res.status(500).json({ error: msg });
    }
  }
});

// ─── DELETE /social/follow/:userId – unfollow a user ─────────────────────────
router.delete('/follow/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify target user belongs to the current tenant
    const targetUser = await prisma.user.findFirst({
      where: { id: req.params.userId, tenantId: req.tenant!.id },
    });
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const followerProfile = await prisma.userProfile.findUnique({ where: { userId: req.user!.sub } });
    const followingProfile = await prisma.userProfile.findUnique({ where: { userId: req.params.userId } });

    if (!followerProfile || !followingProfile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    await prisma.follow.deleteMany({
      where: { followerId: followerProfile.id, followingId: followingProfile.id },
    });
    res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /social/followers – list current user's followers ───────────────────
router.get('/followers', async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await prisma.userProfile.findUnique({ where: { userId: req.user!.sub } });
    if (!profile) {
      res.json({ followers: [], total: 0 });
      return;
    }
    const followers = await prisma.follow.findMany({
      where: { followingId: profile.id },
      include: {
        follower: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ followers, total: followers.length });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /social/following – list users current user follows ─────────────────
router.get('/following', async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await prisma.userProfile.findUnique({ where: { userId: req.user!.sub } });
    if (!profile) {
      res.json({ following: [], total: 0 });
      return;
    }
    const following = await prisma.follow.findMany({
      where: { followerId: profile.id },
      include: {
        following: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ following, total: following.length });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /social/timeline – public prompts feed (tenant-scoped) ───────────────
router.get('/timeline', async (req: Request, res: Response): Promise<void> => {
  const page  = parseInt(req.query.page  as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  try {
    const where = { visibility: 'public', tenantId: req.tenant!.id };
    const prompts = await prisma.prompt.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { likes: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await prisma.prompt.count({ where });
    res.json({ prompts, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
