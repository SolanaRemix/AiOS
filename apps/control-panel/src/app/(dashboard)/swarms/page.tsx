'use client';

import { mockSwarms, mockAgents } from '@/lib/mock-data';
import { Network, Plus, Bot, ListTodo, Activity } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

const swarmTypeColors: Record<string, string> = {
  research: '#00f5ff',
  development: '#7c3aed',
  trading: '#00ff88',
  security: '#ef4444',
};

const swarmStatusColors: Record<string, string> = {
  active: '#00ff88',
  idle: '#00f5ff',
  terminated: '#6b7280',
};

export default function SwarmsPage() {
  const totalAgents = mockAgents.length;
  const activeSwarms = mockSwarms.filter(s => s.status === 'active').length;
  const totalTasks = mockSwarms.reduce((sum, s) => sum + s.task_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#00f5ff] tracking-widest">SWARM MAP</h1>
          <p className="text-[rgba(255,255,255,0.4)] text-sm mt-1">Manage and monitor agent swarm clusters</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[rgba(0,245,255,0.1)] border border-[rgba(0,245,255,0.3)] text-[#00f5ff] text-sm rounded-lg hover:bg-[rgba(0,245,255,0.15)] transition-all">
          <Plus size={16} />
          Deploy Swarm
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Swarms', value: mockSwarms.length, color: '#00f5ff', icon: Network },
          { label: 'Active Swarms', value: activeSwarms, color: '#00ff88', icon: Activity },
          { label: 'Total Agents', value: totalAgents, color: '#7c3aed', icon: Bot },
          { label: 'Running Tasks', value: totalTasks, color: '#f0abfc', icon: ListTodo },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[rgba(255,255,255,0.4)] text-xs">{label.toUpperCase()}</span>
              <Icon size={14} style={{ color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Swarm Cards */}
      <div className="grid grid-cols-2 gap-4">
        {mockSwarms.map(swarm => {
          const swarmAgents = mockAgents.filter(a => swarm.agent_ids.includes(a.agent_id));
          const typeColor = swarmTypeColors[swarm.type] || '#00f5ff';
          const statusColor = swarmStatusColors[swarm.status] || '#6b7280';

          return (
            <div key={swarm.swarm_id} className="bg-[rgba(255,255,255,0.03)] rounded-xl p-5 hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer" style={{ border: `1px solid ${typeColor}33` }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white">{swarm.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ color: typeColor, background: typeColor + '22' }}>{swarm.type.toUpperCase()}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ color: statusColor, background: statusColor + '22' }}>{swarm.status.toUpperCase()}</span>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${swarm.status === 'active' ? 'animate-pulse' : ''}`} style={{ background: statusColor }} />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div className="bg-[rgba(0,0,0,0.3)] rounded p-2">
                  <div className="text-[rgba(255,255,255,0.4)]">AGENTS</div>
                  <div className="text-white font-bold text-lg">{swarm.agent_ids.length}</div>
                </div>
                <div className="bg-[rgba(0,0,0,0.3)] rounded p-2">
                  <div className="text-[rgba(255,255,255,0.4)]">TASKS</div>
                  <div className="text-white font-bold text-lg">{swarm.task_count}</div>
                </div>
              </div>

              <div>
                <div className="text-[rgba(255,255,255,0.3)] text-xs mb-2">AGENTS IN SWARM</div>
                <div className="space-y-1">
                  {swarmAgents.map(agent => (
                    <div key={agent.agent_id} className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: agent.status === 'active' ? '#00ff88' : agent.status === 'error' ? '#ef4444' : '#6b7280' }} />
                      <span className="text-[rgba(255,255,255,0.6)]">{agent.name}</span>
                      <span className="text-[rgba(255,255,255,0.3)] ml-auto">{agent.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.3)] text-xs">
                Created {timeAgo(swarm.created_at)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
