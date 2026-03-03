import { rateLimit, Options } from 'express-rate-limit';
import { Request, Response } from 'express';

const defaultOptions: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
};

/** Strict limiter for auth endpoints – prevents brute force */
export const authLimiter = rateLimit({
  ...defaultOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes.' },
  keyGenerator: (req: Request) => {
    // Rate-limit by IP + email combo for login attempts
    const email = (req.body as { email?: string })?.email ?? '';
    return `${req.ip}-${email}`;
  },
});

/** Standard API limiter */
export const apiLimiter = rateLimit({
  ...defaultOptions,
  windowMs: 60 * 1000, // 1 minute
  max: 120,
});

/** Expensive AI/agent endpoints */
export const agentLimiter = rateLimit({
  ...defaultOptions,
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Agent execution rate limit reached. Please slow down.' },
  keyGenerator: (req: Request) => {
    // Rate-limit per tenant to prevent abuse
    const tenantId = req.user?.tenantId ?? req.ip ?? 'unknown';
    return `agent-${tenantId}`;
  },
});

/** Federation / LLM proxy endpoints */
export const federationLimiter = rateLimit({
  ...defaultOptions,
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req: Request) => {
    const tenantId = req.user?.tenantId ?? req.ip ?? 'unknown';
    return `federation-${tenantId}`;
  },
});

/** Webhook endpoints – very permissive (Stripe sends many) */
export const webhookLimiter = rateLimit({
  ...defaultOptions,
  windowMs: 60 * 1000,
  max: 300,
  keyGenerator: (_req: Request) => 'webhook-global',
});

/** Password reset – very strict */
export const passwordResetLimiter = rateLimit({
  ...defaultOptions,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many password reset requests, please try again in an hour.' },
});

// Custom error response for rate limit exceeded
const _rateLimitHandler = (_req: Request, res: Response) => {
  res.status(429).json({ error: 'Rate limit exceeded' });
};
