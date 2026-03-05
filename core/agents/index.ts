/**
 * AiOS Agent runtime – executor, model router, registry, and templates.
 */

import { randomUUID } from 'crypto';
import { BaseAgent, AgentBuilder, AgentConfig } from '../sdk';
import { ExecutionContext, AgentTemplate, ResolvedModel } from './types';

export { ExecutionContext, AgentTemplate, ResolvedModel } from './types';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class AgentNotFoundError extends Error {
  constructor(id: string) {
    super(`Agent not found: "${id}"`);
    this.name = 'AgentNotFoundError';
  }
}

export class AgentExecutionError extends Error {
  constructor(agentId: string, cause: Error) {
    super(`Agent "${agentId}" execution failed: ${cause.message}`);
    this.name = 'AgentExecutionError';
    this.cause = cause;
  }
}

// ---------------------------------------------------------------------------
// ModelRouter
// ---------------------------------------------------------------------------

/** Message format understood by all supported model providers. */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Response from a routed model call. */
export interface ModelResponse {
  provider: string;
  model: string;
  content: string;
  usage?: { promptTokens: number; completionTokens: number };
}

/**
 * Routes model inference requests to the correct provider.
 *
 * In a production deployment each `case` branch would call the real
 * provider SDK.  Here we return deterministic stubs so the runtime can be
 * exercised without API keys.
 */
export class ModelRouter {
  private static readonly PROVIDER_MAP: Record<string, string> = {
    'gpt-': 'openai',
    'o1': 'openai',
    'o3': 'openai',
    'claude-': 'anthropic',
    'mixtral': 'groq',
    'llama': 'groq',
    'gemma': 'ollama',
    'mistral': 'ollama',
  };

  /**
   * Resolve the provider for a given model string.
   */
  static resolveProvider(model: string): ResolvedModel {
    for (const [prefix, provider] of Object.entries(ModelRouter.PROVIDER_MAP)) {
      if (model.toLowerCase().startsWith(prefix)) {
        return { provider: provider as ResolvedModel['provider'], modelId: model };
      }
    }
    // Default to openai-compatible
    return { provider: 'openai', modelId: model };
  }

  /**
   * Route a chat completion request to the appropriate provider.
   *
   * @param model - Model identifier string.
   * @param messages - Conversation history.
   * @returns A {@link ModelResponse} with the assistant reply.
   */
  async route(model: string, messages: ChatMessage[]): Promise<ModelResponse> {
    const resolved = ModelRouter.resolveProvider(model);
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const userContent = lastUser?.content ?? '';

    switch (resolved.provider) {
      case 'openai':
        return this.callOpenAI(resolved.modelId, messages, userContent);
      case 'anthropic':
        return this.callAnthropic(resolved.modelId, messages, userContent);
      case 'groq':
        return this.callGroq(resolved.modelId, messages, userContent);
      case 'ollama':
        return this.callOllama(resolved.modelId, messages, userContent);
      default:
        return this.callOpenAI(resolved.modelId, messages, userContent);
    }
  }

  private async callOpenAI(
    model: string,
    _messages: ChatMessage[],
    userContent: string,
  ): Promise<ModelResponse> {
    return {
      provider: 'openai',
      model,
      content: `[OpenAI/${model}] Echo: ${userContent}`,
      usage: { promptTokens: 10, completionTokens: 20 },
    };
  }

  private async callAnthropic(
    model: string,
    _messages: ChatMessage[],
    userContent: string,
  ): Promise<ModelResponse> {
    return {
      provider: 'anthropic',
      model,
      content: `[Anthropic/${model}] Echo: ${userContent}`,
      usage: { promptTokens: 10, completionTokens: 20 },
    };
  }

  private async callGroq(
    model: string,
    _messages: ChatMessage[],
    userContent: string,
  ): Promise<ModelResponse> {
    return {
      provider: 'groq',
      model,
      content: `[Groq/${model}] Echo: ${userContent}`,
      usage: { promptTokens: 8, completionTokens: 15 },
    };
  }

  private async callOllama(
    model: string,
    _messages: ChatMessage[],
    userContent: string,
  ): Promise<ModelResponse> {
    return {
      provider: 'ollama',
      model,
      content: `[Ollama/${model}] Echo: ${userContent}`,
      usage: { promptTokens: 6, completionTokens: 12 },
    };
  }
}

// ---------------------------------------------------------------------------
// AgentExecutor
// ---------------------------------------------------------------------------

/**
 * Executes a {@link BaseAgent} with lifecycle management and error handling.
 */
export class AgentExecutor {
  private readonly router = new ModelRouter();

  /**
   * Execute an agent with the given input and context.
   *
   * @param agent - The agent instance to run.
   * @param input - The user or system input string.
   * @param context - Optional execution context (correlation ID, session, etc.).
   * @returns The agent's response string.
   */
  async execute(
    agent: BaseAgent,
    input: string,
    context: ExecutionContext = {},
  ): Promise<string> {
    const timeoutMs = context.timeoutMs ?? 30_000;

    const execution = async (): Promise<string> => {
      await agent.onInit();
      await agent.onStart();
      try {
        const result = await agent.run(input, context as Record<string, unknown>);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        await agent.onError(error);
        throw new AgentExecutionError(agent.config.id, error);
      } finally {
        await agent.onStop();
      }
    };

    return Promise.race([
      execution(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Agent "${agent.config.id}" timed out after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    ]);
  }
}

// ---------------------------------------------------------------------------
// AgentRegistry
// ---------------------------------------------------------------------------

/**
 * Central registry for agent instances.
 */
export class AgentRegistry {
  private readonly agents = new Map<string, BaseAgent>();

  /**
   * Register an agent.
   * @param agent - The agent to register.
   */
  register(agent: BaseAgent): void {
    this.agents.set(agent.config.id, agent);
  }

  /**
   * Retrieve an agent by ID.
   * @param id - Agent config ID.
   */
  get(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  /** List all registered agents. */
  list(): BaseAgent[] {
    return [...this.agents.values()];
  }

  /**
   * Remove an agent from the registry.
   * @param id - Agent config ID.
   * @returns `true` if an agent was removed, `false` if not found.
   */
  unregister(id: string): boolean {
    return this.agents.delete(id);
  }
}

// ---------------------------------------------------------------------------
// Concrete agent used internally by templates
// ---------------------------------------------------------------------------

class SimpleAgent extends BaseAgent {
  private readonly router: ModelRouter;

  constructor(config: AgentConfig, router: ModelRouter) {
    super(config);
    this.router = router;
  }

  async run(input: string): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: this.config.systemPrompt },
      { role: 'user', content: input },
    ];
    const response = await this.router.route(this.config.model, messages);
    return response.content;
  }
}

// ---------------------------------------------------------------------------
// Agent template factories
// ---------------------------------------------------------------------------

/** @returns A general-purpose assistant agent config. */
export function createGeneralAgent(overrides?: Partial<AgentConfig>): BaseAgent {
  const config = new AgentBuilder(overrides?.id ?? randomUUID())
    .withName(overrides?.name ?? 'General Assistant')
    .withDescription(overrides?.description ?? 'A versatile AI assistant capable of handling a wide range of tasks.')
    .withModel(overrides?.model ?? 'gpt-4o')
    .withSystemPrompt(
      overrides?.systemPrompt ??
        'You are a helpful, harmless, and honest AI assistant. Answer questions clearly and concisely.',
    )
    .withTools(overrides?.tools ?? ['calculator', 'dateTime'])
    .withMaxTokens(overrides?.maxTokens ?? 4096)
    .build();
  return new SimpleAgent(config, new ModelRouter());
}

/** @returns A research-focused agent. */
export function createResearchAgent(overrides?: Partial<AgentConfig>): BaseAgent {
  const config = new AgentBuilder(overrides?.id ?? randomUUID())
    .withName(overrides?.name ?? 'Research Agent')
    .withDescription(overrides?.description ?? 'Specializes in gathering, synthesizing, and summarizing information.')
    .withModel(overrides?.model ?? 'gpt-4o')
    .withSystemPrompt(
      overrides?.systemPrompt ??
        'You are a research assistant. Provide well-cited, accurate, and comprehensive answers.',
    )
    .withTools(overrides?.tools ?? ['webSearch', 'calculator', 'dateTime'])
    .withMaxTokens(overrides?.maxTokens ?? 8192)
    .withMemory({ shortTerm: true, longTerm: true })
    .build();
  return new SimpleAgent(config, new ModelRouter());
}

/** @returns A software engineering / code assistant agent. */
export function createCodingAgent(overrides?: Partial<AgentConfig>): BaseAgent {
  const config = new AgentBuilder(overrides?.id ?? randomUUID())
    .withName(overrides?.name ?? 'Coding Agent')
    .withDescription(overrides?.description ?? 'Expert software engineer that writes and reviews code.')
    .withModel(overrides?.model ?? 'gpt-4o')
    .withSystemPrompt(
      overrides?.systemPrompt ??
        'You are an expert software engineer. Write clean, well-tested, production-quality code. Explain your reasoning.',
    )
    .withTools(overrides?.tools ?? ['codeExecution', 'fileRead', 'fileWrite', 'calculator'])
    .withMaxTokens(overrides?.maxTokens ?? 8192)
    .build();
  return new SimpleAgent(config, new ModelRouter());
}

/** @returns An automation / workflow agent. */
export function createAutomationAgent(overrides?: Partial<AgentConfig>): BaseAgent {
  const config = new AgentBuilder(overrides?.id ?? randomUUID())
    .withName(overrides?.name ?? 'Automation Agent')
    .withDescription(overrides?.description ?? 'Automates repetitive tasks and orchestrates multi-step workflows.')
    .withModel(overrides?.model ?? 'gpt-4o')
    .withSystemPrompt(
      overrides?.systemPrompt ??
        'You are an automation specialist. Break tasks into clear steps, execute them reliably, and report outcomes.',
    )
    .withTools(overrides?.tools ?? ['fileRead', 'fileWrite', 'dateTime', 'calculator'])
    .withMaxTokens(overrides?.maxTokens ?? 4096)
    .build();
  return new SimpleAgent(config, new ModelRouter());
}

/** @returns A terminal / shell command agent. */
export function createTerminalAgent(overrides?: Partial<AgentConfig>): BaseAgent {
  const config = new AgentBuilder(overrides?.id ?? randomUUID())
    .withName(overrides?.name ?? 'Terminal Agent')
    .withDescription(overrides?.description ?? 'Executes and reasons about shell commands.')
    .withModel(overrides?.model ?? 'gpt-4o')
    .withSystemPrompt(
      overrides?.systemPrompt ??
        'You are a shell expert. Provide safe, correct shell commands and explain what they do before executing.',
    )
    .withTools(overrides?.tools ?? ['codeExecution', 'fileRead', 'fileWrite'])
    .withMaxTokens(overrides?.maxTokens ?? 4096)
    .build();
  return new SimpleAgent(config, new ModelRouter());
}

// ---------------------------------------------------------------------------
// Built-in template catalogue
// ---------------------------------------------------------------------------

/** Pre-defined template metadata used by agent-creation UIs. */
export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'general',
    name: 'General Assistant',
    systemPrompt: 'You are a helpful, harmless, and honest AI assistant.',
    tools: ['calculator', 'dateTime'],
    model: 'gpt-4o',
  },
  {
    id: 'research',
    name: 'Research Agent',
    systemPrompt: 'You are a research assistant. Provide well-cited, accurate, and comprehensive answers.',
    tools: ['webSearch', 'calculator', 'dateTime'],
    model: 'gpt-4o',
  },
  {
    id: 'coding',
    name: 'Coding Agent',
    systemPrompt: 'You are an expert software engineer. Write clean, well-tested, production-quality code.',
    tools: ['codeExecution', 'fileRead', 'fileWrite', 'calculator'],
    model: 'gpt-4o',
  },
  {
    id: 'automation',
    name: 'Automation Agent',
    systemPrompt: 'You are an automation specialist. Break tasks into clear steps and execute them reliably.',
    tools: ['fileRead', 'fileWrite', 'dateTime', 'calculator'],
    model: 'gpt-4o',
  },
  {
    id: 'terminal',
    name: 'Terminal Agent',
    systemPrompt: 'You are a shell expert. Provide safe, correct shell commands.',
    tools: ['codeExecution', 'fileRead', 'fileWrite'],
    model: 'gpt-4o',
  },
];
