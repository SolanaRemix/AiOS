import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Starting database seed...');

  // ─── Super-admin tenant ───────────────────────────────────────────────────────
  const adminTenant = await prisma.tenant.upsert({
    where: { slug: 'platform-admin' },
    update: {},
    create: {
      name: 'Platform Admin',
      slug: 'platform-admin',
      plan: 'enterprise',
      status: 'active',
    },
  });
  console.log(`✅  Tenant: ${adminTenant.name} (${adminTenant.id})`);

  // ─── Super-admin user ─────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@aios.app';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashedPassword },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Super Admin',
      role: 'super-admin',
      tenantId: adminTenant.id,
    },
  });
  console.log(`✅  Super-admin user: ${adminUser.email}`);

  // ─── Demo tenant ──────────────────────────────────────────────────────────────
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organisation',
      slug: 'demo-org',
      plan: 'pro',
      status: 'active',
    },
  });
  console.log(`✅  Tenant: ${demoTenant.name} (${demoTenant.id})`);

  // ─── Demo admin user ──────────────────────────────────────────────────────────
  const demoAdminPw = await bcrypt.hash('Demo@12345!', 12);
  const demoAdmin = await prisma.user.upsert({
    where: { email: 'demo-admin@aios.app' },
    update: {},
    create: {
      email: 'demo-admin@aios.app',
      password: demoAdminPw,
      name: 'Demo Admin',
      role: 'admin',
      tenantId: demoTenant.id,
    },
  });
  console.log(`✅  Demo admin: ${demoAdmin.email}`);

  // ─── Demo developer user ──────────────────────────────────────────────────────
  const demoDevPw = await bcrypt.hash('Dev@12345!', 12);
  const demoDev = await prisma.user.upsert({
    where: { email: 'dev@aios.app' },
    update: {},
    create: {
      email: 'dev@aios.app',
      password: demoDevPw,
      name: 'Demo Developer',
      role: 'dev',
      tenantId: demoTenant.id,
    },
  });
  console.log(`✅  Demo developer: ${demoDev.email}`);

  // ─── Demo projects ────────────────────────────────────────────────────────────
  const projects = [
    {
      name: 'E-commerce API',
      description: 'RESTful API for online store with inventory management',
      status: 'active',
    },
    {
      name: 'Analytics Dashboard',
      description: 'Real-time analytics for sales and user behaviour',
      status: 'active',
    },
    {
      name: 'Mobile App Backend',
      description: 'GraphQL backend for the iOS/Android mobile application',
      status: 'draft',
    },
  ];

  for (const p of projects) {
    const project = await prisma.project.upsert({
      where: { id: `seed-${p.name.toLowerCase().replace(/ /g, '-')}` },
      update: {},
      create: {
        id: `seed-${p.name.toLowerCase().replace(/ /g, '-')}`,
        ...p,
        tenantId: demoTenant.id,
        userId: demoAdmin.id,
      },
    });
    console.log(`✅  Project: ${project.name}`);
  }

  // ─── Sample agent logs ────────────────────────────────────────────────────────
  const sampleLogs = [
    {
      agentType: 'builder',
      input: 'Create a REST endpoint for user authentication with JWT',
      output: '// Generated auth endpoint code...\napp.post("/auth/login", async (req, res) => { ... });',
      model: 'gpt-4-turbo-preview',
      tokens: 1250,
      cost: 0.0375,
      duration: 4200,
      status: 'completed',
    },
    {
      agentType: 'tester',
      input: 'Write unit tests for the authentication module',
      output: 'describe("Auth", () => { it("should login valid user", async () => { ... }); });',
      model: 'claude-3-sonnet-20240229',
      tokens: 980,
      cost: 0.0147,
      duration: 3100,
      status: 'completed',
    },
    {
      agentType: 'security',
      input: 'Perform security audit on the API codebase',
      output: '## Security Report\n\nCritical: 0\nHigh: 1\nMedium: 3\nLow: 5\n\n...',
      model: 'gpt-4-turbo-preview',
      tokens: 2100,
      cost: 0.063,
      duration: 7800,
      status: 'completed',
    },
  ];

  for (const log of sampleLogs) {
    await prisma.agentLog.create({
      data: {
        ...log,
        tenantId: demoTenant.id,
        projectId: 'seed-e-commerce-api',
      },
    });
  }
  console.log(`✅  Sample agent logs created`);

  // ─── Sample billing record ────────────────────────────────────────────────────
  await prisma.billing.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      plan: 'pro',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`✅  Billing record created for demo tenant`);

  // ─── Sample usage records ─────────────────────────────────────────────────────
  const usageRecords = [
    { model: 'gpt-4-turbo-preview', tokens: 5000, cost: 0.15 },
    { model: 'claude-3-sonnet-20240229', tokens: 8000, cost: 0.12 },
    { model: 'gpt-3.5-turbo', tokens: 15000, cost: 0.0225 },
  ];

  for (const u of usageRecords) {
    await prisma.usage.create({
      data: {
        ...u,
        tenantId: demoTenant.id,
        userId: demoAdmin.id,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`✅  Sample usage records created`);

  // ─── Plans & Feature Gates ────────────────────────────────────────────────────
  const planDefs = [
    {
      id: 'plan-free',
      name: 'free',
      displayName: 'Free',
      description: 'Get started with AIOS at no cost.',
      priceMonthly: 0,
      priceYearly: 0,
      features: ['3 projects', '1 agent', '10K tokens/month', 'Community support'],
      limits: { max_projects: 3, max_agents: 1, tokensPerMonth: 10000 },
      sortOrder: 0,
    },
    {
      id: 'plan-starter',
      name: 'starter',
      displayName: 'Starter',
      description: 'For small teams and indie developers.',
      priceMonthly: 29,
      priceYearly: 290,
      features: ['10 projects', '5 agents', '100K tokens/month', 'Email support', 'LLM federation'],
      limits: { max_projects: 10, max_agents: 5, tokensPerMonth: 100000 },
      sortOrder: 1,
    },
    {
      id: 'plan-pro',
      name: 'pro',
      displayName: 'Pro',
      description: 'For growing teams that need more power.',
      priceMonthly: 99,
      priceYearly: 990,
      features: ['Unlimited projects', '20 agents', '1M tokens/month', 'Priority support', 'All LLMs', 'Custom models'],
      limits: { max_projects: 'unlimited', max_agents: 20, tokensPerMonth: 1000000 },
      sortOrder: 2,
    },
    {
      id: 'plan-enterprise',
      name: 'enterprise',
      displayName: 'Enterprise',
      description: 'Unlimited scale with dedicated support.',
      priceMonthly: 499,
      priceYearly: 4990,
      features: ['Unlimited everything', 'Dedicated support', 'SLA', 'SSO', 'Audit logs', 'On-premise option'],
      limits: { max_projects: 'unlimited', max_agents: 'unlimited', tokensPerMonth: 'unlimited' },
      sortOrder: 3,
    },
  ];

  for (const p of planDefs) {
    await prisma.plan.upsert({
      where: { id: p.id },
      update: { displayName: p.displayName, priceMonthly: p.priceMonthly, priceYearly: p.priceYearly },
      create: p,
    });
    console.log(`✅  Plan: ${p.displayName}`);
  }

  // Feature gates for free plan
  const freeGates = [
    { feature: 'max_projects', value: '3', description: 'Max 3 active projects' },
    { feature: 'max_agents', value: '1', description: 'Max 1 concurrent agent' },
    { feature: 'federation', value: 'false', description: 'LLM federation disabled' },
    { feature: 'custom_models', value: 'false', description: 'Custom models disabled' },
  ];
  for (const g of freeGates) {
    await prisma.featureGate.upsert({
      where: { planId_feature: { planId: 'plan-free', feature: g.feature } },
      update: { value: g.value },
      create: { planId: 'plan-free', ...g },
    });
  }
  console.log(`✅  Feature gates for Free plan`);

  console.log('\n🎉  Seed completed successfully!');
  console.log('\n📋  Credentials:');
  console.log(`    Super Admin: ${adminEmail} / ${adminPassword}`);
  console.log('    Demo Admin:  demo-admin@aios.app / Demo@12345!');
  console.log('    Demo Dev:    dev@aios.app / Dev@12345!');
}

main()
  .catch((err) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
