import {
  EventBus,
  EventTypes,
  generateCorrelationId,
  withCorrelationId,
  currentCorrelationId,
} from '../events';
import type { AiOSEvent } from '../events';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  afterEach(() => {
    bus.removeAllListeners();
  });

  it('emits an event to a registered handler', async () => {
    const received: AiOSEvent[] = [];
    bus.on(EventTypes.AGENT_STARTED, (e) => received.push(e));

    bus.emit({ type: EventTypes.AGENT_STARTED, payload: { agentId: 'a1' }, source: 'test' });

    // Give microtasks a chance to settle
    await new Promise((r) => setTimeout(r, 10));
    expect(received).toHaveLength(1);
    expect(received[0].payload).toEqual({ agentId: 'a1' });
    expect(received[0].source).toBe('test');
  });

  it('fills in id, correlationId, and timestamp automatically', async () => {
    let received: AiOSEvent | null = null;
    bus.on(EventTypes.TOOL_EXECUTED, (e) => { received = e; });

    bus.emit({ type: EventTypes.TOOL_EXECUTED, payload: {}, source: 'tools' });
    await new Promise((r) => setTimeout(r, 10));

    expect(received).not.toBeNull();
    expect((received as unknown as AiOSEvent).id).toMatch(
      /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i,
    );
    expect((received as unknown as AiOSEvent).timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(typeof (received as unknown as AiOSEvent).correlationId).toBe('string');
  });

  it('off() removes a handler', async () => {
    const received: unknown[] = [];
    const handler = () => received.push(1);
    bus.on(EventTypes.AGENT_STOPPED, handler);
    bus.off(EventTypes.AGENT_STOPPED, handler);

    bus.emit({ type: EventTypes.AGENT_STOPPED, payload: {}, source: 'test' });
    await new Promise((r) => setTimeout(r, 10));
    expect(received).toHaveLength(0);
  });

  it('subscription.unsubscribe() works', async () => {
    const received: unknown[] = [];
    const sub = bus.on(EventTypes.AGENT_ERROR, () => received.push(1));
    sub.unsubscribe();

    bus.emit({ type: EventTypes.AGENT_ERROR, payload: {}, source: 'test' });
    await new Promise((r) => setTimeout(r, 10));
    expect(received).toHaveLength(0);
  });

  it('once() fires exactly once', async () => {
    const received: unknown[] = [];
    bus.once(EventTypes.MEMORY_UPDATED, () => received.push(1));

    bus.emit({ type: EventTypes.MEMORY_UPDATED, payload: {}, source: 'test' });
    bus.emit({ type: EventTypes.MEMORY_UPDATED, payload: {}, source: 'test' });
    await new Promise((r) => setTimeout(r, 10));

    expect(received).toHaveLength(1);
  });

  it('once() subscription can be cancelled before it fires', async () => {
    const received: unknown[] = [];
    const sub = bus.once(EventTypes.SYSTEM_EVENT, () => received.push(1));
    sub.unsubscribe();

    bus.emit({ type: EventTypes.SYSTEM_EVENT, payload: {}, source: 'test' });
    await new Promise((r) => setTimeout(r, 10));
    expect(received).toHaveLength(0);
  });

  it('listenerCount returns correct count', () => {
    const h1 = () => {};
    const h2 = () => {};
    bus.on(EventTypes.USER_ACTION, h1);
    bus.once(EventTypes.USER_ACTION, h2);
    expect(bus.listenerCount(EventTypes.USER_ACTION)).toBe(2);
    bus.off(EventTypes.USER_ACTION, h1);
    expect(bus.listenerCount(EventTypes.USER_ACTION)).toBe(1);
  });

  it('multiple handlers receive the same event', async () => {
    const counts = [0, 0];
    bus.on(EventTypes.SYSCALL_DISPATCHED, () => counts[0]++);
    bus.on(EventTypes.SYSCALL_DISPATCHED, () => counts[1]++);

    bus.emit({ type: EventTypes.SYSCALL_DISPATCHED, payload: {}, source: 'kernel' });
    await new Promise((r) => setTimeout(r, 10));
    expect(counts).toEqual([1, 1]);
  });

  it('removeAllListeners(type) clears only that type', async () => {
    const a: unknown[] = [];
    const b: unknown[] = [];
    bus.on(EventTypes.AGENT_STARTED, () => a.push(1));
    bus.on(EventTypes.AGENT_STOPPED, () => b.push(1));
    bus.removeAllListeners(EventTypes.AGENT_STARTED);

    bus.emit({ type: EventTypes.AGENT_STARTED, payload: {}, source: 'test' });
    bus.emit({ type: EventTypes.AGENT_STOPPED, payload: {}, source: 'test' });
    await new Promise((r) => setTimeout(r, 10));
    expect(a).toHaveLength(0);
    expect(b).toHaveLength(1);
  });

  it('preserves custom correlationId in emitted event', async () => {
    let received: AiOSEvent | null = null;
    bus.on(EventTypes.SYSTEM_EVENT, (e) => { received = e; });

    bus.emit({
      type: EventTypes.SYSTEM_EVENT,
      payload: {},
      source: 'test',
      correlationId: 'custom-corr-id',
    });
    await new Promise((r) => setTimeout(r, 10));
    expect((received as unknown as AiOSEvent).correlationId).toBe('custom-corr-id');
  });

  it('handler errors do not crash the bus', async () => {
    bus.on(EventTypes.USER_ACTION, () => { throw new Error('handler boom'); });
    const received: unknown[] = [];
    bus.on(EventTypes.USER_ACTION, () => received.push(1));

    bus.emit({ type: EventTypes.USER_ACTION, payload: {}, source: 'test' });
    await new Promise((r) => setTimeout(r, 20));
    expect(received).toHaveLength(1); // second handler still fires
  });
});

describe('Correlation ID utilities', () => {
  it('generateCorrelationId returns a UUID', () => {
    const id = generateCorrelationId();
    expect(id).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i);
  });

  it('generateCorrelationId generates unique values', () => {
    const ids = new Set([generateCorrelationId(), generateCorrelationId(), generateCorrelationId()]);
    expect(ids.size).toBe(3);
  });

  it('withCorrelationId sets the active correlation ID inside the callback', async () => {
    const captured: string[] = [];
    await withCorrelationId('trace-abc', async () => {
      captured.push(currentCorrelationId());
    });
    expect(captured[0]).toBe('trace-abc');
  });

  it('withCorrelationId restores previous correlation ID after callback', async () => {
    await withCorrelationId('outer', async () => {
      await withCorrelationId('inner', async () => {
        expect(currentCorrelationId()).toBe('inner');
      });
      expect(currentCorrelationId()).toBe('outer');
    });
  });

  it('currentCorrelationId returns a UUID when no active ID', () => {
    // After the previous test, no active ID should remain
    const id = currentCorrelationId();
    expect(id).toMatch(/^[\da-f]{8}-/i);
  });
});

describe('EventTypes', () => {
  it('defines all required event type constants', () => {
    expect(EventTypes.AGENT_STARTED).toBe('agent:started');
    expect(EventTypes.AGENT_STOPPED).toBe('agent:stopped');
    expect(EventTypes.AGENT_ERROR).toBe('agent:error');
    expect(EventTypes.TOOL_EXECUTED).toBe('tool:executed');
    expect(EventTypes.MEMORY_UPDATED).toBe('memory:updated');
    expect(EventTypes.SYSCALL_DISPATCHED).toBe('syscall:dispatched');
    expect(EventTypes.USER_ACTION).toBe('user:action');
    expect(EventTypes.SYSTEM_EVENT).toBe('system:event');
  });
});
