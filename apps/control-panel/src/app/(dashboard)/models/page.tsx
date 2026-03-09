'use client';

import { mockModelRoutes } from '@/lib/mock-data';
import { Cpu, DollarSign, Zap, Activity } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const providerColors: Record<string, string> = {
  OpenAI: '#00ff88',
  Anthropic: '#f97316',
  Google: '#3b82f6',
  Groq: '#eab308',
  Ollama: '#7c3aed',
};

const statusColors = {
  active: '#00ff88',
  degraded: '#ffaa00',
  offline: '#6b7280',
};

export default function ModelsPage() {
  const totalCost = mockModelRoutes.reduce((sum, m) => sum + m.cost_today, 0);
  const totalRequests = mockModelRoutes.reduce((sum, m) => sum + m.requests_today, 0);
  const totalTokens = mockModelRoutes.reduce((sum, m) => sum + m.tokens_used, 0);
  const avgLatency = mockModelRoutes.filter(m => m.avg_latency_ms > 0).reduce((sum, m, _, arr) => sum + m.avg_latency_ms / arr.length, 0);

  // Cost by provider for bar chart
  const providerCosts = Object.entries(
    mockModelRoutes.reduce<Record<string, number>>((acc, m) => {
      acc[m.provider] = (acc[m.provider] || 0) + m.cost_today;
      return acc;
    }, {})
  ).map(([provider, cost]) => ({ provider, cost: parseFloat(cost.toFixed(2)) }));

  const maxLatency = Math.max(...mockModelRoutes.filter(m => m.avg_latency_ms > 0).map(m => m.avg_latency_ms));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#00f5ff] tracking-widest">MODEL ROUTER PANEL</h1>
          <p className="text-[rgba(255,255,255,0.4)] text-sm mt-1">Monitor AI model usage, costs, and routing</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Cost Today', value: `$${totalCost.toFixed(2)}`, color: '#00ff88', icon: DollarSign },
          { label: 'Total Requests', value: formatNumber(totalRequests), color: '#00f5ff', icon: Zap },
          { label: 'Total Tokens', value: formatNumber(totalTokens), color: '#7c3aed', icon: Cpu },
          { label: 'Avg Latency', value: `${Math.round(avgLatency)}ms`, color: '#f0abfc', icon: Activity },
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

      <div className="grid grid-cols-3 gap-4">
        {/* Cost Chart */}
        <div className="col-span-1 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
          <h2 className="text-[rgba(255,255,255,0.6)] text-xs tracking-wider mb-4">COST BY PROVIDER ($)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={providerCosts}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="provider" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0a0a14', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '8px', fontSize: 12 }} />
              <Bar dataKey="cost" fill="#00f5ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Model Table */}
        <div className="col-span-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
          <h2 className="text-[rgba(255,255,255,0.6)] text-xs tracking-wider mb-4">MODEL ROUTES</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[rgba(255,255,255,0.3)] border-b border-[rgba(255,255,255,0.05)]">
                <th className="text-left pb-2">PROVIDER</th>
                <th className="text-left pb-2">MODEL</th>
                <th className="text-left pb-2">STATUS</th>
                <th className="text-left pb-2">REQUESTS</th>
                <th className="text-left pb-2">TOKENS</th>
                <th className="text-left pb-2">COST</th>
                <th className="text-left pb-2">LATENCY</th>
                <th className="text-left pb-2">ERR %</th>
              </tr>
            </thead>
            <tbody>
              {mockModelRoutes.map(route => {
                const providerColor = providerColors[route.provider] || '#00f5ff';
                const statusColor = statusColors[route.status];
                return (
                  <tr key={route.model} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="py-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ color: providerColor, background: providerColor + '22' }}>{route.provider}</span>
                    </td>
                    <td className="py-2 text-white font-medium">{route.model}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                        <span style={{ color: statusColor }}>{route.status.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="py-2 text-[rgba(255,255,255,0.5)]">{formatNumber(route.requests_today)}</td>
                    <td className="py-2 text-[rgba(255,255,255,0.5)]">{formatNumber(route.tokens_used)}</td>
                    <td className="py-2 text-[#00ff88]">${route.cost_today.toFixed(2)}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                          <div className="h-full bg-[#00f5ff] rounded-full" style={{ width: `${maxLatency > 0 ? (route.avg_latency_ms / maxLatency) * 100 : 0}%` }} />
                        </div>
                        <span className="text-[rgba(255,255,255,0.5)]">{route.avg_latency_ms}ms</span>
                      </div>
                    </td>
                    <td className="py-2" style={{ color: route.error_rate > 0.05 ? '#ef4444' : 'rgba(255,255,255,0.5)' }}>
                      {(route.error_rate * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
