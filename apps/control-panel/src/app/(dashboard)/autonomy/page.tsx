'use client';

import { useState } from 'react';
import { mockAgents } from '@/lib/mock-data';
import { useControlPanelStore } from '@/store';
import { Zap, AlertTriangle, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import { AutonomyMode } from '@/types';

const modeDescriptions: Record<AutonomyMode, string> = {
  manual: 'All agent actions require human approval before execution',
  assisted: 'Agents act autonomously but flag high-risk actions for approval',
  autonomous: 'Agents operate fully independently within defined constraints',
  research: 'Agents can explore freely; all external actions require approval',
};

const modeColors: Record<AutonomyMode, string> = {
  manual: '#00f5ff',
  assisted: '#00ff88',
  autonomous: '#f0abfc',
  research: '#7c3aed',
};

export default function AutonomyPage() {
  const { autonomyMode, setAutonomyMode, killSwitchActive, activateKillSwitch, deactivateKillSwitch } = useControlPanelStore();
  const [killConfirm, setKillConfirm] = useState(false);
  const [toggles, setToggles] = useState({
    require_tool_approval: true,
    require_financial_approval: true,
    require_system_approval: true,
    auto_pause_on_security: true,
  });

  const handleKillSwitch = () => {
    if (!killConfirm) {
      setKillConfirm(true);
      setTimeout(() => setKillConfirm(false), 5000);
    } else {
      if (killSwitchActive) {
        deactivateKillSwitch();
      } else {
        activateKillSwitch();
      }
      setKillConfirm(false);
    }
  };

  const toggleSetting = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#00f5ff] tracking-widest">AUTONOMY CONTROL</h1>
          <p className="text-[rgba(255,255,255,0.4)] text-sm mt-1">Configure agent autonomy levels and human oversight</p>
        </div>
        {/* Kill Switch */}
        <button
          onClick={handleKillSwitch}
          className="px-6 py-3 rounded-xl font-bold text-sm tracking-widest transition-all"
          style={{
            background: killSwitchActive
              ? 'rgba(239,68,68,0.3)'
              : killConfirm
              ? 'rgba(239,68,68,0.2)'
              : 'rgba(239,68,68,0.1)',
            border: `2px solid ${killSwitchActive ? '#ef4444' : killConfirm ? 'rgba(239,68,68,0.7)' : 'rgba(239,68,68,0.4)'}`,
            color: '#ef4444',
            boxShadow: killSwitchActive ? '0 0 20px rgba(239,68,68,0.4)' : 'none',
          }}
        >
          {killSwitchActive ? '⚡ KILL SWITCH ACTIVE — CLICK TO RESUME' : killConfirm ? '⚠ CONFIRM: ACTIVATE KILL SWITCH?' : '🛑 EMERGENCY KILL SWITCH'}
        </button>
      </div>

      {killSwitchActive && (
        <div className="flex items-center gap-3 p-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-xl animate-pulse">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <div>
            <div className="text-red-400 font-bold">KILL SWITCH ACTIVE — ALL AGENTS SUSPENDED</div>
            <div className="text-[rgba(255,255,255,0.5)] text-xs mt-0.5">All autonomous operations have been halted. Manual mode enforced.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Mode Selector */}
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-6">
          <h2 className="text-[rgba(255,255,255,0.6)] text-xs tracking-wider mb-4 flex items-center gap-2">
            <Zap size={14} className="text-[#00f5ff]" /> AUTONOMY MODE
          </h2>
          <div className="space-y-3">
            {(['manual', 'assisted', 'autonomous', 'research'] as AutonomyMode[]).map(mode => {
              const color = modeColors[mode];
              const isActive = autonomyMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => !killSwitchActive && setAutonomyMode(mode)}
                  disabled={killSwitchActive}
                  className="w-full p-4 rounded-xl text-left transition-all"
                  style={{
                    background: isActive ? color + '15' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isActive ? color + '44' : 'rgba(255,255,255,0.06)'}`,
                    opacity: killSwitchActive ? 0.5 : 1,
                    cursor: killSwitchActive ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm" style={{ color: isActive ? color : 'rgba(255,255,255,0.7)' }}>
                      {mode.toUpperCase()}
                    </span>
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: isActive ? color : 'rgba(255,255,255,0.2)' }}>
                      {isActive && <div className="w-2 h-2 rounded-full" style={{ background: color }} />}
                    </div>
                  </div>
                  <p className="text-[rgba(255,255,255,0.4)] text-xs">{modeDescriptions[mode]}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* HITL Settings */}
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-6">
          <h2 className="text-[rgba(255,255,255,0.6)] text-xs tracking-wider mb-4 flex items-center gap-2">
            <Shield size={14} className="text-[#00f5ff]" /> HUMAN-IN-THE-LOOP SETTINGS
          </h2>
          <div className="space-y-4">
            {[
              { key: 'require_tool_approval' as const, label: 'Require approval for tool execution', desc: 'All tool calls must be approved before running' },
              { key: 'require_financial_approval' as const, label: 'Require approval for financial transactions', desc: 'Blockchain and payment operations need sign-off' },
              { key: 'require_system_approval' as const, label: 'Require approval for system commands', desc: 'Shell, terminal, and OS-level commands' },
              { key: 'auto_pause_on_security' as const, label: 'Auto-pause on security event', desc: 'Halt agent when a security alert fires' },
            ].map(({ key, label, desc }) => {
              const isOn = toggles[key];
              return (
                <div key={key} className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-all">
                  <div>
                    <div className="text-sm text-[rgba(255,255,255,0.8)]">{label}</div>
                    <div className="text-xs text-[rgba(255,255,255,0.4)] mt-0.5">{desc}</div>
                  </div>
                  <button
                    onClick={() => toggleSetting(key)}
                    className="flex-shrink-0 mt-0.5"
                  >
                    {isOn
                      ? <ToggleRight size={28} className="text-[#00f5ff]" />
                      : <ToggleLeft size={28} className="text-[rgba(255,255,255,0.2)]" />
                    }
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Per-Agent Overrides */}
      <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
        <h2 className="text-[rgba(255,255,255,0.6)] text-xs tracking-wider mb-4">PER-AGENT AUTONOMY OVERRIDES</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[rgba(255,255,255,0.3)] border-b border-[rgba(255,255,255,0.05)]">
              <th className="text-left pb-2">AGENT</th>
              <th className="text-left pb-2">ROLE</th>
              <th className="text-left pb-2">CURRENT STATUS</th>
              <th className="text-left pb-2">AUTONOMY OVERRIDE</th>
              <th className="text-left pb-2">TRUST LEVEL</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const trustColors: Record<string, string> = { active: '#00ff88', error: '#ef4444', paused: '#f0abfc', idle: '#00f5ff', terminated: '#6b7280' };
              const trustLabels: Record<string, string> = { active: 'HIGH', error: 'SUSPENDED', paused: 'MEDIUM', idle: 'STANDARD', terminated: 'NONE' };
              return mockAgents.map(agent => (
                <tr key={agent.agent_id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="py-2 font-medium text-white">{agent.name}</td>
                  <td className="py-2 text-[rgba(255,255,255,0.5)]">{agent.role}</td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ color: trustColors[agent.status], background: trustColors[agent.status] + '22' }}>
                      {agent.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2">
                    <span className="text-[rgba(255,255,255,0.4)]">Inherits global: </span>
                    <span style={{ color: modeColors[autonomyMode] }}>{autonomyMode.toUpperCase()}</span>
                  </td>
                  <td className="py-2">
                    <span style={{ color: trustColors[agent.status] }}>{trustLabels[agent.status]}</span>
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
