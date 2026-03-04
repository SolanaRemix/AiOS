import Bull, { Queue, Job } from 'bull';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { FederationService, TaskType } from './federationService';

export type AgentType =
  | 'builder'
  | 'debugger'
  | 'tester'
  | 'deployment'
  | 'refactor'
  | 'security'
  | 'designer'
  | 'analytics'
  | 'devops';

export interface AgentTask {
  projectId?: string;
  agentType: AgentType;
  task: string;
  context?: Record<string, unknown>;
  model?: string;
  tenantId: string;
  userId: string;
}

interface JobData extends AgentTask {
  logId: string;
}

const AGENT_SYSTEM_PROMPTS: Record<AgentType, string> = {
  builder: `You are an expert software builder agent. Your role is to write clean, production-ready code. 
Follow best practices, use appropriate design patterns, and include error handling. 
Return structured output with: code, explanation, and file structure.`,

  debugger: `You are an expert debugging agent. Your role is to identify and fix bugs in code.
Analyze the provided code, identify all issues (logical errors, edge cases, security vulnerabilities), 
and provide fixed code with detailed explanations of each change.`,

  tester: `You are an expert testing agent. Write comprehensive test suites for the provided code.
Include unit tests, integration tests, and edge case tests. Use appropriate testing frameworks.
Aim for high coverage and include mocks where needed.`,

  deployment: `You are a DevOps deployment specialist. Generate deployment configurations including
Dockerfiles, docker-compose files, Kubernetes manifests, CI/CD pipelines, and deployment scripts.
Follow security best practices and include health checks.`,

  refactor: `You are a code refactoring expert. Improve the provided code for readability, performance,
and maintainability. Apply SOLID principles, reduce complexity, and modernize patterns.
Explain each refactoring decision.`,

  security: `You are a security expert agent. Perform security analysis on the provided code.
Identify OWASP Top 10 vulnerabilities, insecure patterns, and suggest fixes.
Provide a security score and prioritized recommendations.`,

  designer: `You are a UI/UX design agent. Generate UI components, design system elements, 
and layout code. Follow accessibility standards (WCAG 2.1), responsive design principles,
and modern design patterns.`,

  analytics: `You are a data analytics agent. Analyze data, generate insights, create visualizations
code, and write SQL queries. Provide statistical analysis and actionable recommendations.`,

  devops: `You are a DevOps infrastructure agent. Design and implement infrastructure as code,
monitoring setups, alerting rules, and operational runbooks. Use Terraform, Ansible, and cloud-native tools.`,
};

const AGENT_TASK_TYPES: Record<AgentType, TaskType> = {
  builder: 'code',
  debugger: 'code',
  tester: 'code',
  deployment: 'code',
  refactor: 'code',
  security: 'analysis',
  designer: 'creative',
  analytics: 'analysis',
  devops: 'code',
};

export class AgentService {
  private queue: Queue<JobData>;
  private federation: FederationService;

  constructor() {
    this.federation = new FederationService();

    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.queue = new Bull<JobData>('agent-tasks', redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: false,
        removeOnFail: false,
      },
    });

    this.registerProcessor();
  }

  /** Add a task to the queue and create a DB log entry */
  async enqueueTask(task: AgentTask): Promise<Job<JobData>> {
    const log = await prisma.agentLog.create({
      data: {
        tenantId: task.tenantId,
        projectId: task.projectId ?? null,
        agentType: task.agentType,
        input: task.task,
        output: '',
        model: task.model ?? 'auto',
        tokens: 0,
        cost: 0,
        duration: 0,
        status: 'pending',
      },
    });

    const job = await this.queue.add({ ...task, logId: log.id }, { jobId: log.id });
    logger.info('Agent task enqueued', { jobId: job.id, agentType: task.agentType, tenantId: task.tenantId });
    return job;
  }

  /** Enqueue a job and return the queue job id (string) */
  async enqueueJob(task: AgentTask): Promise<string> {
    const job = await this.enqueueTask(task);
    return String(job.id);
  }

  /** Get job status and result */
  async getJobStatus(jobId: string, tenantId: string) {
    const log = await prisma.agentLog.findFirst({
      where: { id: jobId, tenantId },
    });
    if (!log) return null;

    const job = await this.queue.getJob(jobId);
    const queueState = job ? await job.getState() : 'unknown';

    return {
      id: log.id,
      status: log.status,
      queueState,
      agentType: log.agentType,
      input: log.input,
      output: log.output,
      model: log.model,
      tokens: log.tokens,
      cost: log.cost,
      duration: log.duration,
      createdAt: log.createdAt,
    };
  }

  /** Get paginated agent logs for a tenant */
  async getLogs(
    tenantId: string,
    opts: { page: number; limit: number; projectId?: string; agentType?: string },
  ) {
    const skip = (opts.page - 1) * opts.limit;
    const where: Record<string, unknown> = { tenantId };
    if (opts.projectId) where.projectId = opts.projectId;
    if (opts.agentType) where.agentType = opts.agentType;

    const [logs, total] = await Promise.all([
      prisma.agentLog.findMany({ where, skip, take: opts.limit, orderBy: { createdAt: 'desc' } }),
      prisma.agentLog.count({ where }),
    ]);

    return { logs, total, page: opts.page, limit: opts.limit, pages: Math.ceil(total / opts.limit) };
  }

  /** Get a single log by ID */
  async getLogById(id: string, tenantId: string) {
    return prisma.agentLog.findFirst({ where: { id, tenantId } });
  }

  /** Cancel a queued or active job */
  async cancelJob(jobId: string, tenantId: string): Promise<void> {
    const log = await prisma.agentLog.findFirst({ where: { id: jobId, tenantId } });
    if (!log) throw new Error('Job not found');

    const job = await this.queue.getJob(jobId);
    if (job) {
      const state = await job.getState();
      if (state === 'waiting' || state === 'delayed') {
        await job.remove();
      }
    }

    await prisma.agentLog.update({
      where: { id: jobId },
      data: { status: 'cancelled' },
    });
  }

  // ─── Queue Processor ──────────────────────────────────────────────────────────

  private registerProcessor(): void {
    this.queue.process(5 /* concurrency */, async (job: Job<JobData>) => {
      const { logId, agentType, task, context, model, tenantId, userId, projectId } = job.data;
      const start = Date.now();

      logger.info('Processing agent task', { jobId: job.id, agentType, tenantId });

      await prisma.agentLog.update({ where: { id: logId }, data: { status: 'running' } });

      const systemPrompt = AGENT_SYSTEM_PROMPTS[agentType];
      const taskType = AGENT_TASK_TYPES[agentType];

      const contextStr = context ? `\n\nContext:\n${JSON.stringify(context, null, 2)}` : '';

      const messages: Array<{ role: 'system' | 'user'; content: string }> = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${task}${contextStr}` },
      ];

      let output = '';
      let usedModel = model ?? 'auto';
      let tokens = 0;
      let cost = 0;

      try {
        // Self-reflection loop: run task, then validate/improve
        const initialResponse = await this.federation.chat({
          messages,
          model,
          taskType,
          tenantId,
          userId,
        });

        output = initialResponse.content;
        usedModel = initialResponse.model;
        tokens = initialResponse.usage.totalTokens;
        cost = initialResponse.cost;

        // Reflection step – ask the model to critique and improve its own output
        const reflectionMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${task}${contextStr}` },
          { role: 'assistant', content: output },
          {
            role: 'user',
            content: 'Review your previous response. Identify any issues, gaps, or improvements needed. Provide the final improved version.',
          },
        ];

        const reflection = await this.federation.chat({
          messages: reflectionMessages,
          model: usedModel,
          taskType,
          tenantId,
          userId,
        });

        output = reflection.content;
        tokens += reflection.usage.totalTokens;
        cost += reflection.cost;

        const duration = Date.now() - start;

        await prisma.agentLog.update({
          where: { id: logId },
          data: { status: 'completed', output, model: usedModel, tokens, cost, duration },
        });

        // Record per-project usage if applicable
        if (projectId) {
          await prisma.usage.create({
            data: { tenantId, userId, model: usedModel, tokens, cost, date: new Date() },
          });
        }

        logger.info('Agent task completed', { jobId: job.id, duration, tokens, cost });
        return { output, model: usedModel, tokens, cost, duration };
      } catch (err) {
        const duration = Date.now() - start;
        const errorMsg = (err as Error).message;

        await prisma.agentLog.update({
          where: { id: logId },
          data: { status: 'failed', output: `Error: ${errorMsg}`, duration },
        });

        logger.error('Agent task failed', { jobId: job.id, error: errorMsg });
        throw err;
      }
    });

    this.queue.on('failed', (job, err) => {
      logger.error('Queue job failed', { jobId: job.id, error: err.message, attempts: job.attemptsMade });
    });

    this.queue.on('stalled', (job) => {
      logger.warn('Queue job stalled', { jobId: job.id });
    });
  }
}
