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
