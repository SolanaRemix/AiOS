import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import { logger } from '../config/logger';

export type TaskType = 'general' | 'code' | 'analysis' | 'creative' | 'math' | 'fast';

export interface ModelConfig {
  id: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'ollama';
  name: string;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  strengths: TaskType[];
  latencyMs: number; // estimated average
  available: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  taskType: TaskType;
  maxTokens?: number;
  temperature?: number;
  tenantId: string;
  userId: string;
}

export interface CompletionRequest {
  prompt: string;
  model?: string;
  taskType: TaskType;
  maxTokens?: number;
  temperature?: number;
  tenantId: string;
  userId: string;
}

export interface FederationResponse {
  content: string;
  model: string;
  provider: string;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  cost: number;
  latencyMs: number;
}

// Model registry
const MODEL_REGISTRY: ModelConfig[] = [
  {
    id: 'gpt-4-turbo-preview',
    provider: 'openai',
    name: 'GPT-4 Turbo',
    contextWindow: 128_000,
    costPer1kInput: 0.01,
    costPer1kOutput: 0.03,
    strengths: ['general', 'code', 'analysis', 'math'],
    latencyMs: 3500,
    available: Boolean(process.env.OPENAI_API_KEY),
  },
  {
    id: 'gpt-3.5-turbo',
    provider: 'openai',
    name: 'GPT-3.5 Turbo',
    contextWindow: 16_385,
    costPer1kInput: 0.0005,
    costPer1kOutput: 0.0015,
    strengths: ['fast', 'general'],
    latencyMs: 800,
    available: Boolean(process.env.OPENAI_API_KEY),
  },
  {
    id: 'claude-3-opus-20240229',
    provider: 'anthropic',
    name: 'Claude 3 Opus',
    contextWindow: 200_000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
    strengths: ['analysis', 'creative', 'code'],
    latencyMs: 4000,
    available: Boolean(process.env.ANTHROPIC_API_KEY),
  },
  {
    id: 'claude-3-sonnet-20240229',
    provider: 'anthropic',
    name: 'Claude 3 Sonnet',
    contextWindow: 200_000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    strengths: ['general', 'analysis', 'code'],
    latencyMs: 2000,
    available: Boolean(process.env.ANTHROPIC_API_KEY),
  },
  {
    id: 'gemini-pro',
    provider: 'google',
    name: 'Gemini Pro',
    contextWindow: 32_768,
    costPer1kInput: 0.0005,
    costPer1kOutput: 0.0015,
    strengths: ['general', 'analysis', 'fast'],
    latencyMs: 1500,
    available: Boolean(process.env.GOOGLE_GEMINI_API_KEY),
  },
];

export class FederationService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private gemini: GoogleGenerativeAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORG_ID,
      });
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    if (process.env.GOOGLE_GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    }
  }

  /** Send chat messages to the best available model */
  async chat(req: ChatRequest): Promise<FederationResponse> {
    const model = req.model
      ? MODEL_REGISTRY.find((m) => m.id === req.model)
      : this.selectBestModel({ taskType: req.taskType });

    if (!model) {
      throw new Error(`Model not found or not available: ${req.model ?? req.taskType}`);
    }

    const fallbackChain = this.buildFallbackChain(model, req.taskType);

    for (const candidate of fallbackChain) {
      try {
        const result = await this.executeChat(candidate, req);
        await this.recordUsage(req.tenantId, req.userId, candidate, result);
        return result;
      } catch (err) {
        logger.warn(`Model ${candidate.id} failed, trying next in chain`, {
          error: (err as Error).message,
        });
      }
    }

    throw new Error('All models in fallback chain failed');
  }

  /** Text completion */
  async complete(req: CompletionRequest): Promise<FederationResponse> {
    return this.chat({
      messages: [{ role: 'user', content: req.prompt }],
      model: req.model,
      taskType: req.taskType,
      maxTokens: req.maxTokens,
      temperature: req.temperature,
      tenantId: req.tenantId,
      userId: req.userId,
    });
  }

  /** List available models for tenant */
  async listAvailableModels(_tenantId: string): Promise<ModelConfig[]> {
    return MODEL_REGISTRY.filter((m) => m.available);
  }

  /** Select the best model for a task */
  async selectModel(
    opts: { taskType: TaskType; preferCost?: boolean; preferSpeed?: boolean; maxCostPer1k?: number },
    _tenantId: string,
  ): Promise<ModelConfig> {
    let candidates = MODEL_REGISTRY.filter((m) => m.available && m.strengths.includes(opts.taskType));
    if (!candidates.length) candidates = MODEL_REGISTRY.filter((m) => m.available);

    if (opts.maxCostPer1k) {
      candidates = candidates.filter((m) => m.costPer1kInput <= opts.maxCostPer1k!);
    }

    if (opts.preferCost) {
      candidates.sort((a, b) => a.costPer1kInput - b.costPer1kInput);
    } else if (opts.preferSpeed) {
      candidates.sort((a, b) => a.latencyMs - b.latencyMs);
    } else {
      // Score = strengths match + low cost + low latency
      candidates.sort((a, b) => this.scoreModel(b, opts.taskType) - this.scoreModel(a, opts.taskType));
    }

    const selected = candidates[0];
    if (!selected) throw new Error('No suitable model found');
    return selected;
  }

  /** Get usage summary for tenant */
  async getUsageSummary(tenantId: string, opts: { from?: Date; to?: Date }) {
    const cacheKey = `usage:${tenantId}:${opts.from?.toISOString() ?? 'all'}`;
    const cached = await cacheGet<object>(cacheKey);
    if (cached) return cached;

    const where: Record<string, unknown> = { tenantId };
    if (opts.from || opts.to) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (opts.from) dateFilter.gte = opts.from;
      if (opts.to) dateFilter.lte = opts.to;
      where.date = dateFilter;
    }

    const [total, byModel] = await Promise.all([
      prisma.usage.aggregate({ _sum: { tokens: true, cost: true }, where }),
      prisma.usage.groupBy({ by: ['model'], _sum: { tokens: true, cost: true }, where }),
    ]);

    const result = {
      totalTokens: total._sum.tokens ?? 0,
      totalCost: total._sum.cost ?? 0,
      byModel,
    };
    await cacheSet(cacheKey, result, 300);
    return result;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  private selectBestModel(opts: { taskType: TaskType }): ModelConfig | undefined {
    const candidates = MODEL_REGISTRY.filter(
      (m) => m.available && m.strengths.includes(opts.taskType),
    );
    if (!candidates.length) return MODEL_REGISTRY.find((m) => m.available);
    return candidates.sort((a, b) => this.scoreModel(b, opts.taskType) - this.scoreModel(a, opts.taskType))[0];
  }

  private buildFallbackChain(primary: ModelConfig, taskType: TaskType): ModelConfig[] {
    const alternatives = MODEL_REGISTRY.filter(
      (m) => m.available && m.id !== primary.id,
    ).sort((a, b) => this.scoreModel(b, taskType) - this.scoreModel(a, taskType));
    return [primary, ...alternatives.slice(0, 2)];
  }

  private scoreModel(model: ModelConfig, taskType: TaskType): number {
    const strengthScore = model.strengths.includes(taskType) ? 50 : 0;
    const costScore = Math.max(0, 10 - model.costPer1kInput * 100);
    const latencyScore = Math.max(0, 10 - model.latencyMs / 500);
    return strengthScore + costScore + latencyScore;
  }

  private async executeChat(model: ModelConfig, req: ChatRequest): Promise<FederationResponse> {
    const start = Date.now();
    const maxTokens = req.maxTokens ?? 4096;
    const temperature = req.temperature ?? 0.7;

    if (model.provider === 'openai' && this.openai) {
      const resp = await this.openai.chat.completions.create({
        model: model.id,
        messages: req.messages,
        max_tokens: maxTokens,
        temperature,
      });
      const usage = resp.usage!;
      const inputTokens = usage.prompt_tokens;
      const outputTokens = usage.completion_tokens;
      return {
        content: resp.choices[0]?.message?.content ?? '',
        model: model.id,
        provider: 'openai',
        usage: { inputTokens, outputTokens, totalTokens: usage.total_tokens },
        cost: this.calcCost(model, inputTokens, outputTokens),
        latencyMs: Date.now() - start,
      };
    }

    if (model.provider === 'anthropic' && this.anthropic) {
      const systemMsg = req.messages.find((m) => m.role === 'system');
      const userMessages = req.messages.filter((m) => m.role !== 'system');
      const resp = await this.anthropic.messages.create({
        model: model.id,
        max_tokens: maxTokens,
        system: systemMsg?.content,
        messages: userMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      });
      const inputTokens = resp.usage.input_tokens;
      const outputTokens = resp.usage.output_tokens;
      const content = resp.content.find((b) => b.type === 'text');
      return {
        content: content?.type === 'text' ? content.text : '',
        model: model.id,
        provider: 'anthropic',
        usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
        cost: this.calcCost(model, inputTokens, outputTokens),
        latencyMs: Date.now() - start,
      };
    }

    if (model.provider === 'google' && this.gemini) {
      const gModel = this.gemini.getGenerativeModel({ model: model.id });
      const lastUser = [...req.messages].reverse().find((m) => m.role === 'user');
      if (!lastUser) throw new Error('No user message found');
      const result = await gModel.generateContent(lastUser.content);
      const response = result.response;
      const text = response.text();
      // Gemini doesn't provide token counts in all versions; estimate
      const inputTokens = Math.ceil(lastUser.content.length / 4);
      const outputTokens = Math.ceil(text.length / 4);
      return {
        content: text,
        model: model.id,
        provider: 'google',
        usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
        cost: this.calcCost(model, inputTokens, outputTokens),
        latencyMs: Date.now() - start,
      };
    }

    throw new Error(`Provider ${model.provider} not configured or unsupported`);
  }

  private calcCost(model: ModelConfig, inputTokens: number, outputTokens: number): number {
    return (inputTokens / 1000) * model.costPer1kInput + (outputTokens / 1000) * model.costPer1kOutput;
  }

  private async recordUsage(
    tenantId: string,
    userId: string,
    model: ModelConfig,
    result: FederationResponse,
  ): Promise<void> {
    try {
      await prisma.usage.create({
        data: {
          tenantId,
          userId,
          model: model.id,
          tokens: result.usage.totalTokens,
          cost: result.cost,
          date: new Date(),
        },
      });
    } catch (err) {
      logger.error('Failed to record usage', { error: (err as Error).message });
    }
  }
}
