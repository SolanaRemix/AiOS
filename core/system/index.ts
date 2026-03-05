/**
 * AiOS System Layer.
 *
 * Provides Logger, Scheduler, SecretsManager, StorageManager, RateLimiter,
 * and a unified SystemCalls facade.  Uses only Node.js built-ins.
 */

import { LogLevel, LogEntry, ScheduledTask, StorageObject } from './types';

export { LogLevel, LogEntry, ScheduledTask, StorageObject } from './types';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class SecretsValidationError extends Error {
  constructor(missingKeys: string[]) {
    super(`Missing required environment variables: ${missingKeys.join(', ')}`);
    this.name = 'SecretsValidationError';
  }
}

export class StorageError extends Error {
  constructor(operation: string, key: string, cause?: string) {
    super(`Storage ${operation} failed for key "${key}"${cause ? `: ${cause}` : ''}`);
    this.name = 'StorageError';
  }
}

export class SchedulerError extends Error {
  constructor(message: string) {
    super(`Scheduler: ${message}`);
    this.name = 'SchedulerError';
  }
}

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Structured JSON logger with correlation ID support and configurable
 * minimum log level.
 */
export class Logger {
  private correlationId: string | undefined;

  /**
   * @param context - A name for this logger (included in every line).
   * @param minLevel - Minimum level to emit (default: 'debug').
   */
  constructor(
    private readonly context: string = 'AiOS',
    private minLevel: LogLevel = 'debug',
  ) {}

  /** Set a correlation ID that is included in every subsequent log entry. */
  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  /** Clear the active correlation ID. */
  clearCorrelationId(): void {
    this.correlationId = undefined;
  }

  /** Change the minimum log level at runtime. */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /** Log at DEBUG level. */
  debug(message: string, data?: Record<string, unknown>): void {
    this.write('debug', message, data);
  }

  /** Log at INFO level. */
  info(message: string, data?: Record<string, unknown>): void {
    this.write('info', message, data);
  }

  /** Log at WARN level. */
  warn(message: string, data?: Record<string, unknown>): void {
    this.write('warn', message, data);
  }

  /** Log at ERROR level. */
  error(message: string, data?: Record<string, unknown>): void {
    this.write('error', message, data);
  }

  /**
   * Build a log entry and write it to stdout/stderr.
   */
  private write(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (LOG_LEVEL_ORDER[level] < LOG_LEVEL_ORDER[this.minLevel]) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(this.correlationId ? { correlationId: this.correlationId } : {}),
      ...(data ? { data } : {}),
    };

    const line = JSON.stringify({ context: this.context, ...entry });
    if (level === 'error' || level === 'warn') {
      process.stderr.write(line + '\n');
    } else {
      process.stdout.write(line + '\n');
    }
  }

  /**
   * Create a child logger that inherits settings but has its own context label.
   */
  child(subContext: string): Logger {
    const child = new Logger(`${this.context}:${subContext}`, this.minLevel);
    if (this.correlationId) child.setCorrelationId(this.correlationId);
    return child;
  }
}

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

interface TaskEntry {
  meta: ScheduledTask;
  handle: ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>;
}

/**
 * Simple task scheduler backed by Node.js timers.
 *
 * Cron expressions are stored as metadata only; real cron parsing is outside
 * the scope of this module (no external deps).  Use `schedule()` for
 * repeating tasks (interval-based) and `scheduleOnce()` for one-shot tasks.
 */
export class Scheduler {
  private readonly tasks = new Map<string, TaskEntry>();

  /**
   * Schedule a recurring task.
   * @param id - Unique task identifier.
   * @param cronExpression - Human-readable label / cron string (stored as metadata).
   * @param fn - Function to invoke each interval.
   * @param intervalMs - Actual millisecond interval (required alongside cron label).
   */
  schedule(id: string, cronExpression: string, fn: () => void, intervalMs: number): ScheduledTask {
    if (this.tasks.has(id)) throw new SchedulerError(`Task "${id}" already scheduled`);
    if (intervalMs <= 0) throw new SchedulerError('intervalMs must be positive');

    const meta: ScheduledTask = {
      id,
      cronExpression,
      recurring: true,
      nextRunAt: Date.now() + intervalMs,
      active: true,
    };

    const handle = setInterval(() => {
      meta.nextRunAt = Date.now() + intervalMs;
      fn();
    }, intervalMs);

    this.tasks.set(id, { meta, handle });
    return { ...meta };
  }

  /**
   * Schedule a one-shot task.
   * @param id - Unique task identifier.
   * @param delayMs - Delay before execution.
   * @param fn - Function to invoke.
   */
  scheduleOnce(id: string, delayMs: number, fn: () => void): ScheduledTask {
    if (this.tasks.has(id)) throw new SchedulerError(`Task "${id}" already scheduled`);
    if (delayMs < 0) throw new SchedulerError('delayMs must be >= 0');

    const meta: ScheduledTask = {
      id,
      recurring: false,
      nextRunAt: Date.now() + delayMs,
      active: true,
    };

    const handle = setTimeout(() => {
      meta.active = false;
      meta.nextRunAt = undefined;
      this.tasks.delete(id);
      fn();
    }, delayMs);

    this.tasks.set(id, { meta, handle });
    return { ...meta };
  }

  /**
   * Cancel a scheduled task.
   * @param id - Task identifier.
   * @returns `true` if the task existed and was cancelled.
   */
  cancel(id: string): boolean {
    const entry = this.tasks.get(id);
    if (!entry) return false;
    if (entry.meta.recurring) {
      clearInterval(entry.handle as ReturnType<typeof setInterval>);
    } else {
      clearTimeout(entry.handle as ReturnType<typeof setTimeout>);
    }
    entry.meta.active = false;
    this.tasks.delete(id);
    return true;
  }

  /** List all currently active tasks. */
  list(): ScheduledTask[] {
    return [...this.tasks.values()].map((e) => ({ ...e.meta }));
  }

  /** Cancel all tasks and clear the scheduler. */
  clear(): void {
    for (const id of [...this.tasks.keys()]) {
      this.cancel(id);
    }
  }
}

// ---------------------------------------------------------------------------
// SecretsManager
// ---------------------------------------------------------------------------

/**
 * Reads secrets from `process.env`.  In production this can be backed by
 * AWS Secrets Manager, Vault, or another provider.
 */
export class SecretsManager {
  private readonly overrides = new Map<string, string>();

  /**
   * Retrieve a secret value.
   * @param key - Environment variable name.
   * @returns The value or `undefined` if not set.
   */
  get(key: string): string | undefined {
    return this.overrides.get(key) ?? process.env[key];
  }

  /**
   * Set (or override) a secret value at runtime.
   * @param key - Secret key.
   * @param value - Secret value.
   */
  set(key: string, value: string): void {
    this.overrides.set(key, value);
  }

  /**
   * Assert that all required secrets are present.
   * @param requiredKeys - List of required environment variable names.
   * @throws {@link SecretsValidationError} if any are missing.
   */
  validate(requiredKeys: string[]): void {
    const missing = requiredKeys.filter((k) => this.get(k) === undefined);
    if (missing.length > 0) throw new SecretsValidationError(missing);
  }
}

// ---------------------------------------------------------------------------
// StorageManager
// ---------------------------------------------------------------------------

/**
 * S3-compatible storage abstraction stub.
 *
 * Swap out the implementation with `@aws-sdk/client-s3` or similar for
 * production use.
 */
export class StorageManager {
  private readonly store = new Map<string, { data: Buffer; meta: StorageObject }>();

  /**
   * Upload data to the store.
   * @param key - Storage key (path).
   * @param data - Data to store.
   * @param metadata - Optional string metadata.
   */
  async upload(
    key: string,
    data: Buffer | string,
    metadata?: Record<string, string>,
  ): Promise<StorageObject> {
    const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
    const obj: StorageObject = {
      key,
      size: buffer.length,
      lastModified: new Date().toISOString(),
      metadata,
    };
    this.store.set(key, { data: buffer, meta: obj });
    return { ...obj };
  }

  /**
   * Download data by key.
   * @param key - Storage key.
   * @throws {@link StorageError} if the key does not exist.
   */
  async download(key: string): Promise<Buffer> {
    const entry = this.store.get(key);
    if (!entry) throw new StorageError('download', key, 'key not found');
    return Buffer.from(entry.data);
  }

  /**
   * Delete an object.
   * @param key - Storage key.
   * @returns `true` if deleted, `false` if the key didn't exist.
   */
  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  /**
   * List objects with an optional prefix filter.
   * @param prefix - Key prefix to filter by (default: list all).
   */
  async list(prefix = ''): Promise<StorageObject[]> {
    return [...this.store.values()]
      .filter((e) => e.meta.key.startsWith(prefix))
      .map((e) => ({ ...e.meta }));
  }
}

// ---------------------------------------------------------------------------
// RateLimiter
// ---------------------------------------------------------------------------

interface RateBucket {
  count: number;
  windowStart: number;
}

/**
 * Token-bucket-style rate limiter (per-minute windows).
 */
export class RateLimiter {
  private readonly buckets = new Map<string, RateBucket>();

  private getBucket(key: string): RateBucket {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket || now - bucket.windowStart >= 60_000) {
      bucket = { count: 0, windowStart: now };
      this.buckets.set(key, bucket);
    }
    return bucket;
  }

  /**
   * Check whether `key` is within its rate limit.
   * @param key - Rate-limit key (e.g. agentId, userId).
   * @param maxPerMinute - Maximum allowed calls per minute.
   * @returns `true` if the call is allowed, `false` if the limit is exceeded.
   */
  checkLimit(key: string, maxPerMinute: number): boolean {
    return this.getBucket(key).count < maxPerMinute;
  }

  /**
   * Record a usage unit for `key`.
   * @returns `true` if within the limit after consuming, `false` if exceeded.
   */
  consume(key: string, maxPerMinute?: number): boolean {
    const bucket = this.getBucket(key);
    bucket.count++;
    if (maxPerMinute !== undefined) {
      return bucket.count <= maxPerMinute;
    }
    return true;
  }

  /**
   * Reset the rate-limit counter for `key`.
   */
  reset(key: string): void {
    this.buckets.delete(key);
  }

  /** Return current usage for `key` (0 if no bucket exists). */
  getUsage(key: string): number {
    return this.buckets.get(key)?.count ?? 0;
  }
}

// ---------------------------------------------------------------------------
// validateEnv
// ---------------------------------------------------------------------------

/**
 * Validate that required environment variables are present.
 * Throws a descriptive error listing every missing variable.
 *
 * @param schema - Map of env-var name → description.
 * @throws {Error} if any required variables are absent.
 *
 * @example
 * ```ts
 * validateEnv({
 *   DATABASE_URL: 'PostgreSQL connection string',
 *   OPENAI_API_KEY: 'OpenAI API key',
 * });
 * ```
 */
export function validateEnv(schema: Record<string, string>): void {
  const missing: string[] = [];
  for (const [key, description] of Object.entries(schema)) {
    if (!process.env[key]) {
      missing.push(`  ${key}  –  ${description}`);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}`,
    );
  }
}

// ---------------------------------------------------------------------------
// SystemCalls facade
// ---------------------------------------------------------------------------

/**
 * Top-level facade that exposes all system services through a single object.
 *
 * @example
 * ```ts
 * const system = new SystemCalls();
 * system.logger.info('Server started');
 * system.secrets.validate(['DATABASE_URL']);
 * ```
 */
export class SystemCalls {
  readonly logger: Logger;
  readonly scheduler: Scheduler;
  readonly secrets: SecretsManager;
  readonly storage: StorageManager;
  readonly rateLimiter: RateLimiter;

  constructor(logContext = 'AiOS', minLogLevel: LogLevel = 'info') {
    this.logger = new Logger(logContext, minLogLevel);
    this.scheduler = new Scheduler();
    this.secrets = new SecretsManager();
    this.storage = new StorageManager();
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Gracefully shut down all system services (cancel scheduled tasks, etc.).
   */
  shutdown(): void {
    this.scheduler.clear();
  }
}
