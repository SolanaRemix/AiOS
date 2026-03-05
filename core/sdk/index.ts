/**
 * AiOS Agent Development SDK (Cerebrum).
 *
 * Provides the `BaseAgent` abstract class, `AgentBuilder` fluent constructor,
 * and supporting interfaces for building agents on the AiOS platform.
 */

import { randomUUID } from 'crypto';
import { AgentConfig, AgentLifecycle } from './types';

export { AgentConfig, AgentLifecycle, AgentEvent, ModelProvider } from './types';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** Describes a tool binding declared on an agent. */
export interface ToolBinding {
  /** Name of the tool (must match a registered ToolRegistry entry). */
  name: string;
  /** Optional per-binding configuration passed to the tool executor. */
  config?: Record<string, unknown>;
}

/** API surface for agent-side memory access. */
export type MemoryAccessAPI = {
  /** Retrieve the N most recent messages for this agent. */
  getRecent(n: number): Promise<Array<{ role: string; content: string }>>;
  /** Persist a message to memory. */
  addMessage(role: string, content: string): Promise<void>;
  /** Semantic search over long-term memory. */
  search(query: string, topK?: number): Promise<Array<{ id: string; content: string; score: number }>>;
};

// ---------------------------------------------------------------------------
// BaseAgent
// ---------------------------------------------------------------------------

/**
 * Abstract base class for all AiOS agents.
 *
 * Subclasses implement the abstract `run()` method and may override any of
 * the lifecycle hooks (`onInit`, `onStart`, `onStop`, `onError`).
 */
export abstract class BaseAgent {
  /** Resolved agent configuration. */
  readonly config: AgentConfig;

  /** Current lifecycle state. */
  protected lifecycle: AgentLifecycle = 'created';

  constructor(config: AgentConfig) {
    this.config = config;
  }

  // -------------------------------------------------------------------------
  // Lifecycle hooks – override in subclasses as needed
  // -------------------------------------------------------------------------

  /**
   * Called once before the agent starts running.
   * Use this to set up connections, load data, etc.
   */
  async onInit(): Promise<void> {
    // no-op default
  }

  /**
   * Called when the agent transitions to `running`.
   */
  async onStart(): Promise<void> {
    // no-op default
  }

  /**
   * Called when the agent stops (either cleanly or after an error).
   */
  async onStop(): Promise<void> {
    // no-op default
  }

  /**
   * Called when an unhandled error occurs during execution.
   * @param err - The error that was thrown.
   */
  async onError(err: Error): Promise<void> {
    // Default: re-surface the error so callers see it.
    throw err;
  }

  // -------------------------------------------------------------------------
  // Core execution – must be implemented by subclasses
  // -------------------------------------------------------------------------

  /**
   * Execute the agent's primary task.
   * @param input - User or system input string.
   * @param context - Arbitrary key/value context bag.
   * @returns The agent's text response.
   */
  abstract run(input: string, context?: Record<string, unknown>): Promise<string>;

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /** Transition to a new lifecycle state. */
  protected setState(state: AgentLifecycle): void {
    this.lifecycle = state;
  }

  /** Current lifecycle state (read-only external view). */
  get state(): AgentLifecycle {
    return this.lifecycle;
  }
}

// ---------------------------------------------------------------------------
// AgentBuilder
// ---------------------------------------------------------------------------

/**
 * Fluent builder for constructing {@link AgentConfig} objects.
 *
 * @example
 * ```ts
 * const config = new AgentBuilder('my-agent')
 *   .withName('My Agent')
 *   .withModel('gpt-4o')
 *   .withSystemPrompt('You are a helpful assistant.')
 *   .withTools(['calculator', 'dateTime'])
 *   .build();
 * ```
 */
export class AgentBuilder {
  private readonly cfg: AgentConfig;

  constructor(id?: string) {
    this.cfg = {
      id: id ?? randomUUID(),
      name: 'Unnamed Agent',
      description: '',
      model: 'gpt-4o',
      tools: [],
      memory: { shortTerm: true, longTerm: false },
      maxTokens: 4096,
      systemPrompt: 'You are a helpful AI assistant.',
    };
  }

  /** Set the agent's human-readable name. */
  withName(name: string): this {
    this.cfg.name = name;
    return this;
  }

  /** Set the agent description. */
  withDescription(description: string): this {
    this.cfg.description = description;
    return this;
  }

  /** Set the model identifier (e.g. "gpt-4o", "claude-3-5-sonnet-20241022"). */
  withModel(model: string): this {
    this.cfg.model = model;
    return this;
  }

  /** Declare which tools the agent may use. */
  withTools(tools: string[]): this {
    this.cfg.tools = [...tools];
    return this;
  }

  /** Append additional tools to the current list. */
  addTool(tool: string): this {
    this.cfg.tools.push(tool);
    return this;
  }

  /** Set the system prompt. */
  withSystemPrompt(prompt: string): this {
    this.cfg.systemPrompt = prompt;
    return this;
  }

  /** Set the maximum token budget for a single run. */
  withMaxTokens(maxTokens: number): this {
    this.cfg.maxTokens = maxTokens;
    return this;
  }

  /** Configure memory options. */
  withMemory(opts: Partial<AgentConfig['memory']>): this {
    Object.assign(this.cfg.memory, opts);
    return this;
  }

  /**
   * Build and return the immutable {@link AgentConfig}.
   * @throws {Error} if required fields are missing.
   */
  build(): AgentConfig {
    if (!this.cfg.name) throw new Error('AgentBuilder: name is required');
    if (!this.cfg.model) throw new Error('AgentBuilder: model is required');
    return { ...this.cfg };
  }
}
