'use client';

import { mockToolExecutions, mockAgents } from '@/lib/mock-data';
import { Wrench, AlertTriangle, CheckCircle, Clock, Play, XCircle, Shield } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { ToolExecution } from '@/types';

type ExecStatus = ToolExecution['status'];

const statusColors: Record<ExecStatus, string> = {
  running: '#00f5ff',
  pending: '#f0abfc',
  completed: '#00ff88',
  failed: '#ef4444',
  blocked: '#ffaa00',
};

const toolTypeColors: Record<string, string> = {
  vcs: '#00f5ff',
  system: '#ef4444',
  web: '#7c3aed',
  container: '#00ff88',
  blockchain: '#ffaa00',
};

export default function ToolsPage() {
  const blocked = mockToolExecutions.filter(e => e.status === 'blocked');
  const counts = {
    total: mockToolExecutions.length,
    running: mockToolExecutions.filter(e => e.status === 'running').length,
    blocked: blocked.length,
    completed: mockToolExecutions.filter(e => e.status === 'completed').length,
    pending: mockToolExecutions.filter(e => e.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#00f5ff] tracking-widest">TOOL EXECUTION PANEL</h1>
          <p className="text-[rgba(255,255,255,0.4)] text-sm mt-1">Monitor and approve agent tool executions</p>
        </div>
      </div>

      {/* Approval Warning Banner */}
      {blocked.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-[rgba(255,170,0,0.1)] border border-[rgba(255,170,0,0.3)] rounded-xl">
          <AlertTriangle size={18} className="text-[#ffaa00] flex-shrink-0" />
          <div>
            <div className="text-[#ffaa00] font-medium text-sm">{blocked.length} tool execution{blocked.length > 1 ? 's' : ''} require your approval</div>
            <div className="text-[rgba(255,255,255,0.5)] text-xs mt-0.5">Review and approve or block the pending executions below</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total', value: counts.total, color: '#00f5ff', icon: Wrench },
          { label: 'Running', value: counts.running, color: '#00f5ff', icon: Play },
          { label: 'Blocked', value: counts.blocked, color: '#ffaa00', icon: Shield },
          { label: 'Pending', value: counts.pending, color: '#f0abfc', icon: Clock },
          { label: 'Completed', value: counts.completed, color: '#00ff88', icon: CheckCircle },
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

      {/* Executions Table */}
      <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
        <h2 className="text-[rgba(255,255,255,0.6)] text-xs tracking-wider mb-4">TOOL EXECUTIONS</h2>
        <div className="space-y-3">
          {mockToolExecutions.map(exec => {
            const agent = mockAgents.find(a => a.agent_id === exec.agent_id);
            const statusColor = statusColors[exec.status];
            const typeColor = toolTypeColors[exec.tool_type] || '#00f5ff';
            const isBlocked = exec.status === 'blocked';

            return (
              <div
                key={exec.execution_id}
                className="p-4 rounded-xl transition-all"
                style={{
                  background: isBlocked ? 'rgba(255,170,0,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isBlocked ? 'rgba(255,170,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: typeColor + '22', border: `1px solid ${typeColor}44` }}>
                      <Wrench size={14} style={{ color: typeColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm">{exec.tool_name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ color: typeColor, background: typeColor + '22' }}>{exec.tool_type.toUpperCase()}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ color: statusColor, background: statusColor + '22', border: `1px solid ${statusColor}44` }}>{exec.status.toUpperCase()}</span>
                        {exec.requires_approval && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-[#ffaa00] bg-[rgba(255,170,0,0.15)] border border-[rgba(255,170,0,0.3)] flex items-center gap-1">
                            <Shield size={10} /> APPROVAL REQUIRED
                          </span>
                        )}
                      </div>
                      {exec.command && (
                        <code className="text-xs font-mono text-[rgba(255,255,255,0.6)] bg-[rgba(0,0,0,0.3)] px-2 py-1 rounded block mt-1 truncate">
                          {exec.command}
                        </code>
                      )}
                      {exec.result && (
                        <div className="text-[#00ff88] text-xs mt-1">↳ {exec.result}</div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-[rgba(255,255,255,0.3)]">
                        <span>Agent: <span className="text-[rgba(255,255,255,0.5)]">{agent?.name || exec.agent_id}</span></span>
                        <span>•</span>
                        <span>{timeAgo(exec.started_at)}</span>
                      </div>
                    </div>
                  </div>

                  {isBlocked && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button className="px-3 py-1.5 bg-[rgba(0,255,136,0.1)] border border-[rgba(0,255,136,0.3)] text-[#00ff88] text-xs rounded-lg hover:bg-[rgba(0,255,136,0.2)] transition-all flex items-center gap-1">
                        <CheckCircle size={12} /> Approve
                      </button>
                      <button className="px-3 py-1.5 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-red-400 text-xs rounded-lg hover:bg-[rgba(239,68,68,0.2)] transition-all flex items-center gap-1">
                        <XCircle size={12} /> Block
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
