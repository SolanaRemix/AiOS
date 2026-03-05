import { Kernel, ProcessManager, KernelProcessNotFoundError, KernelResourceError } from '../kernel';

describe('ProcessManager', () => {
  let pm: ProcessManager;

  beforeEach(() => {
    pm = new ProcessManager();
  });

  it('creates a process with the correct defaults', () => {
    const proc = pm.create('agent-1');
    expect(proc.agentId).toBe('agent-1');
    expect(proc.status).toBe('idle');
    expect(proc.pid).toBeGreaterThan(0);
    expect(proc.resourceLimits.maxMemoryMb).toBe(512);
    expect(proc.resourceLimits.maxTokensPerMin).toBe(10_000);
    expect(proc.resourceLimits.maxConcurrentTools).toBe(5);
    expect(proc.startedAt).toBeInstanceOf(Date);
  });

  it('applies resource limit overrides', () => {
    const proc = pm.create('agent-2', { maxMemoryMb: 256, maxConcurrentTools: 2 });
    expect(proc.resourceLimits.maxMemoryMb).toBe(256);
    expect(proc.resourceLimits.maxConcurrentTools).toBe(2);
    expect(proc.resourceLimits.maxTokensPerMin).toBe(10_000); // default unchanged
  });

  it('transitions a process to running', () => {
    const proc = pm.create('agent-3');
    const running = pm.run(proc.id);
    expect(running.status).toBe('running');
  });

  it('terminates a process', () => {
    const proc = pm.create('agent-4');
    pm.run(proc.id);
    pm.terminate(proc.id);
    expect(pm.get(proc.id)?.status).toBe('terminated');
  });

  it('excludes terminated processes from list()', () => {
    const a = pm.create('agent-a');
    const b = pm.create('agent-b');
    pm.terminate(a.id);
    const active = pm.list();
    expect(active.some((p) => p.id === a.id)).toBe(false);
    expect(active.some((p) => p.id === b.id)).toBe(true);
  });

  it('suspends and resumes a process', () => {
    const proc = pm.create('agent-5');
    pm.run(proc.id);
    pm.suspend(proc.id);
    expect(pm.get(proc.id)?.status).toBe('suspended');
    pm.resume(proc.id);
    expect(pm.get(proc.id)?.status).toBe('running');
  });

  it('throws KernelProcessNotFoundError for unknown process', () => {
    expect(() => pm.run('nonexistent')).toThrow(KernelProcessNotFoundError);
  });

  it('assigns incrementing pids', () => {
    const p1 = pm.create('a1');
    const p2 = pm.create('a2');
    expect(p2.pid).toBeGreaterThan(p1.pid);
  });
});

describe('Kernel', () => {
  let kernel: Kernel;

  beforeEach(() => {
    kernel = new Kernel();
  });

  it('dispatches spawn syscall', () => {
    const proc = kernel.dispatch('spawn', { agentId: 'my-agent' }) as ReturnType<
      ProcessManager['create']
    >;
    expect(proc.agentId).toBe('my-agent');
  });

  it('dispatches terminate syscall', () => {
    const proc = kernel.dispatch('spawn', { agentId: 'agent-x' }) as { id: string };
    kernel.dispatch('terminate', { processId: proc.id });
    expect(kernel.processManager.get(proc.id)?.status).toBe('terminated');
  });

  it('performs context switch', () => {
    const proc = kernel.dispatch('spawn', { agentId: 'ctx-agent' }) as { id: string; agentId: string };
    const active = kernel.contextSwitch(proc.agentId);
    expect(active.agentId).toBe(proc.agentId);
    expect(kernel.activeContext).toBe(proc.id);
  });

  it('suspends previous process on context switch', () => {
    const p1 = kernel.dispatch('spawn', { agentId: 'agent-1' }) as { id: string; agentId: string };
    const p2 = kernel.dispatch('spawn', { agentId: 'agent-2' }) as { id: string; agentId: string };

    kernel.contextSwitch(p1.agentId);
    kernel.contextSwitch(p2.agentId);

    expect(kernel.processManager.get(p1.id)?.status).toBe('suspended');
    expect(kernel.processManager.get(p2.id)?.status).toBe('running');
  });

  it('allocates and releases resources', () => {
    kernel.dispatch('spawn', { agentId: 'res-agent' });
    kernel.allocateResources('res-agent', { maxMemoryMb: 128 });
    expect(kernel.getResourceUsage('res-agent')).not.toBeNull();

    kernel.releaseResources('res-agent');
    expect(kernel.getResourceUsage('res-agent')).toBeNull();
  });

  it('throws KernelResourceError for invalid resource limits', () => {
    expect(() => kernel.allocateResources('bad-agent', { maxMemoryMb: -1 })).toThrow(
      KernelResourceError,
    );
  });

  it('throws for context switch to unknown agent', () => {
    expect(() => kernel.contextSwitch('nonexistent')).toThrow(KernelProcessNotFoundError);
  });

  it('dispatches allocate syscall', () => {
    kernel.dispatch('spawn', { agentId: 'alloc-agent' });
    expect(() =>
      kernel.dispatch('allocate', { agentId: 'alloc-agent', limits: { maxMemoryMb: 256 } }),
    ).not.toThrow();
  });

  it('dispatches release syscall', () => {
    kernel.dispatch('spawn', { agentId: 'rel-agent' });
    kernel.dispatch('allocate', { agentId: 'rel-agent', limits: { maxMemoryMb: 64 } });
    expect(() => kernel.dispatch('release', { agentId: 'rel-agent' })).not.toThrow();
  });

  it('throws for unknown syscall', () => {
    expect(() => kernel.dispatch('unknown' as never, {})).toThrow();
  });
});
