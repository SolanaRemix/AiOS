import { create } from 'zustand';
import { Agent, Swarm, Task, SecurityEvent, SystemMetrics, AutonomyMode } from '@/types';
import { mockAgents, mockSwarms, mockTasks, mockSecurityEvents, mockSystemMetrics } from '@/lib/mock-data';

interface ControlPanelStore {
  agents: Agent[];
  swarms: Swarm[];
  tasks: Task[];
  securityEvents: SecurityEvent[];
  metrics: SystemMetrics;
  autonomyMode: AutonomyMode;
  killSwitchActive: boolean;
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
  setAutonomyMode: (mode) => set({ autonomyMode: mode }),
  activateKillSwitch: () => set({ killSwitchActive: true, autonomyMode: 'manual' }),
  deactivateKillSwitch: () => set({ killSwitchActive: false }),
  resolveSecurityEvent: (eventId) => set(state => ({
    securityEvents: state.securityEvents.map(e => e.event_id === eventId ? { ...e, resolved: true } : e),
  })),
  updateMetrics: (metrics) => set(state => ({ metrics: { ...state.metrics, ...metrics } })),
}));
