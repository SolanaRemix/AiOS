/**
 * SDK types for agent definitions and lifecycle management.
 */

/** Model providers supported by the AiOS platform. */
export type ModelProvider = 'openai' | 'anthropic' | 'groq' | 'ollama';

/** Full lifecycle states an agent can transition through. */
export type AgentLifecycle =
  | 'created'
  | 'initializing'
  | 'running'
  | 'paused'
  | 'stopped'
  | 'error';

/** An event emitted by an agent during its lifecycle. */
export interface AgentEvent {
  /** Unique event identifier. */
  id: string;
  /** ID of the agent that emitted the event. */
  agentId: string;
  /** Lifecycle state that triggered the event. */
  type: AgentLifecycle | string;
  /** ISO timestamp. */
  timestamp: string;
  /** Event-specific payload. */
  payload?: unknown;
}

/** Declarative configuration for an agent. */
export interface AgentConfig {
  /** Unique identifier for this agent definition. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Short description of what the agent does. */
  description: string;
  /** Model string, e.g. "gpt-4o", "claude-3-5-sonnet-20241022". */
  model: string;
  /** Names of tools available to the agent. */
  tools: string[];
  /** Memory configuration flags. */
  memory: {
    shortTerm: boolean;
    longTerm: boolean;
  };
  /** Token budget for a single run. */
  maxTokens: number;
  /** System prompt injected at the start of every conversation. */
  systemPrompt: string;
}
