'use client';

import { mockTasks, mockAgents } from '@/lib/mock-data';
import { ListTodo, Clock, CheckCircle, XCircle, Play, AlertCircle } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { TaskStatus } from '@/types';

const statusColors: Record<TaskStatus, string> = {
  running: '#00f5ff',
  pending: '#f0abfc',
  completed: '#00ff88',
  failed: '#ef4444',
  cancelled: '#6b7280',
};

const statusIcons: Record<TaskStatus, React.ReactNode> = {
  running: <Play size={12} />,
  pending: <Clock size={12} />,
  completed: <CheckCircle size={12} />,
  failed: <XCircle size={12} />,
  cancelled: <AlertCircle size={12} />,
};

export default function TasksPage() {
  const counts = {
    total: mockTasks.length,
    running: mockTasks.filter(t => t.status === 'running').length,
    pending: mockTasks.filter(t => t.status === 'pending').length,
    completed: mockTasks.filter(t => t.status === 'completed').length,
    failed: mockTasks.filter(t => t.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#00f5ff] tracking-widest">TASK GRAPH VISUALIZER</h1>
          <p className="text-[rgba(255,255,255,0.4)] text-sm mt-1">Monitor task execution and dependencies</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total', value: counts.total, color: '#00f5ff', icon: ListTodo },
          { label: 'Running', value: counts.running, color: '#00f5ff', icon: Play },
          { label: 'Pending', value: counts.pending, color: '#f0abfc', icon: Clock },
          { label: 'Completed', value: counts.completed, color: '#00ff88', icon: CheckCircle },
          { label: 'Failed', value: counts.failed, color: '#ef4444', icon: XCircle },
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

      {/* Tasks Table */}
      <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
        <h2 className="text-[rgba(255,255,255,0.6)] text-xs tracking-wider mb-4">TASK QUEUE</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[rgba(255,255,255,0.3)] border-b border-[rgba(255,255,255,0.05)]">
              <th className="text-left pb-2">TASK ID</th>
              <th className="text-left pb-2">NAME</th>
              <th className="text-left pb-2">STATUS</th>
              <th className="text-left pb-2">AGENT</th>
              <th className="text-left pb-2">DEPENDENCIES</th>
              <th className="text-left pb-2">STARTED</th>
              <th className="text-left pb-2">DURATION</th>
            </tr>
          </thead>
          <tbody>
            {mockTasks.map(task => {
              const agent = mockAgents.find(a => a.agent_id === task.agent_id);
              const color = statusColors[task.status];
              const duration = task.started_at
                ? task.completed_at
                  ? `${Math.round((new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / 60000)}m`
                  : `${Math.round((Date.now() - new Date(task.started_at).getTime()) / 60000)}m+`
                : '-';
              return (
                <tr key={task.task_id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="py-2 font-mono text-[rgba(255,255,255,0.3)]">{task.task_id}</td>
                  <td className="py-2 text-white font-medium">
                    {task.name}
                    {task.error && <div className="text-red-400 text-[10px] mt-0.5">{task.error}</div>}
                  </td>
                  <td className="py-2">
                    <span className="flex items-center gap-1 w-fit px-2 py-0.5 rounded-full font-medium" style={{ color, background: color + '22', border: `1px solid ${color}44` }}>
                      {statusIcons[task.status]} {task.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 text-[rgba(255,255,255,0.5)]">{agent?.name || 'Unassigned'}</td>
                  <td className="py-2">
                    {task.dependencies.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {task.dependencies.map(dep => (
                          <span key={dep} className="px-1.5 py-0.5 bg-[rgba(124,58,237,0.2)] border border-[rgba(124,58,237,0.3)] text-[#7c3aed] rounded text-[10px]">{dep}</span>
                        ))}
                      </div>
                    ) : <span className="text-[rgba(255,255,255,0.2)]">None</span>}
                  </td>
                  <td className="py-2 text-[rgba(255,255,255,0.4)]">{task.started_at ? timeAgo(task.started_at) : '-'}</td>
                  <td className="py-2 text-[rgba(255,255,255,0.4)]">{duration}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
