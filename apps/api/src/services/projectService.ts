import { prisma } from '../config/database';
import { logger } from '../config/logger';

interface CreateProjectInput {
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
  tenantId: string;
  userId: string;
}

interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

export class ProjectService {
  /** List projects for a tenant */
  async listProjects(
    tenantId: string,
    opts: { page: number; limit: number; status?: string },
  ) {
    const skip = (opts.page - 1) * opts.limit;
    const where: Record<string, unknown> = { tenantId };
    if (opts.status) where.status = opts.status;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { agentLogs: true } },
        },
        skip,
        take: opts.limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      total,
      page: opts.page,
      limit: opts.limit,
      pages: Math.ceil(total / opts.limit),
    };
  }

  /** Get single project by ID */
  async getProject(id: string, tenantId: string) {
    return prisma.project.findFirst({
      where: { id, tenantId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { agentLogs: true } },
      },
    });
  }

  /** Create a new project */
  async createProject(input: CreateProjectInput) {
    const project = await prisma.project.create({
      data: {
        name: input.name,
        description: input.description,
        metadata: input.metadata ?? {},
        tenantId: input.tenantId,
        userId: input.userId,
        status: 'active',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    logger.info('Project created', { projectId: project.id, tenantId: input.tenantId });
    return project;
  }

  /** Update a project */
  async updateProject(id: string, tenantId: string, data: UpdateProjectInput) {
    try {
      return await prisma.project.update({
        where: { id, tenantId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.metadata !== undefined && { metadata: data.metadata }),
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('Record to update not found')) return null;
      throw err;
    }
  }

  /** Delete a project */
  async deleteProject(id: string, tenantId: string): Promise<void> {
    const project = await prisma.project.findFirst({ where: { id, tenantId } });
    if (!project) throw new Error('Project not found');
    await prisma.project.delete({ where: { id } });
    logger.info('Project deleted', { projectId: id, tenantId });
  }

  /** Get project statistics */
  async getProjectStats(id: string, tenantId: string) {
    const project = await prisma.project.findFirst({ where: { id, tenantId } });
    if (!project) throw new Error('Project not found');

    const [agentLogStats, usageStats, recentLogs] = await Promise.all([
      prisma.agentLog.groupBy({
        by: ['agentType', 'status'],
        _count: true,
        where: { projectId: id },
      }),
      prisma.usage.aggregate({
        _sum: { tokens: true, cost: true },
        where: { tenantId },
      }),
      prisma.agentLog.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, agentType: true, status: true, model: true, tokens: true, cost: true, duration: true, createdAt: true },
      }),
    ]);

    return {
      project: { id: project.id, name: project.name, status: project.status },
      agentLogs: agentLogStats,
      totalTokens: usageStats._sum.tokens ?? 0,
      totalCost: usageStats._sum.cost ?? 0,
      recentActivity: recentLogs,
    };
  }
}
