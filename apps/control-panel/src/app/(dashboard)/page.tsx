'use client';

import { useMockWebSocket } from '@/hooks/useWebSocket';
import { mockAgents, mockSwarms, mockTasks, mockSystemMetrics, generateMetricsHistory } from '@/lib/mock-data';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Bot, Network, ListTodo, Zap } from 'lucide-react';
import { formatNumber, formatUptime, timeAgo } from '@/lib/utils';
import { useMemo } from 'react';

export default function DashboardPage() {
  const { connected, events } = useMockWebSocket();
  const metricsHistory = useMemo(() => generateMetricsHistory(20), []);

  const activeAgents = mockAgents.filter(a => a.status === 'active').length;
  const activeSwarms = mockSwarms.filter(s => s.status === 'active').length;
  const runningTasks = mockTasks.filter(t => t.status === 'running').length;
  const totalTokens = mockAgents.reduce((sum, a) => sum + a.token_usage, 0);

  const stats = [
    { label: 'Total Agents', value: mockAgents.length, sub: `${activeAgents} active`, icon: Bot, color: '#00f5ff' },
    { label: 'Active Swarms', value: activeSwarms, sub: `${mockSwarms.length} total`, icon: Network, color: '#7c3aed' },
    { label: 'Running Tasks', value: runningTasks, sub: `${mockTasks.length} total`, icon: ListTodo, color: '#00ff88' },
    { label: 'Tokens Used', value: formatNumber(totalTokens), sub: `${formatNumber(mockSystemMetrics.token_usage_per_min)}/min`, icon: Zap, color: '#f0abfc' },
  ];

  const statusColors: Record<string, string> = {
    active: '#00ff88',
    idle: '#00f5ff',
    paused: '#f0abfc',
    error: '#ef4444',
    terminated: '#6b7280',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#00f5ff] tracking-widest">SWARM COMMAND CENTER</h1>
          <p className="text-[rgba(255,255,255,0.4)] text-sm mt-1">Real-time AI agent orchestration dashboard</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-[#00ff88] animate-pulse' : 'bg-red-500'}`} />
          <span className={connected ? 'text-[#00ff88]' : 'text-red-400'}>{connected ? 'LIVE' : 'CONNECTING...'}</span>
          <span className="text-[rgba(255,255,255,0.3)] ml-2">Uptime: {formatUptime(mockSystemMetrics.uptime_seconds)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 hover:border-[rgba(0,245,255,0.2)] transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[rgba(255,255,255,0.4)] text-xs tracking-wider">{label.toUpperCase()}</span>
              <Icon size={16} style={{ color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            <div className="text-[rgba(255,255,255,0.3)] text-xs mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts + Events */}
      <div className="grid grid-cols-3 gap-4">
        {/* Metrics Chart */}
        <div className="col-span-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
          <h2 className="text-[rgba(255,255,255,0.6)] text-xs tracking-wider mb-4">SYSTEM METRICS (LAST 10 MIN)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metricsHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '8px', fontSize: 12 }} />
              <Line type="monotone" dataKey="cpu" stroke="#00f5ff" strokeWidth={2} dot={false} name="CPU %" />
              <Line type="monotone" dataKey="memory" stroke="#7c3aed" strokeWidth={2} dot={false} name="MEM %" />
              <Line type="monotone" dataKey="gpu" stroke="#00ff88" strokeWidth={2} dot={false} name="GPU %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Live Events */}
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
          <h2 className="text-[rgba(255,255,255,0.6)] text-xs tracking-wider mb-4">LIVE EVENTS</h2>
          <div className="space-y-2 overflow-y-auto max-h-48">
            {events.slice(0, 10).map((event, i) => (
              <div key={`${event.type}-${event.timestamp}-${i}`} className="flex items-start gap-2 text-xs py-1 border-b border-[rgba(255,255,255,0.05)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00f5ff] mt-1 flex-shrink-0" />
                <div>
                  <span className="text-[#00f5ff]">{event.type.replace(/_/g, ' ').toUpperCase()}</span>
                  <div className="text-[rgba(255,255,255,0.3)]">{timeAgo(event.timestamp)}</div>
                </div>
              </div>
            ))}
            {events.length === 0 && <div className="text-[rgba(255,255,255,0.2)] text-xs text-center py-4">Waiting for events...</div>}
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
        <h2 className="text-[rgba(255,255,255,0.6)] text-xs tracking-wider mb-4">AGENT ROSTER</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[rgba(255,255,255,0.3)] border-b border-[rgba(255,255,255,0.05)]">
              <th className="text-left pb-2">AGENT</th>
              <th className="text-left pb-2">ROLE</th>
              <th className="text-left pb-2">MODEL</th>
              <th className="text-left pb-2">STATUS</th>
              <th className="text-left pb-2">TOKENS</th>
              <th className="text-left pb-2">MEM %</th>
              <th className="text-left pb-2">TASKS</th>
              <th className="text-left pb-2">LAST ACTIVE</th>
            </tr>
          </thead>
          <tbody>
            {mockAgents.map(agent => (
              <tr key={agent.agent_id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)]">
                <td className="py-2 font-medium text-white">{agent.name}</td>
                <td className="py-2 text-[rgba(255,255,255,0.5)]">{agent.role}</td>
                <td className="py-2 text-[rgba(255,255,255,0.5)]">{agent.model}</td>
                <td className="py-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ color: statusColors[agent.status], background: statusColors[agent.status] + '22', border: `1px solid ${statusColors[agent.status]}44` }}>
                    {agent.status.toUpperCase()}
                  </span>
                </td>
                <td className="py-2 text-[rgba(255,255,255,0.5)]">{formatNumber(agent.token_usage)}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${agent.memory_usage}%`, background: agent.memory_usage > 70 ? '#ef4444' : agent.memory_usage > 50 ? '#f0abfc' : '#00f5ff' }} />
                    </div>
                    <span className="text-[rgba(255,255,255,0.4)]">{agent.memory_usage}%</span>
                  </div>
                </td>
                <td className="py-2 text-[rgba(255,255,255,0.5)]">{agent.task_queue.length}</td>
                <td className="py-2 text-[rgba(255,255,255,0.3)]">{timeAgo(agent.last_active)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
