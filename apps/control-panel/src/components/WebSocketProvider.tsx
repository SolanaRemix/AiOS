'use client';

import { useEffect } from 'react';
import { useControlPanelStore } from '@/store';
import { mockAgents, mockTasks, mockSystemMetrics } from '@/lib/mock-data';
import { WebSocketEvent, WebSocketEventType, SystemMetrics } from '@/types';

type EventFactory = (ts: string) => WebSocketEvent;

const eventFactories: Record<Exclude<WebSocketEventType, 'metrics_update'>, EventFactory> = {
  agent_spawned: (ts) => ({
    type: 'agent_spawned',
    payload: { agent_id: `agent-${Date.now()}`, role: 'Assistant' },
    timestamp: ts,
  }),
  agent_terminated: (ts) => ({
    type: 'agent_terminated',
    payload: { agent_id: mockAgents[Math.floor(Math.random() * mockAgents.length)].agent_id },
    timestamp: ts,
  }),
  task_started: (ts) => ({
    type: 'task_started',
    payload: {
      task_id: `task-${Date.now()}`,
      name: 'Automated task',
      agent_id: mockAgents[Math.floor(Math.random() * mockAgents.length)].agent_id,
    },
    timestamp: ts,
  }),
  task_completed: (ts) => ({
    type: 'task_completed',
    payload: { task_id: mockTasks[Math.floor(Math.random() * mockTasks.length)].task_id },
    timestamp: ts,
  }),
  task_failed: (ts) => ({
    type: 'task_failed',
    payload: {
      task_id: mockTasks[Math.floor(Math.random() * mockTasks.length)].task_id,
      error: 'Execution timeout',
    },
    timestamp: ts,
  }),
  memory_updated: (ts) => ({
    type: 'memory_updated',
    payload: { id: `mem-${Date.now()}`, type: 'short_term' },
    timestamp: ts,
  }),
  system_alert: (ts) => ({
    type: 'system_alert',
    payload: { message: 'High CPU usage detected', level: 'warning' },
    timestamp: ts,
  }),
  security_event: (ts) => ({
    type: 'security_event',
    payload: { severity: 'high', description: 'Unauthorized API access attempt' },
    timestamp: ts,
  }),
};

// Weighted pool: frequent events appear more often; rare alerts appear occasionally
const eventPool: WebSocketEventType[] = [
  'task_started', 'task_started', 'task_started',
  'task_completed', 'task_completed', 'task_completed',
  'metrics_update', 'metrics_update', 'metrics_update',
  'agent_spawned', 'agent_spawned',
  'agent_terminated',
  'memory_updated', 'memory_updated',
  'task_failed',
  'system_alert',
  'security_event',
];

/**
 * WebSocketProvider — renders nothing, runs one mock event interval for the
 * entire app. All hooks and pages consume from the shared Zustand store.
 */
export function WebSocketProvider() {
  const setConnected = useControlPanelStore(state => state.setConnected);
  const addEvent = useControlPanelStore(state => state.addEvent);
  const updateMetrics = useControlPanelStore(state => state.updateMetrics);

  useEffect(() => {
    const connectTimeout = setTimeout(() => setConnected(true), 500);

    const interval = setInterval(() => {
      const eventType = eventPool[Math.floor(Math.random() * eventPool.length)];
      const ts = new Date().toISOString();

      let event: WebSocketEvent;

      if (eventType === 'metrics_update') {
        const metricsPayload: Partial<SystemMetrics> = {
          cpu_usage: Math.round(40 + Math.random() * 40),
          memory_usage: Math.round(30 + Math.random() * 40),
          gpu_usage: Math.round(50 + Math.random() * 35),
          token_usage_per_min: Math.max(0, mockSystemMetrics.token_usage_per_min + Math.round((Math.random() - 0.5) * 500)),
          timestamp: ts,
        };
        updateMetrics(metricsPayload);
        event = { type: 'metrics_update', payload: metricsPayload, timestamp: ts };
      } else {
        event = eventFactories[eventType](ts);
      }

      addEvent(event);
    }, 3000);

    return () => {
      clearTimeout(connectTimeout);
      clearInterval(interval);
      setConnected(false);
    };
  }, [setConnected, addEvent, updateMetrics]);

  return null;
}
