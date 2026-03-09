'use client';

import { useState } from 'react';
import { useControlPanelStore } from '@/store';
import { mockAgents } from '@/lib/mock-data';
import { Shield, AlertTriangle, XCircle, CheckCircle, Filter } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { SecurityEvent } from '@/types';

type Severity = SecurityEvent['severity'] | 'all';
type ResolvedFilter = 'all' | 'unresolved' | 'resolved';

const severityColors: Record<SecurityEvent['severity'], string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#00f5ff',
};

const eventTypeLabels: Record<SecurityEvent['type'], string> = {
  permission_escalation: 'Permission Escalation',
  api_key_access: 'API Key Access',
  tool_abuse: 'Tool Abuse',
  agent_anomaly: 'Agent Anomaly',
  kill_switch: 'Kill Switch',
};

export default function SecurityPage() {
  const securityEvents = useControlPanelStore(state => state.securityEvents);
  const resolveSecurityEvent = useControlPanelStore(state => state.resolveSecurityEvent);
  const activateKillSwitch = useControlPanelStore(state => state.activateKillSwitch);
  const killSwitchActive = useControlPanelStore(state => state.killSwitchActive);
  const [severityFilter, setSeverityFilter] = useState<Severity>('all');
  const [resolvedFilter, setResolvedFilter] = useState<ResolvedFilter>('all');
  const [killConfirm, setKillConfirm] = useState(false);

  const filtered = securityEvents.filter(e => {
    const matchesSeverity = severityFilter === 'all' || e.severity === severityFilter;
    const matchesResolved =
      resolvedFilter === 'all' ||
      (resolvedFilter === 'resolved' && e.resolved) ||
      (resolvedFilter === 'unresolved' && !e.resolved);
    return matchesSeverity && matchesResolved;
  });

  const criticalUnresolved = securityEvents.filter(e => e.severity === 'critical' && !e.resolved);
  const totalUnresolved = securityEvents.filter(e => !e.resolved).length;

  const handleKillSwitch = () => {
    if (!killConfirm) {
      setKillConfirm(true);
      setTimeout(() => setKillConfirm(false), 5000);
    } else {
      activateKillSwitch();
      setKillConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#00f5ff] tracking-widest">SECURITY COMMAND CENTER</h1>
          <p className="text-[rgba(255,255,255,0.4)] text-sm mt-1">Monitor and respond to security events</p>
        </div>
        <button
          onClick={handleKillSwitch}
          disabled={killSwitchActive}
          className="px-5 py-2.5 rounded-xl font-bold text-sm tracking-widest transition-all"
          style={{
            background: killSwitchActive ? 'rgba(239,68,68,0.2)' : killConfirm ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
            border: `2px solid ${killSwitchActive ? '#ef4444' : killConfirm ? 'rgba(239,68,68,0.7)' : 'rgba(239,68,68,0.4)'}`,
            color: '#ef4444',
            opacity: killSwitchActive ? 0.7 : 1,
          }}
        >
          {killSwitchActive ? '⚡ KILL SWITCH ACTIVE' : killConfirm ? '⚠ CONFIRM KILL SWITCH?' : '🛑 EMERGENCY KILL SWITCH'}
        </button>
      </div>

      {/* Critical Alert Banner */}
      {criticalUnresolved.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.4)] rounded-xl animate-pulse">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-red-400 font-bold">{criticalUnresolved.length} CRITICAL UNRESOLVED EVENT{criticalUnresolved.length > 1 ? 'S' : ''}</div>
            <div className="text-[rgba(255,255,255,0.5)] text-xs mt-1 space-y-0.5">
              {criticalUnresolved.map(e => (
                <div key={e.event_id}>• {e.description}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: securityEvents.length, color: '#00f5ff' },
          { label: 'Critical', value: securityEvents.filter(e => e.severity === 'critical').length, color: '#ef4444' },
          { label: 'High', value: securityEvents.filter(e => e.severity === 'high').length, color: '#f97316' },
          { label: 'Unresolved', value: totalUnresolved, color: '#eab308' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[rgba(255,255,255,0.4)] text-xs">{label.toUpperCase()}</span>
              <Shield size={14} style={{ color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2 text-xs text-[rgba(255,255,255,0.4)]">
          <Filter size={12} />
          <span>SEVERITY:</span>
        </div>
        <div className="flex gap-2">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map(s => {
            const color = s === 'all' ? '#00f5ff' : severityColors[s];
            return (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: severityFilter === s ? color + '22' : 'rgba(255,255,255,0.05)',
                  color: severityFilter === s ? color : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${severityFilter === s ? color + '44' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {s.toUpperCase()}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 ml-4">
          {(['all', 'unresolved', 'resolved'] as const).map(r => (
            <button
              key={r}
              onClick={() => setResolvedFilter(r)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                background: resolvedFilter === r ? 'rgba(0,245,255,0.15)' : 'rgba(255,255,255,0.05)',
                color: resolvedFilter === r ? '#00f5ff' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${resolvedFilter === r ? 'rgba(0,245,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filtered.map(event => {
          const color = severityColors[event.severity];
          const agent = mockAgents.find(a => a.agent_id === event.agent_id);
          return (
            <div
              key={event.event_id}
              className="p-4 rounded-xl transition-all"
              style={{
                background: event.resolved ? 'rgba(255,255,255,0.02)' : `rgba(${event.severity === 'critical' ? '239,68,68' : event.severity === 'high' ? '249,115,22' : '255,255,255'},0.04)`,
                border: `1px solid ${event.resolved ? 'rgba(255,255,255,0.06)' : color + '33'}`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '22', border: `1px solid ${color}44` }}>
                    <Shield size={14} style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ color, background: color + '22', border: `1px solid ${color}44` }}>
                        {event.severity}
                      </span>
                      <span className="text-white text-sm font-medium">{eventTypeLabels[event.type]}</span>
                      {event.resolved && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] text-[#00ff88] bg-[rgba(0,255,136,0.15)] border border-[rgba(0,255,136,0.3)]">
                          RESOLVED
                        </span>
                      )}
                    </div>
                    <p className="text-[rgba(255,255,255,0.6)] text-xs">{event.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[rgba(255,255,255,0.3)]">
                      {agent && <span>Agent: <span className="text-[rgba(255,255,255,0.5)]">{agent.name}</span></span>}
                      <span>•</span>
                      <span>{timeAgo(event.timestamp)}</span>
                      <span>•</span>
                      <span className="font-mono">{event.event_id}</span>
                    </div>
                  </div>
                </div>
                {!event.resolved && (
                  <button
                    onClick={() => resolveSecurityEvent(event.event_id)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all text-[#00ff88] bg-[rgba(0,255,136,0.1)] border border-[rgba(0,255,136,0.3)] hover:bg-[rgba(0,255,136,0.2)]"
                  >
                    <CheckCircle size={12} /> Resolve
                  </button>
                )}
                {event.resolved && (
                  <XCircle size={16} className="text-[rgba(255,255,255,0.2)] flex-shrink-0" />
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[rgba(255,255,255,0.3)]">
            <Shield size={32} className="mx-auto mb-3 opacity-30" />
            <p>No security events match the current filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
