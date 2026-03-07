'use client';

import { useState, useEffect, useRef } from 'react';
import { WebSocketEvent, WebSocketEventType } from '@/types';
import { mockAgents, mockTasks, mockSystemMetrics } from '@/lib/mock-data';

export function useMockWebSocket() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const connectTimeout = setTimeout(() => setConnected(true), 500);

    type SupportedEvent = 'task_started' | 'task_completed' | 'metrics_update' | 'agent_spawned' | 'memory_updated';
    const eventTypes: SupportedEvent[] = [
      'task_started', 'task_completed', 'metrics_update', 'agent_spawned', 'memory_updated',
    ];

    const eventMessages: Record<SupportedEvent, () => WebSocketEvent> = {
      task_started: () => ({ type: 'task_started' as const, payload: { task_id: `task-${Date.now()}`, name: 'New automated task', agent_id: mockAgents[Math.floor(Math.random() * mockAgents.length)].agent_id }, timestamp: new Date().toISOString() }),
      task_completed: () => ({ type: 'task_completed' as const, payload: { task_id: mockTasks[Math.floor(Math.random() * mockTasks.length)].task_id }, timestamp: new Date().toISOString() }),
      metrics_update: () => ({ type: 'metrics_update' as const, payload: { ...mockSystemMetrics, cpu_usage: Math.round(50 + Math.random() * 30), timestamp: new Date().toISOString() }, timestamp: new Date().toISOString() }),
      agent_spawned: () => ({ type: 'agent_spawned' as const, payload: { agent_id: `agent-${Date.now()}`, role: 'Assistant' }, timestamp: new Date().toISOString() }),
      memory_updated: () => ({ type: 'memory_updated' as const, payload: { id: `mem-${Date.now()}`, type: 'short_term' }, timestamp: new Date().toISOString() }),
    };

    intervalRef.current = setInterval(() => {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const event = eventMessages[eventType]();
      setEvents(prev => [event, ...prev].slice(0, 100));
    }, 3000);

    return () => {
      clearTimeout(connectTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setConnected(false);
    };
  }, []);

  return { connected, events };
}

export function useSwarmEvents() {
  const { connected, events } = useMockWebSocket();
  return { connected, swarmEvents: events.filter(e => ['agent_spawned', 'agent_terminated'].includes(e.type)) };
}

export function useAgentStatus() {
  const { connected, events } = useMockWebSocket();
  return { connected, agentEvents: events.filter(e => e.type === 'agent_spawned' || e.type === 'agent_terminated') };
}

export function useTaskUpdates() {
  const { connected, events } = useMockWebSocket();
  return { connected, taskEvents: events.filter(e => ['task_started', 'task_completed', 'task_failed'].includes(e.type)) };
}

export function useSystemMetrics() {
  const { connected, events } = useMockWebSocket();
  const metricsEvents = events.filter(e => e.type === 'metrics_update');
  return { connected, latestMetrics: metricsEvents[0]?.payload ?? null };
}
