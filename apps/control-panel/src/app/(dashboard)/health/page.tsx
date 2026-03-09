'use client';

import { mockSystemMetrics, generateMetricsHistory } from '@/lib/mock-data';
import { Cpu, Brain, Zap, Server, Clock } from 'lucide-react';
import { formatUptime, formatNumber } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { useMemo } from 'react';

function GaugeCard({ label, value, color, icon: Icon, threshold = 80 }: { label: string; value: number; color: string; icon: React.ElementType; threshold?: number }) {
  const isWarning = value >= threshold;
  const gaugeData = [{ name: label, value, fill: isWarning ? '#ef4444' : color }];

  return (
    <div className="bg-[rgba(255,255,255,0.03)] border rounded-xl p-4 text-center" style={{ borderColor: isWarning ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Icon size={14} style={{ color: isWarning ? '#ef4444' : color }} />
        <span className="text-[rgba(255,255,255,0.5)] text-xs tracking-wider">{label}</span>
      </div>
      <div style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={gaugeData}>
            <RadialBar dataKey="value" background={{ fill: 'rgba(255,255,255,0.05)' }} cornerRadius={4} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-3xl font-bold -mt-6" style={{ color: isWarning ? '#ef4444' : color }}>{value}%</div>
      {isWarning && <div className="text-red-400 text-[10px] mt-1 animate-pulse">⚠ HIGH USAGE</div>}
    </div>
  );
}

export default function HealthPage() {
  const metricsHistory = useMemo(() => generateMetricsHistory(30), []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#00f5ff] tracking-widest">SYSTEM HEALTH MONITOR</h1>
          <p className="text-[rgba(255,255,255,0.4)] text-sm mt-1">Real-time infrastructure and performance metrics</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-[rgba(0,255,136,0.1)] border border-[rgba(0,255,136,0.3)] px-4 py-2 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
          <span className="text-[#00ff88]">ALL SYSTEMS OPERATIONAL</span>
        </div>
      </div>

      {/* Gauge Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <GaugeCard label="CPU USAGE" value={mockSystemMetrics.cpu_usage} color="#00f5ff" icon={Cpu} threshold={85} />
        <GaugeCard label="MEMORY USAGE" value={mockSystemMetrics.memory_usage} color="#7c3aed" icon={Brain} threshold={80} />
        <GaugeCard label="GPU USAGE" value={mockSystemMetrics.gpu_usage} color="#00ff88" icon={Zap} threshold={90} />
      </div>

      {/* Area Chart */}
      <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
        <h2 className="text-[rgba(255,255,255,0.6)] text-xs tracking-wider mb-4">RESOURCE UTILIZATION HISTORY</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={metricsHistory}>
            <defs>
              <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gpuGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '8px', fontSize: 12 }} />
            <Area type="monotone" dataKey="cpu" stroke="#00f5ff" strokeWidth={2} fill="url(#cpuGrad)" name="CPU %" />
            <Area type="monotone" dataKey="memory" stroke="#7c3aed" strokeWidth={2} fill="url(#memGrad)" name="MEM %" />
            <Area type="monotone" dataKey="gpu" stroke="#00ff88" strokeWidth={2} fill="url(#gpuGrad)" name="GPU %" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* System Metrics Table */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
          <h2 className="text-[rgba(255,255,255,0.6)] text-xs tracking-wider mb-4 flex items-center gap-2">
            <Server size={12} /> SYSTEM METRICS
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Agent Count', value: mockSystemMetrics.agent_count, color: '#00f5ff' },
              { label: 'Active Swarms', value: mockSystemMetrics.active_swarms, color: '#7c3aed' },
              { label: 'Task Throughput', value: `${mockSystemMetrics.task_throughput}/hr`, color: '#00ff88' },
              { label: 'Token Usage/Min', value: formatNumber(mockSystemMetrics.token_usage_per_min), color: '#f0abfc' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-[rgba(255,255,255,0.5)] text-sm">{label}</span>
                <span className="font-bold" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
          <h2 className="text-[rgba(255,255,255,0.6)] text-xs tracking-wider mb-4 flex items-center gap-2">
            <Clock size={12} /> UPTIME & THRESHOLDS
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-[rgba(255,255,255,0.5)] text-sm">System Uptime</span>
              <span className="font-bold text-[#00ff88]">{formatUptime(mockSystemMetrics.uptime_seconds)}</span>
            </div>
            {[
              { label: 'CPU Threshold', value: '85%', status: mockSystemMetrics.cpu_usage < 85 },
              { label: 'Memory Threshold', value: '80%', status: mockSystemMetrics.memory_usage < 80 },
              { label: 'GPU Threshold', value: '90%', status: mockSystemMetrics.gpu_usage < 90 },
            ].map(({ label, value, status }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-[rgba(255,255,255,0.5)] text-sm">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[rgba(255,255,255,0.4)] text-xs">{value}</span>
                  <span className={`text-xs font-medium ${status ? 'text-[#00ff88]' : 'text-red-400'}`}>
                    {status ? 'OK' : 'ALERT'}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between py-2">
              <span className="text-[rgba(255,255,255,0.5)] text-sm">Last Updated</span>
              <span className="text-[rgba(255,255,255,0.4)] text-xs font-mono">{new Date(mockSystemMetrics.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
