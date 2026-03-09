'use client';

import { useState } from 'react';
import { mockAgents } from '@/lib/mock-data';
import { Bot, Plus, Pause, Play, XCircle, Cpu, Brain } from 'lucide-react';
import { formatNumber, timeAgo } from '@/lib/utils';
import { AgentStatus } from '@/types';

const statusColors: Record<AgentStatus, string> = {
  active: '#00ff88',
  idle: '#00f5ff',
  paused: '#f0abfc',
  error: '#ef4444',
  terminated: '#6b7280',
};

export default function AgentsPage() {
  const [filter, setFilter] = useState<AgentStatus | 'all'>('all');

  const filtered = filter === 'all' ? mockAgents : mockAgents.filter(a => a.status === filter);
  const counts = {
    all: mockAgents.length,
    active: mockAgents.filter(a => a.status === 'active').length,
    idle: mockAgents.filter(a => a.status === 'idle').length,
    paused: mockAgents.filter(a => a.status === 'paused').length,
    error: mockAgents.filter(a => a.status === 'error').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#00f5ff] tracking-widest">AGENT COMMAND CENTER</h1>
          <p className="text-[rgba(255,255,255,0.4)] text-sm mt-1">Monitor and control individual AI agents</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[rgba(0,245,255,0.1)] border border-[rgba(0,245,255,0.3)] text-[#00f5ff] text-sm rounded-lg hover:bg-[rgba(0,245,255,0.15)] transition-all">
          <Plus size={16} />
          Spawn Agent
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'idle', 'paused', 'error'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filter === status ? (status === 'all' ? 'rgba(0,245,255,0.15)' : statusColors[status] + '22') : 'rgba(255,255,255,0.05)',
              color: filter === status ? (status === 'all' ? '#00f5ff' : statusColors[status]) : 'rgba(255,255,255,0.5)',
              border: `1px solid ${filter === status ? (status === 'all' ? 'rgba(0,245,255,0.3)' : statusColors[status] + '44') : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {status.toUpperCase()} ({counts[status]})
          </button>
        ))}
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(agent => {
          const color = statusColors[agent.status];
          return (
            <div key={agent.agent_id} className="bg-[rgba(255,255,255,0.03)] rounded-xl p-5 transition-all" style={{ border: `1px solid ${color}33` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: color + '22', border: `1px solid ${color}44` }}>
                    <Bot size={18} style={{ color }} />
                  </div>
                  <div>
                    <div className="font-bold text-white">{agent.name}</div>
                    <div className="text-[rgba(255,255,255,0.4)] text-xs">{agent.role} • {agent.model}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ color, background: color + '22', border: `1px solid ${color}44` }}>
                  {agent.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[rgba(255,255,255,0.4)] flex items-center gap-1"><Brain size={10} /> Memory</span>
                    <span style={{ color }}>{agent.memory_usage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${agent.memory_usage}%`, background: color }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[rgba(255,255,255,0.4)] flex items-center gap-1"><Cpu size={10} /> Tokens Used</span>
                    <span className="text-[rgba(255,255,255,0.6)]">{formatNumber(agent.token_usage)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#7c3aed] transition-all" style={{ width: `${Math.min((agent.token_usage / 200000) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-[rgba(255,255,255,0.3)]">
                  Queue: <span className="text-white">{agent.task_queue.length} tasks</span> • {timeAgo(agent.last_active)}
                </div>
                <div className="flex gap-2">
                  <button className="p-1.5 rounded hover:bg-[rgba(255,255,255,0.08)] transition-all" title={agent.status === 'active' ? 'Pause' : 'Resume'}>
                    {agent.status === 'active' ? <Pause size={14} className="text-[rgba(255,255,255,0.5)]" /> : <Play size={14} className="text-[rgba(255,255,255,0.5)]" />}
                  </button>
                  <button className="p-1.5 rounded hover:bg-[rgba(239,68,68,0.1)] transition-all" title="Terminate">
                    <XCircle size={14} className="text-[rgba(239,68,68,0.5)]" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
