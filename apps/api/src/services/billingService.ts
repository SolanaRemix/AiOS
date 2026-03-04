import Stripe from 'stripe';
import { prisma } from '../config/database';
import { cacheDel } from '../config/redis';
import { logger } from '../config/logger';

const PLAN_PRICE_MAP: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER ?? '',
  pro: process.env.STRIPE_PRICE_PRO ?? '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
};

export class BillingService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2023-10-16',
    });
  }

  /** Helper to safely extract period end from Stripe subscription */
  private periodEnd(sub: Stripe.Subscription): Date {
    return new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000);
  }

  /** Create or update Stripe subscription */
  async createSubscription(
    tenantId: string,
    email: string,
    plan: string,
    paymentMethodId?: string,
  ) {
    const priceId = PLAN_PRICE_MAP[plan];
    if (!priceId) throw new Error(`No price configured for plan: ${plan}`);

    let billing = await prisma.billing.findUnique({ where: { tenantId } });
    let customerId = billing?.stripeCustomerId;

    // Create Stripe customer if not exists
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email,
        metadata: { tenantId },
      });
      customerId = customer.id;
    }

    // Attach payment method if provided
    if (paymentMethodId) {
      await this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      await this.stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    // Cancel existing subscription if upgrading/downgrading
    if (billing?.stripeSubscriptionId) {
      await this.stripe.subscriptions.cancel(billing.stripeSubscriptionId);
    }

    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
    });

    const upsertData = {
      tenantId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      plan,
      status: subscription.status,
      currentPeriodEnd: this.periodEnd(subscription),
    };

    billing = await prisma.billing.upsert({
      where: { tenantId },
      create: upsertData,
      update: upsertData,
    });

    // Update tenant plan
    await prisma.tenant.update({ where: { id: tenantId }, data: { plan } });
    await cacheDel(`tenant:${tenantId}`);

    logger.info('Subscription created', { tenantId, plan, subscriptionId: subscription.id });
    return { subscription: billing, clientSecret: (subscription as any).latest_invoice?.payment_intent?.client_secret };
  }

  /** Cancel subscription at period end */
  async cancelSubscription(tenantId: string) {
    const billing = await prisma.billing.findUnique({ where: { tenantId } });
    if (!billing?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    const subscription = await this.stripe.subscriptions.update(billing.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.billing.update({
      where: { tenantId },
      data: { status: 'cancelling' },
    });

    logger.info('Subscription cancellation scheduled', { tenantId });
    return { message: 'Subscription will be cancelled at the end of the billing period', endsAt: this.periodEnd(subscription) };
  }

  /** Get usage data for tenant */
  async getUsage(tenantId: string, opts: { from?: Date; to?: Date }) {
    const where: Record<string, unknown> = { tenantId };
    if (opts.from || opts.to) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (opts.from) dateFilter.gte = opts.from;
      if (opts.to) dateFilter.lte = opts.to;
      where.date = dateFilter;
    }

    const [total, byModel, daily] = await Promise.all([
      prisma.usage.aggregate({ _sum: { tokens: true, cost: true }, where }),
      prisma.usage.groupBy({ by: ['model'], _sum: { tokens: true, cost: true }, where }),
      prisma.usage.groupBy({
        by: ['date'],
        _sum: { tokens: true, cost: true },
        where,
        orderBy: { date: 'asc' },
        take: 30,
      }),
    ]);

    return {
      totalTokens: total._sum.tokens ?? 0,
      totalCost: Number((total._sum.cost ?? 0).toFixed(6)),
      byModel,
      daily,
    };
  }

  /** Get Stripe invoices for tenant */
  async getInvoices(tenantId: string) {
    const billing = await prisma.billing.findUnique({ where: { tenantId } });
    if (!billing?.stripeCustomerId) return [];

    const invoices = await this.stripe.invoices.list({
      customer: billing.stripeCustomerId,
      limit: 24,
    });

    return invoices.data.map((inv) => ({
      id: inv.id,
      amount: inv.amount_due / 100,
      currency: inv.currency,
      status: inv.status,
      date: new Date(inv.created * 1000),
      pdf: inv.invoice_pdf,
      hostedUrl: inv.hosted_invoice_url,
    }));
  }

  /** Get current subscription for tenant */
  async getSubscription(tenantId: string) {
    return prisma.billing.findUnique({ where: { tenantId } });
  }

  /** Create Stripe billing portal session */
  async createPortalSession(tenantId: string, returnUrl: string): Promise<string> {
    const billing = await prisma.billing.findUnique({ where: { tenantId } });
    if (!billing?.stripeCustomerId) {
      throw new Error('No billing account found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: billing.stripeCustomerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /** Handle Stripe webhook events */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    logger.info('Processing Stripe webhook', { type: event.type });

    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const billing = await prisma.billing.findFirst({ where: { stripeCustomerId: customerId } });
        if (billing) {
          await prisma.billing.update({
            where: { id: billing.id },
            data: { status: 'active' },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const billing = await prisma.billing.findFirst({ where: { stripeCustomerId: customerId } });
        if (billing) {
          await prisma.billing.update({
            where: { id: billing.id },
            data: { status: 'past_due' },
          });
          logger.warn('Invoice payment failed', { customerId, tenantId: billing.tenantId });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const billing = await prisma.billing.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (billing) {
          await prisma.billing.update({ where: { id: billing.id }, data: { status: 'cancelled' } });
          await prisma.tenant.update({ where: { id: billing.tenantId }, data: { plan: 'free' } });
          await cacheDel(`tenant:${billing.tenantId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const billing = await prisma.billing.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (billing) {
          await prisma.billing.update({
            where: { id: billing.id },
            data: {
              status: sub.status,
              currentPeriodEnd: this.periodEnd(sub),
            },
          });
        }
        break;
      }

      default:
        logger.info(`Unhandled Stripe event: ${event.type}`);
    }
  }
}
