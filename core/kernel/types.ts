/**
 * Kernel types for the AiOS process model.
 */

/** Resource constraints applied to an agent process. */
export interface ResourceLimits {
  /** Maximum heap memory in megabytes. */
  maxMemoryMb: number;
  /** Maximum LLM tokens consumed per minute. */
  maxTokensPerMin: number;
  /** Maximum number of tools the agent may run concurrently. */
  maxConcurrentTools: number;
}

/** Lifecycle states an agent process can occupy. */
export type ProcessStatus = 'idle' | 'running' | 'suspended' | 'terminated';

/** A running (or terminated) agent process tracked by the kernel. */
export interface AgentProcess {
  /** Unique process identifier (UUID). */
  id: string;
  /** ID of the agent definition powering this process. */
  agentId: string;
  /** Current lifecycle state. */
  status: ProcessStatus;
  /** Wall-clock time the process was created. */
  startedAt: Date;
  /** Monotonically incrementing process identifier (kernel-internal). */
  pid: number;
  /** Resource constraints applied to this process. */
  resourceLimits: ResourceLimits;
}

/** Kernel-level system call names. */
export type SysCall =
  | 'spawn'
  | 'terminate'
  | 'contextSwitch'
  | 'allocate'
  | 'release'
  | 'dispatch';

/** Arguments passed to a kernel system call. */
export type SysCallArgs = Record<string, unknown>;
