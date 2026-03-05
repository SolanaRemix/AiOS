/**
 * AiOS Kernel – LLM-driven OS abstraction layer.
 *
 * The Kernel owns the agent process registry, resource budgets, and the
 * central system-call dispatcher used by every other subsystem.
 */

import { randomUUID } from 'crypto';
import {
  AgentProcess,
  ResourceLimits,
  SysCall,
  SysCallArgs,
} from './types';

export { AgentProcess, ResourceLimits, SysCall, SysCallArgs } from './types';

/** Error thrown when a kernel operation targets an unknown process. */
export class KernelProcessNotFoundError extends Error {
  constructor(id: string) {
    super(`Kernel: process not found – "${id}"`);
    this.name = 'KernelProcessNotFoundError';
  }
}

/** Error thrown when resource limits are invalid. */
export class KernelResourceError extends Error {
  constructor(message: string) {
    super(`Kernel resource error: ${message}`);
    this.name = 'KernelResourceError';
  }
}

const DEFAULT_LIMITS: ResourceLimits = {
  maxMemoryMb: 512,
  maxTokensPerMin: 10_000,
  maxConcurrentTools: 5,
};

/** Manages agent process lifecycle and resource allocation. */
export class ProcessManager {
  private readonly processes = new Map<string, AgentProcess>();
  private pidCounter = 0;

  /**
   * Spawn a new process for the given agent.
   * @param agentId - The agent definition ID.
   * @param limits - Optional resource overrides.
   * @returns The newly created {@link AgentProcess}.
   */
  create(agentId: string, limits?: Partial<ResourceLimits>): AgentProcess {
    const process: AgentProcess = {
      id: randomUUID(),
      agentId,
      status: 'idle',
      startedAt: new Date(),
      pid: ++this.pidCounter,
      resourceLimits: { ...DEFAULT_LIMITS, ...limits },
    };
    this.processes.set(process.id, process);
    return process;
  }

  /**
   * Transition a process to `running` status.
   * @param processId - The process UUID.
   */
  run(processId: string): AgentProcess {
    const proc = this.getOrThrow(processId);
    if (proc.status === 'terminated') {
      throw new KernelProcessNotFoundError(processId);
    }
    proc.status = 'running';
    return proc;
  }

  /**
   * Terminate a process and free its slot.
   * @param processId - The process UUID.
   */
  terminate(processId: string): void {
    const proc = this.getOrThrow(processId);
    proc.status = 'terminated';
  }

  /**
   * Suspend a running process (e.g. while waiting for I/O).
   */
  suspend(processId: string): void {
    const proc = this.getOrThrow(processId);
    if (proc.status === 'running') proc.status = 'suspended';
  }

  /** Resume a suspended process. */
  resume(processId: string): void {
    const proc = this.getOrThrow(processId);
    if (proc.status === 'suspended') proc.status = 'running';
  }

  /** Return all non-terminated processes. */
  list(): AgentProcess[] {
    return [...this.processes.values()].filter(
      (p) => p.status !== 'terminated',
    );
  }

  /** Return a single process or throw. */
  get(processId: string): AgentProcess | undefined {
    return this.processes.get(processId);
  }

  private getOrThrow(processId: string): AgentProcess {
    const proc = this.processes.get(processId);
    if (!proc) throw new KernelProcessNotFoundError(processId);
    return proc;
  }
}

/**
 * The AiOS Kernel.
 *
 * Acts as the operating-system abstraction for the platform: it manages
 * agent processes, resource budgets, context switches, and system calls.
 */
export class Kernel {
  /** Manages agent process lifecycle. */
  readonly processManager = new ProcessManager();

  /** Active agent context (the process that currently "has the CPU"). */
  private activeProcessId: string | null = null;

  /** Per-agent resource tracking (tokens consumed this minute, etc.). */
  private readonly resourceUsage = new Map<
    string,
    { tokensThisMin: number; activeTools: number; resetAt: number }
  >();

  /**
   * Switch the active context to the process owning `agentId`.
   * Suspends the previously active process (if any).
   * @param agentId - The agent whose process should become active.
   * @returns The process that is now active.
   */
  contextSwitch(agentId: string): AgentProcess {
    const procs = this.processManager.list();
    const target = procs.find((p) => p.agentId === agentId);
    if (!target) throw new KernelProcessNotFoundError(agentId);

    if (this.activeProcessId && this.activeProcessId !== target.id) {
      this.processManager.suspend(this.activeProcessId);
    }

    this.processManager.run(target.id);
    this.activeProcessId = target.id;
    return target;
  }

  /**
   * Dispatch a kernel system call.
   * @param syscall - The system call name.
   * @param args - Call-specific arguments.
   * @returns The result of the system call.
   */
  dispatch(syscall: SysCall, args: SysCallArgs = {}): unknown {
    switch (syscall) {
      case 'spawn': {
        const { agentId, limits } = args as {
          agentId: string;
          limits?: Partial<ResourceLimits>;
        };
        return this.processManager.create(agentId, limits);
      }
      case 'terminate': {
        const { processId } = args as { processId: string };
        this.processManager.terminate(processId);
        this.releaseResources(processId);
        return null;
      }
      case 'contextSwitch': {
        const { agentId } = args as { agentId: string };
        return this.contextSwitch(agentId);
      }
      case 'allocate': {
        const { agentId, limits } = args as {
          agentId: string;
          limits: Partial<ResourceLimits>;
        };
        return this.allocateResources(agentId, limits);
      }
      case 'release': {
        const { agentId } = args as { agentId: string };
        this.releaseResources(agentId);
        return null;
      }
      case 'dispatch':
        // Meta-dispatch: used for forwarding – returns args unchanged.
        return args;
      default:
        throw new Error(`Unknown syscall: ${String(syscall)}`);
    }
  }

  /**
   * Allocate resource limits for an agent.
   * @param agentId - The agent to allocate for.
   * @param limits - Resource budget to apply.
   */
  allocateResources(agentId: string, limits: Partial<ResourceLimits>): void {
    if (
      limits.maxMemoryMb !== undefined &&
      limits.maxMemoryMb <= 0
    ) {
      throw new KernelResourceError('maxMemoryMb must be positive');
    }
    const existing = this.resourceUsage.get(agentId) ?? {
      tokensThisMin: 0,
      activeTools: 0,
      resetAt: Date.now() + 60_000,
    };
    this.resourceUsage.set(agentId, existing);

    // Apply limits to any existing process for this agent.
    const proc = this.processManager
      .list()
      .find((p) => p.agentId === agentId);
    if (proc) {
      Object.assign(proc.resourceLimits, limits);
    }
  }

  /**
   * Release all resource tracking for an agent.
   * @param agentId - The agent to release.
   */
  releaseResources(agentId: string): void {
    this.resourceUsage.delete(agentId);
  }

  /** Returns current resource usage for an agent. */
  getResourceUsage(agentId: string) {
    return this.resourceUsage.get(agentId) ?? null;
  }

  /** The process ID that currently owns the CPU context (or null). */
  get activeContext(): string | null {
    return this.activeProcessId;
  }
}
