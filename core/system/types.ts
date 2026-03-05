/**
 * System layer types.
 */

/** Logging severity levels. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** A structured log entry. */
export interface LogEntry {
  /** Severity level. */
  level: LogLevel;
  /** Human-readable message. */
  message: string;
  /** Optional correlation ID for request tracing. */
  correlationId?: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Arbitrary structured data attached to this log line. */
  data?: Record<string, unknown>;
}

/** A registered scheduled task. */
export interface ScheduledTask {
  /** Unique task identifier. */
  id: string;
  /** Human-readable cron expression (informational; parsing not implemented). */
  cronExpression?: string;
  /** Whether the task fires once or repeatedly. */
  recurring: boolean;
  /** Epoch ms of the next scheduled execution. */
  nextRunAt?: number;
  /** Whether the task is currently active. */
  active: boolean;
}

/** Metadata for an object stored in the storage backend. */
export interface StorageObject {
  /** Storage key / path. */
  key: string;
  /** Size in bytes. */
  size: number;
  /** ISO 8601 last-modified timestamp. */
  lastModified: string;
  /** Arbitrary metadata. */
  metadata?: Record<string, string>;
}
