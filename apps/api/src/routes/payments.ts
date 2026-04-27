import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { tenantIsolation } from '../middleware/tenantIsolation';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

const router = Router();
router.use(authenticate, tenantIsolation);

// ─── Validation schemas ───────────────────────────────────────────────────────
const createPaymentSchema = z.object({
  amount:   z.number().positive(),
  currency: z.string().length(3).default('usd'),
  provider: z.enum(['paypal', 'cashapp']),
  metadata: z.record(z.unknown()).optional(),
});

// ─── POST /payments/paypal/create-order ──────────────────────────────────────
router.post('/paypal/create-order', async (req: Request, res: Response): Promise<void> => {
  const result = createPaymentSchema.safeParse({ ...req.body, provider: 'paypal' });
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  const { amount, currency } = result.data;

  try {
    const clientId     = process.env.PAYPAL_CLIENT_ID     ?? '';
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET ?? '';

    // Obtain PayPal access token
    const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error ?? 'PayPal auth failed');
    }

    // Create the order
    const orderRes = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency.toUpperCase(),
              value: amount.toFixed(2),
            },
          },
        ],
      }),
    });
    const order = await orderRes.json() as { id?: string; status?: string; error?: string };
    if (!orderRes.ok) throw new Error(JSON.stringify(order));

    // Record payment intent
    const payment = await prisma.payment.create({
      data: {
        tenantId:   req.tenant!.id,
        userId:     req.user!.sub,
        provider:   'paypal',
        externalId: order.id,
        amount,
        currency,
        status:     'pending',
        metadata:   (result.data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    logger.info('PayPal order created', { paymentId: payment.id, orderId: order.id });
    res.status(201).json({ paymentId: payment.id, orderId: order.id, status: order.status });
  } catch (err) {
    logger.error('PayPal create-order error', { error: (err as Error).message });
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /payments/paypal/capture-order/:orderId ────────────────────────────
router.post('/paypal/capture-order/:orderId', async (req: Request, res: Response): Promise<void> => {
  const { orderId } = req.params;
  try {
    const clientId     = process.env.PAYPAL_CLIENT_ID     ?? '';
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET ?? '';

    const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });
    const tokenData = await tokenRes.json() as { access_token?: string };

    const captureRes = await fetch(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );
    const capture = await captureRes.json() as { status?: string };
    if (!captureRes.ok) throw new Error(JSON.stringify(capture));

    // Update payment record
    await prisma.payment.updateMany({
      where: { externalId: orderId, userId: req.user!.sub },
      data: { status: capture.status === 'COMPLETED' ? 'completed' : 'pending' },
    });

    logger.info('PayPal order captured', { orderId, status: capture.status });
    res.json({ orderId, status: capture.status });
  } catch (err) {
    logger.error('PayPal capture-order error', { error: (err as Error).message });
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /payments/cashapp/create-payment ───────────────────────────────────
router.post('/cashapp/create-payment', async (req: Request, res: Response): Promise<void> => {
  const result = createPaymentSchema.safeParse({ ...req.body, provider: 'cashapp' });
  if (!result.success) {
    res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    return;
  }
  const { amount, currency } = result.data;

  try {
    // CashApp Pay uses Square's Payments API under the hood
    const squareToken = process.env.SQUARE_ACCESS_TOKEN ?? '';
    const locationId  = process.env.SQUARE_LOCATION_ID  ?? '';

    const paymentRes = await fetch('https://connect.squareupsandbox.com/v2/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${squareToken}`,
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify({
        idempotency_key: `${req.user!.sub}_${Date.now()}`,
        source_id: 'CASH_APP',
        amount_money: {
          amount: Math.round(amount * 100), // cents
          currency: currency.toUpperCase(),
        },
        location_id: locationId,
        buyer_email_address: req.user!.email,
      }),
    });
    const paymentData = await paymentRes.json() as {
      payment?: { id?: string; status?: string };
      errors?: Array<{ detail: string }>;
    };
    if (!paymentRes.ok) {
      throw new Error(
        paymentData.errors?.map((e) => e.detail).join(', ') ?? 'Square payment failed'
      );
    }

    const squarePayment = paymentData.payment ?? {};
    const payment = await prisma.payment.create({
      data: {
        tenantId:   req.tenant!.id,
        userId:     req.user!.sub,
        provider:   'cashapp',
        externalId: squarePayment.id ?? undefined,
        amount,
        currency,
        status:     squarePayment.status === 'COMPLETED' ? 'completed' : 'pending',
        metadata:   (result.data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    logger.info('CashApp payment created', { paymentId: payment.id });
    res.status(201).json({
      paymentId: payment.id,
      externalId: squarePayment.id,
      status: squarePayment.status,
    });
  } catch (err) {
    logger.error('CashApp create-payment error', { error: (err as Error).message });
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /payments – list user's payment history ─────────────────────────────
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.sub, tenantId: req.tenant!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ payments, total: payments.length });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
