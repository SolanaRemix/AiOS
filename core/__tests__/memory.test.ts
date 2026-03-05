import {
  ShortTermMemory,
  LongTermMemory,
  MemoryManager,
  InMemoryStore,
} from '../memory';

describe('ShortTermMemory', () => {
  let mem: ShortTermMemory;

  beforeEach(() => {
    mem = new ShortTermMemory(5);
  });

  it('starts empty', () => {
    expect(mem.length).toBe(0);
    expect(mem.getRecent()).toEqual([]);
  });

  it('adds a message with auto-timestamp', () => {
    mem.add({ role: 'user', content: 'Hello' });
    expect(mem.length).toBe(1);
    const msgs = mem.getRecent();
    expect(msgs[0].role).toBe('user');
    expect(msgs[0].content).toBe('Hello');
    expect(msgs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('adds a message with explicit timestamp', () => {
    const ts = '2024-01-01T00:00:00.000Z';
    mem.add({ role: 'assistant', content: 'Hi', timestamp: ts });
    expect(mem.getRecent()[0].timestamp).toBe(ts);
  });

  it('evicts oldest message when buffer is full', () => {
    for (let i = 1; i <= 6; i++) {
      mem.add({ role: 'user', content: `msg-${i}` });
    }
    expect(mem.length).toBe(5); // maxMessages = 5
    expect(mem.getRecent()[0].content).toBe('msg-2'); // msg-1 evicted
  });

  it('getRecent(n) returns the last n messages', () => {
    for (let i = 1; i <= 4; i++) {
      mem.add({ role: 'user', content: `msg-${i}` });
    }
    const recent = mem.getRecent(2);
    expect(recent).toHaveLength(2);
    expect(recent[0].content).toBe('msg-3');
    expect(recent[1].content).toBe('msg-4');
  });

  it('getRecent(n) returns all when n > length', () => {
    mem.add({ role: 'user', content: 'only' });
    expect(mem.getRecent(100)).toHaveLength(1);
  });

  it('clears all messages', () => {
    mem.add({ role: 'user', content: 'x' });
    mem.clear();
    expect(mem.length).toBe(0);
  });
});

describe('InMemoryStore', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  it('stores and retrieves an entry', () => {
    const entry = {
      id: 'e1',
      content: 'hello',
      metadata: {},
      createdAt: new Date().toISOString(),
    };
    store.set(entry);
    expect(store.get('e1')).toEqual(entry);
  });

  it('deletes an entry', () => {
    const entry = { id: 'e2', content: 'bye', metadata: {}, createdAt: new Date().toISOString() };
    store.set(entry);
    expect(store.delete('e2')).toBe(true);
    expect(store.get('e2')).toBeUndefined();
  });

  it('returns false when deleting non-existent entry', () => {
    expect(store.delete('nope')).toBe(false);
  });

  it('tracks size correctly', () => {
    expect(store.size).toBe(0);
    store.set({ id: 'x', content: '', metadata: {}, createdAt: '' });
    expect(store.size).toBe(1);
    store.clear();
    expect(store.size).toBe(0);
  });
});

describe('LongTermMemory', () => {
  let ltm: LongTermMemory;

  beforeEach(() => {
    ltm = new LongTermMemory();
  });

  it('stores content and returns an id', () => {
    const id = ltm.store('TypeScript is great for large codebases');
    expect(typeof id).toBe('string');
    expect(id).toHaveLength(36); // UUID
  });

  it('searches by keyword overlap', () => {
    ltm.store('TypeScript is great for large codebases');
    ltm.store('Python is used in data science');
    ltm.store('JavaScript runs in the browser');

    const results = ltm.search('TypeScript codebases');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry.content).toMatch(/TypeScript/);
    expect(results[0].score).toBeGreaterThan(0);
  });

  it('returns results sorted by descending score', () => {
    ltm.store('cats and dogs and birds');
    ltm.store('cats');
    ltm.store('dogs and birds');

    const results = ltm.search('cats dogs birds');
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
    }
  });

  it('returns empty array when no matches', () => {
    ltm.store('completely unrelated');
    expect(ltm.search('quantum physics')).toHaveLength(0);
  });

  it('respects topK limit', () => {
    for (let i = 0; i < 10; i++) {
      ltm.store(`item ${i} test content`);
    }
    const results = ltm.search('test content', 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('deletes an entry', () => {
    const id = ltm.store('to be deleted');
    expect(ltm.delete(id)).toBe(true);
    expect(ltm.search('to be deleted')).toHaveLength(0);
  });
});

describe('MemoryManager', () => {
  let manager: MemoryManager;

  beforeEach(() => {
    manager = new MemoryManager();
  });

  it('adds messages and retrieves context', () => {
    manager.addMessage('agent-1', { role: 'user', content: 'Hello' });
    manager.addMessage('agent-1', { role: 'assistant', content: 'Hi there!' });
    const ctx = manager.getContext('agent-1');
    expect(ctx).toHaveLength(2);
    expect(ctx[0].role).toBe('user');
    expect(ctx[1].role).toBe('assistant');
  });

  it('isolates memory between agents', () => {
    manager.addMessage('agent-a', { role: 'user', content: 'From A' });
    manager.addMessage('agent-b', { role: 'user', content: 'From B' });
    const ctxA = manager.getContext('agent-a');
    const ctxB = manager.getContext('agent-b');
    expect(ctxA).toHaveLength(1);
    expect(ctxA[0].content).toBe('From A');
    expect(ctxB[0].content).toBe('From B');
  });

  it('clears short-term memory for an agent', () => {
    manager.addMessage('agent-c', { role: 'user', content: 'test' });
    manager.clearShortTerm('agent-c');
    expect(manager.getContext('agent-c')).toHaveLength(0);
  });

  it('stores and recalls long-term memories', () => {
    manager.remember('Important fact about neural networks', { agentId: 'agent-1' });
    const results = manager.recall('neural networks');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry.content).toMatch(/neural networks/);
  });

  it('forgets a long-term memory', () => {
    const id = manager.remember('Temporary knowledge');
    expect(manager.forget(id)).toBe(true);
    expect(manager.recall('Temporary knowledge')).toHaveLength(0);
  });

  it('getContext with recentN limits results', () => {
    for (let i = 1; i <= 5; i++) {
      manager.addMessage('agent-d', { role: 'user', content: `msg-${i}` });
    }
    const ctx = manager.getContext('agent-d', 2);
    expect(ctx).toHaveLength(2);
    expect(ctx[1].content).toBe('msg-5');
  });
});
