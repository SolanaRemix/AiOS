/**
 * Memory layer types.
 */

/** A single conversation turn. */
export interface Message {
  /** Who sent the message. */
  role: 'user' | 'assistant' | 'system';
  /** Text content of the message. */
  content: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
}

/** A stored memory entry (long-term). */
export interface MemoryEntry {
  /** Unique identifier (UUID). */
  id: string;
  /** Raw text content. */
  content: string;
  /** Optional embedding vector for semantic search. */
  embedding?: number[];
  /** Arbitrary metadata attached to this entry. */
  metadata: Record<string, unknown>;
  /** ISO 8601 creation timestamp. */
  createdAt: string;
}

/** A single result from a memory search. */
export interface MemorySearchResult {
  /** The matching entry. */
  entry: MemoryEntry;
  /** Similarity score in [0, 1] (higher = more similar). */
  score: number;
}
