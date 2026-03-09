import { create } from 'zustand';
import { Agent, Swarm, Task, SecurityEvent, SystemMetrics, AutonomyMode, WebSocketEvent } from '@/types';
import { mockAgents, mockSwarms, mockTasks, mockSecurityEvents, mockSystemMetrics } from '@/lib/mock-data';

interface ControlPanelStore {
  agents: Agent[];
  swarms: Swarm[];
  tasks: Task[];
  securityEvents: SecurityEvent[];
  metrics: SystemMetrics;
  autonomyMode: AutonomyMode;
  killSwitchActive: boolean;
  // Shared event bus — one stream, many consumers
  connected: boolean;
  events: WebSocketEvent[];
  setConnected: (connected: boolean) => void;
  addEvent: (event: WebSocketEvent) => void;
  setAutonomyMode: (mode: AutonomyMode) => void;
  activateKillSwitch: () => void;
  deactivateKillSwitch: () => void;
  resolveSecurityEvent: (eventId: string) => void;
  updateMetrics: (metrics: Partial<SystemMetrics>) => void;
}

export const useControlPanelStore = create<ControlPanelStore>((set) => ({
  agents: mockAgents,
  swarms: mockSwarms,
  tasks: mockTasks,
  securityEvents: mockSecurityEvents,
  metrics: mockSystemMetrics,
  autonomyMode: 'assisted',
  killSwitchActive: false,
  connected: false,
  events: [],
  setConnected: (connected) => set({ connected }),
  addEvent: (event) => set(state => ({ events: [event, ...state.events].slice(0, 100) })),
  setAutonomyMode: (mode) => set({ autonomyMode: mode }),
  activateKillSwitch: () => set({ killSwitchActive: true, autonomyMode: 'manual' }),
  deactivateKillSwitch: () => set({ killSwitchActive: false }),
  resolveSecurityEvent: (eventId) => set(state => ({
    securityEvents: state.securityEvents.map(e => e.event_id === eventId ? { ...e, resolved: true } : e),
  })),
  updateMetrics: (metrics) => set(state => ({ metrics: { ...state.metrics, ...metrics } })),
}));
