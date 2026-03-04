import express, { Router, Request, Response } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { authenticate } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenantIsolation';
import { webhookLimiter } from '../middleware/rateLimiter';
import { BillingService } from '../services/billingService';
import { logger } from '../config/logger';

const router = Router();
const billingService = new BillingService();

const createSubscriptionSchema = z.object({
  plan: z.enum(['starter', 'pro', 'enterprise']),
  paymentMethodId: z.string().optional(),
});

// ─── POST /billing/webhook  (no auth – Stripe calls this) ────────────────────
router.post(
  '/webhook',
  webhookLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
    let event: Stripe.Event;

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2023-10-16' });
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
    } catch (err) {
      logger.error('Stripe webhook signature verification failed', { error: (err as Error).message });
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    try {
      await billingService.handleWebhookEvent(event);
      res.json({ received: true });
    } catch (err) {
      logger.error('Webhook processing error', { error: (err as Error).message });
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  },
);

// All remaining routes require auth
router.use(authenticate, tenantIsolation);

// ─── POST /billing/create-subscription ───────────────────────────────────────
router.post('/create-subscription', async (req: Request, res: Response): Promise<void> => {
  const result = createSubscriptionSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  try {
    const subscription = await billingService.createSubscription(
      req.tenant!.id,
      req.user!.email,
      result.data.plan,
      result.data.paymentMethodId,
    );
    res.status(201).json(subscription);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /billing/cancel-subscription ───────────────────────────────────────
router.post('/cancel-subscription', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await billingService.cancelSubscription(req.tenant!.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /billing/usage ───────────────────────────────────────────────────────
router.get('/usage', async (req: Request, res: Response): Promise<void> => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;
    const usage = await billingService.getUsage(req.tenant!.id, { from, to });
    res.json(usage);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /billing/invoices ────────────────────────────────────────────────────
router.get('/invoices', async (req: Request, res: Response): Promise<void> => {
  try {
    const invoices = await billingService.getInvoices(req.tenant!.id);
    res.json({ invoices });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /billing/subscription ────────────────────────────────────────────────
router.get('/subscription', async (req: Request, res: Response): Promise<void> => {
  try {
    const sub = await billingService.getSubscription(req.tenant!.id);
    res.json(sub ?? { status: 'none' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /billing/portal ─────────────────────────────────────────────────────
router.post('/portal', async (req: Request, res: Response): Promise<void> => {
  try {
    const url = await billingService.createPortalSession(
      req.tenant!.id,
      process.env.APP_URL ?? 'http://localhost:3000',
    );
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
