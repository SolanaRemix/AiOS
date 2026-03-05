/**
 * Event bus types.
 */

/** An event emitted on the AiOS event bus. */
export interface AiOSEvent<T = unknown> {
  /** Unique event identifier (UUID). */
  id: string;
  /** Event type string (use {@link EventTypes} constants). */
  type: string;
  /** Correlation ID linking related events across a request/session. */
  correlationId: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Event-specific payload. */
  payload: T;
  /** Source component that emitted the event. */
  source: string;
}

/** A handler function for a specific event type. */
export type EventHandler<T = unknown> = (event: AiOSEvent<T>) => unknown;

/** A handle to an active event subscription, with an `unsubscribe()` method. */
export interface EventSubscription {
  /** The event type this subscription listens to. */
  type: string;
  /** Remove this subscription from the bus. */
  unsubscribe(): void;
}
