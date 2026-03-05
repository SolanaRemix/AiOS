/**
 * AiOS Event Bus.
 *
 * A lightweight, in-process pub/sub event bus with correlation ID support.
 * No external dependencies.
 */

import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';
import { AiOSEvent, EventHandler, EventSubscription } from './types';

export { AiOSEvent, EventHandler, EventSubscription } from './types';

// ---------------------------------------------------------------------------
// EventTypes
// ---------------------------------------------------------------------------

/** Well-known event type constants used across the platform. */
export const EventTypes = {
  AGENT_STARTED: 'agent:started',
  AGENT_STOPPED: 'agent:stopped',
  AGENT_ERROR: 'agent:error',
  TOOL_EXECUTED: 'tool:executed',
  MEMORY_UPDATED: 'memory:updated',
  SYSCALL_DISPATCHED: 'syscall:dispatched',
  USER_ACTION: 'user:action',
  SYSTEM_EVENT: 'system:event',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

// ---------------------------------------------------------------------------
// Correlation ID utilities
// ---------------------------------------------------------------------------

/** Generate a new random correlation ID (UUID v4). */
export function generateCorrelationId(): string {
  return randomUUID();
}

/**
 * Async-safe correlation ID storage.
 * Uses `AsyncLocalStorage` so concurrent async operations each maintain their
 * own correlation context without interfering with each other.
 */
const _correlationStorage = new AsyncLocalStorage<string>();

/**
 * Execute `fn` with `id` set as the active correlation ID.
 * Any events emitted inside `fn` (even across `await` boundaries) will
 * inherit this ID automatically.  Concurrent calls are fully isolated.
 */
export async function withCorrelationId<T>(id: string, fn: () => Promise<T>): Promise<T> {
  return _correlationStorage.run(id, fn);
}

/** Return the currently active correlation ID (or a fresh UUID). */
export function currentCorrelationId(): string {
  return _correlationStorage.getStore() ?? generateCorrelationId();
}

// ---------------------------------------------------------------------------
// EventBus
// ---------------------------------------------------------------------------

/**
 * In-process publish/subscribe event bus.
 *
 * @example
 * ```ts
 * const bus = new EventBus();
 * const sub = bus.on('agent:started', (e) => console.log(e));
 * bus.emit({ type: 'agent:started', payload: { agentId: 'a1' }, source: 'kernel' });
 * sub.unsubscribe();
 * ```
 */
export class EventBus {
  private readonly handlers = new Map<string, Set<EventHandler<unknown>>>();
  private readonly onceHandlers = new Map<string, Set<EventHandler<unknown>>>();

  /**
   * Emit an event to all registered handlers.
   *
   * Missing `id`, `correlationId`, and `timestamp` are filled automatically.
   * @param event - Partial event; required fields: `type`, `source`, `payload`.
   */
  emit<T = unknown>(
    event: Omit<AiOSEvent<T>, 'id' | 'correlationId' | 'timestamp'> & {
      id?: string;
      correlationId?: string;
      timestamp?: string;
    },
  ): void {
    const full: AiOSEvent<T> = {
      id: event.id ?? randomUUID(),
      type: event.type,
      correlationId: event.correlationId ?? currentCorrelationId(),
      timestamp: event.timestamp ?? new Date().toISOString(),
      payload: event.payload,
      source: event.source,
    };

    const typeHandlers = this.handlers.get(full.type);
    if (typeHandlers) {
      for (const handler of typeHandlers) {
        try {
          const result = handler(full as AiOSEvent<unknown>);
          if (result instanceof Promise) {
            result.catch(() => {});
          }
        } catch {
          // Suppress synchronous errors to keep the bus stable.
        }
      }
    }

    const typeOnce = this.onceHandlers.get(full.type);
    if (typeOnce) {
      const toCall = [...typeOnce];
      typeOnce.clear();
      for (const handler of toCall) {
        try {
          const result = handler(full as AiOSEvent<unknown>);
          if (result instanceof Promise) {
            result.catch(() => {});
          }
        } catch {
          // Suppress synchronous errors.
        }
      }
    }
  }

  /**
   * Subscribe to all events of a given type.
   * @param type - Event type string.
   * @param handler - Callback invoked for each matching event.
   * @returns An {@link EventSubscription} with an `unsubscribe()` method.
   */
  on<T = unknown>(type: string, handler: EventHandler<T>): EventSubscription {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as EventHandler<unknown>);

    return {
      type,
      unsubscribe: () => this.off(type, handler),
    };
  }

  /**
   * Unsubscribe a handler from an event type.
   * @param type - Event type string.
   * @param handler - The handler to remove.
   */
  off<T = unknown>(type: string, handler: EventHandler<T>): void {
    this.handlers.get(type)?.delete(handler as EventHandler<unknown>);
    this.onceHandlers.get(type)?.delete(handler as EventHandler<unknown>);
  }

  /**
   * Subscribe to the **next** event of a given type, then auto-unsubscribe.
   * @param type - Event type string.
   * @param handler - Callback invoked exactly once.
   * @returns An {@link EventSubscription} (can be cancelled before it fires).
   */
  once<T = unknown>(type: string, handler: EventHandler<T>): EventSubscription {
    if (!this.onceHandlers.has(type)) {
      this.onceHandlers.set(type, new Set());
    }
    this.onceHandlers.get(type)!.add(handler as EventHandler<unknown>);

    return {
      type,
      unsubscribe: () => this.off(type, handler),
    };
  }

  /**
   * Return the number of active subscriptions for a given type.
   * Useful for testing and debugging.
   */
  listenerCount(type: string): number {
    return (this.handlers.get(type)?.size ?? 0) +
      (this.onceHandlers.get(type)?.size ?? 0);
  }

  /** Remove all handlers (both persistent and once). */
  removeAllListeners(type?: string): void {
    if (type) {
      this.handlers.delete(type);
      this.onceHandlers.delete(type);
    } else {
      this.handlers.clear();
      this.onceHandlers.clear();
    }
  }
}
