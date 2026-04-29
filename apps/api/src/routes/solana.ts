import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { tenantIsolation } from '../middleware/tenantIsolation';
import { SolanaArbitrageService } from '../services/solanaArbitrageService';
import { logger } from '../config/logger';

const router = Router();
router.use(authenticate, tenantIsolation);

const arbitrageService = new SolanaArbitrageService();

const configSchema = z.object({
  slippageTolerance: z.coerce.number().min(0).max(0.1).optional(),
  minProfitLamports: z.coerce.number().min(0).optional(),
  maxHops: z.coerce.number().int().min(1).max(5).optional(),
  useLeverage: z
    .preprocess((v: unknown) => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return v;
    }, z.boolean())
    .optional(),
});

const executeSchema = z.object({
  id: z.string().min(1),
  tokenA: z.string().min(1),
  tokenB: z.string().min(1),
  dexIn: z.string().optional(),
  dexOut: z.string().optional(),
  amountIn: z.string().regex(/^\d+$/, 'amountIn must be a non-negative integer string').optional(),
  expectedProfit: z
    .string()
    .regex(/^\d+$/, 'expectedProfit must be a non-negative integer string')
    .optional(),
  route: z.array(z.string()).optional(),
  timestamp: z.number().optional(),
});

// ─── GET /solana/opportunities – scan for arb windows ────────────────────────
router.get('/opportunities', async (req: Request, res: Response): Promise<void> => {
  try {
    const config = configSchema.safeParse(req.query);
    if (!config.success) {
      res.status(400).json({ error: 'Invalid query parameters', details: config.error.flatten() });
      return;
    }
    const opportunities = await arbitrageService.scanOpportunities(config.data);
    res.json({
      opportunities: opportunities.map((o) => ({
        ...o,
        amountIn: o.amountIn.toString(),
        expectedProfit: o.expectedProfit.toString(),
      })),
      total: opportunities.length,
      scannedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('GET /solana/opportunities error', { error: (err as Error).message });
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /solana/execute – execute a discovered opportunity ──────────────────
router.post(
  '/execute',
  requireRole(['admin', 'super-admin']),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = executeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    const body = parsed.data;

    try {
      const opportunity = {
        id: body.id,
        tokenA: body.tokenA,
        tokenB: body.tokenB,
        dexIn: body.dexIn ?? '',
        dexOut: body.dexOut ?? '',
        amountIn: BigInt(body.amountIn ?? '0'),
        expectedProfit: BigInt(body.expectedProfit ?? '0'),
        route: body.route ?? [],
        timestamp: body.timestamp ?? Date.now(),
      };

      const result = await arbitrageService.executeArbitrage(opportunity);
      res.json({
        ...result,
        profitLamports: result.profitLamports?.toString(),
        feeLamports: result.feeLamports?.toString(),
      });
    } catch (err) {
      logger.error('POST /solana/execute error', { error: (err as Error).message });
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

// ─── GET /solana/audit/:txSignature – on-chain audit ─────────────────────────
router.get('/audit/:txSignature', async (req: Request, res: Response): Promise<void> => {
  try {
    const audit = await arbitrageService.auditTransaction(req.params.txSignature);
    res.json(audit);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /solana/audit-log – in-memory audit trail ───────────────────────────
router.get(
  '/audit-log',
  requireRole(['admin', 'super-admin']),
  async (_req: Request, res: Response): Promise<void> => {
    const log = arbitrageService.getAuditLog();
    res.json({
      entries: log.map((e) => ({
        ...e,
        profitLamports: e.profitLamports.toString(),
      })),
      total: log.length,
    });
  }
);

export default router;
