'use client';

import { useControlPanelStore } from '@/store';

/**
 * All hooks below read from the shared Zustand store, which is populated by
 * the single WebSocketProvider timer. This ensures one event stream is shared
 * across all consumers — no duplicated intervals.
 */

export function useMockWebSocket() {
  const connected = useControlPanelStore(state => state.connected);
  const events = useControlPanelStore(state => state.events);
  return { connected, events };
}

export function useSwarmEvents() {
  const { connected, events } = useMockWebSocket();
  return {
    connected,
    swarmEvents: events.filter(e => ['agent_spawned', 'agent_terminated'].includes(e.type)),
  };
}

export function useAgentStatus() {
  const { connected, events } = useMockWebSocket();
  return {
    connected,
    agentEvents: events.filter(e => e.type === 'agent_spawned' || e.type === 'agent_terminated'),
  };
}

export function useTaskUpdates() {
  const { connected, events } = useMockWebSocket();
  return {
    connected,
    taskEvents: events.filter(e => ['task_started', 'task_completed', 'task_failed'].includes(e.type)),
  };
}

export function useSystemMetrics() {
  const connected = useControlPanelStore(state => state.connected);
  const metrics = useControlPanelStore(state => state.metrics);
  return { connected, latestMetrics: metrics };
}
