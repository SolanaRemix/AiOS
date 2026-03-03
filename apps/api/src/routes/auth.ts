import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { authenticate } from '../middleware/auth';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';

const router = Router();
const authService = new AuthService();

// ─── Validation schemas ───────────────────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
  tenantName: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// ─── POST /auth/register ──────────────────────────────────────────────────────
router.post('/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    const data = await authService.register(result.data);
    res.status(201).json(data);
  } catch (err) {
    const message = (err as Error).message;
    const status = message.includes('already exists') ? 409 : 400;
    res.status(status).json({ error: message });
  }
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    const data = await authService.login(result.data.email, result.data.password);
    res.json(data);
  } catch (err) {
    res.status(401).json({ error: (err as Error).message });
  }
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
router.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    await authService.logout(token, req.user!.sub);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const result = refreshSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }
  try {
    const data = await authService.refreshToken(result.data.refreshToken);
    res.json(data);
  } catch (err) {
    res.status(401).json({ error: (err as Error).message });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await authService.getProfile(req.user!.sub);
    res.json(profile);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

// ─── POST /auth/forgot-password ───────────────────────────────────────────────
router.post('/forgot-password', passwordResetLimiter, async (req: Request, res: Response): Promise<void> => {
  const result = forgotPasswordSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Valid email is required' });
    return;
  }
  // Always return 200 to prevent email enumeration
  await authService.forgotPassword(result.data.email).catch(() => {});
  res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────
router.post('/reset-password', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const result = resetPasswordSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    await authService.resetPassword(result.data.token, result.data.password);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
