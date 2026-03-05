/**
 * Agent runtime types.
 */

import { ModelProvider } from '../sdk/types';

export { ModelProvider } from '../sdk/types';

/** The provider-resolved model string for routing. */
export interface ResolvedModel {
  provider: ModelProvider;
  modelId: string;
}

/** Contextual data passed to `AgentExecutor.execute()`. */
export interface ExecutionContext {
  /** Correlation / trace ID for this execution. */
  correlationId?: string;
  /** Conversation or session ID. */
  sessionId?: string;
  /** Arbitrary extra data (e.g. user metadata, feature flags). */
  metadata?: Record<string, unknown>;
  /** Maximum wall-clock ms before the execution times out. */
  timeoutMs?: number;
}

/** A named agent template definition. */
export interface AgentTemplate {
  /** Template identifier (e.g. "general", "research"). */
  id: string;
  /** Human-readable label. */
  name: string;
  /** Default system prompt for agents created from this template. */
  systemPrompt: string;
  /** Default tools available to agents of this template. */
  tools: string[];
  /** Default model. */
  model: string;
}
