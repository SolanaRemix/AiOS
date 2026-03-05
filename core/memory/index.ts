/**
 * AiOS Memory Layer.
 *
 * Provides short-term (conversation buffer) and long-term (persistent store)
 * memory management for agents.  Uses only Node.js built-ins – no external
 * vector database dependencies.
 */

import { randomUUID } from 'crypto';
import { Message, MemoryEntry, MemorySearchResult } from './types';

export { Message, MemoryEntry, MemorySearchResult } from './types';

// ---------------------------------------------------------------------------
// InMemoryStore
// ---------------------------------------------------------------------------

/**
 * A simple in-memory key/value store that backs {@link LongTermMemory}.
 * Can be replaced with a real persistence adapter (Postgres, Redis, etc.).
 */
export class InMemoryStore {
  private readonly store = new Map<string, MemoryEntry>();

  /** Persist an entry. */
  set(entry: MemoryEntry): void {
    this.store.set(entry.id, entry);
  }

  /** Retrieve an entry by ID. */
  get(id: string): MemoryEntry | undefined {
    return this.store.get(id);
  }

  /** Delete an entry. Returns `true` if it existed. */
  delete(id: string): boolean {
    return this.store.delete(id);
  }

  /** Return all stored entries. */
  values(): MemoryEntry[] {
    return [...this.store.values()];
  }

  /** Number of stored entries. */
  get size(): number {
    return this.store.size;
  }

  /** Remove all entries. */
  clear(): void {
    this.store.clear();
  }
}

// ---------------------------------------------------------------------------
// ShortTermMemory
// ---------------------------------------------------------------------------

/**
 * Maintains a bounded conversation buffer for a single agent session.
 */
export class ShortTermMemory {
  private readonly buffer: Message[] = [];

  /**
   * @param maxMessages - Maximum messages to retain (default 100).
   */
  constructor(private readonly maxMessages: number = 100) {}

  /**
   * Append a message to the buffer.
   * Oldest messages are dropped when the buffer exceeds `maxMessages`.
   */
  add(message: Omit<Message, 'timestamp'> & { timestamp?: string }): void {
    const entry: Message = {
      role: message.role,
      content: message.content,
      timestamp: message.timestamp ?? new Date().toISOString(),
    };
    this.buffer.push(entry);
    if (this.buffer.length > this.maxMessages) {
      this.buffer.shift();
    }
  }

  /**
   * Return the N most recent messages (default: all).
   * @param n - Number of messages to return.
   */
  getRecent(n?: number): Message[] {
    if (n === undefined || n >= this.buffer.length) {
      return [...this.buffer];
    }
    return this.buffer.slice(-n);
  }

  /** Number of messages in the buffer. */
  get length(): number {
    return this.buffer.length;
  }

  /** Discard all messages. */
  clear(): void {
    this.buffer.length = 0;
  }
}

// ---------------------------------------------------------------------------
// LongTermMemory
// ---------------------------------------------------------------------------

/**
 * Persists memories across sessions with basic keyword-based search.
 *
 * For production use, replace the search implementation with a proper
 * embedding-based similarity search against a vector store.
 */
export class LongTermMemory {
  private readonly backend: InMemoryStore;

  constructor(store: InMemoryStore = new InMemoryStore()) {
    this.backend = store;
  }

  /**
   * Store new content in long-term memory.
   * @param content - Text to remember.
   * @param metadata - Optional metadata (tags, agentId, etc.).
   * @returns The ID of the newly created entry.
   */
  store(content: string, metadata: Record<string, unknown> = {}): string {
    const entry: MemoryEntry = {
      id: randomUUID(),
      content,
      metadata,
      createdAt: new Date().toISOString(),
    };
    this.backend.set(entry);
    return entry.id;
  }

  /**
   * Search for memories relevant to `query`.
   *
   * Uses a simple TF-IDF-inspired keyword overlap scoring.
   * @param query - Search query string.
   * @param topK - Maximum results to return (default 5).
   */
  search(query: string, topK = 5): MemorySearchResult[] {
    const queryTokens = tokenize(query);
    if (queryTokens.size === 0) return [];

    const results: MemorySearchResult[] = [];

    for (const entry of this.backend.values()) {
      const entryTokens = tokenize(entry.content);
      const score = jaccardSimilarity(queryTokens, entryTokens);
      if (score > 0) {
        results.push({ entry, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Delete an entry by ID.
   * @returns `true` if the entry existed and was removed.
   */
  delete(id: string): boolean {
    return this.backend.delete(id);
  }

  /** Number of entries in long-term memory. */
  get size(): number {
    return this.backend.size;
  }
}

// ---------------------------------------------------------------------------
// MemoryManager
// ---------------------------------------------------------------------------

/**
 * Orchestrates short-term and long-term memory for all agents.
 */
export class MemoryManager {
  private readonly shortTermBuffers = new Map<string, ShortTermMemory>();
  private readonly longTermStore: LongTermMemory;

  /**
   * @param store - Shared {@link InMemoryStore} instance (or subclass).
   * @param defaultBufferSize - Default message buffer size per agent.
   */
  constructor(
    store: InMemoryStore = new InMemoryStore(),
    private readonly defaultBufferSize = 100,
  ) {
    this.longTermStore = new LongTermMemory(store);
  }

  /** Get (or lazily create) the short-term buffer for `agentId`. */
  private getBuffer(agentId: string): ShortTermMemory {
    let buffer = this.shortTermBuffers.get(agentId);
    if (!buffer) {
      buffer = new ShortTermMemory(this.defaultBufferSize);
      this.shortTermBuffers.set(agentId, buffer);
    }
    return buffer;
  }

  /**
   * Add a message to an agent's short-term memory.
   * @param agentId - The agent's ID.
   * @param message - The message to store.
   */
  addMessage(agentId: string, message: Omit<Message, 'timestamp'> & { timestamp?: string }): void {
    this.getBuffer(agentId).add(message);
  }

  /**
   * Build an execution context (recent messages) for an agent.
   * @param agentId - The agent's ID.
   * @param recentN - Number of recent messages to include (default: all).
   */
  getContext(agentId: string, recentN?: number): Message[] {
    return this.getBuffer(agentId).getRecent(recentN);
  }

  /**
   * Persist something important to long-term memory.
   * @param content - Content to remember.
   * @param metadata - Metadata (should include agentId).
   */
  remember(content: string, metadata: Record<string, unknown> = {}): string {
    return this.longTermStore.store(content, metadata);
  }

  /**
   * Retrieve long-term memories relevant to a query.
   */
  recall(query: string, topK = 5): MemorySearchResult[] {
    return this.longTermStore.search(query, topK);
  }

  /**
   * Clear short-term memory for an agent.
   */
  clearShortTerm(agentId: string): void {
    this.getBuffer(agentId).clear();
  }

  /**
   * Remove a long-term memory entry.
   */
  forget(id: string): boolean {
    return this.longTermStore.delete(id);
  }

  /** Access the underlying long-term memory store. */
  get longTerm(): LongTermMemory {
    return this.longTermStore;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1),
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersectionSize = 0;
  for (const token of a) {
    if (b.has(token)) intersectionSize++;
  }
  const unionSize = a.size + b.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}
