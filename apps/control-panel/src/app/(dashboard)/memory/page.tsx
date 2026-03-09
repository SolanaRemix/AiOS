'use client';

import { useState } from 'react';
import { mockMemory, mockAgents } from '@/lib/mock-data';
import { Brain, Search } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { MemoryEntry } from '@/types';

type MemoryType = MemoryEntry['type'] | 'all';

const typeColors: Record<MemoryEntry['type'], string> = {
  short_term: '#00f5ff',
  long_term: '#00ff88',
  agent_specific: '#7c3aed',
  knowledge_base: '#f0abfc',
};

const typeLabels: Record<MemoryEntry['type'], string> = {
  short_term: 'SHORT TERM',
  long_term: 'LONG TERM',
  agent_specific: 'AGENT SPECIFIC',
  knowledge_base: 'KNOWLEDGE BASE',
};

export default function MemoryPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<MemoryType>('all');

  const filtered = mockMemory.filter(m => {
    const matchesSearch = search === '' || m.content.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const counts: Record<MemoryType, number> = {
    all: mockMemory.length,
    short_term: mockMemory.filter(m => m.type === 'short_term').length,
    long_term: mockMemory.filter(m => m.type === 'long_term').length,
    agent_specific: mockMemory.filter(m => m.type === 'agent_specific').length,
    knowledge_base: mockMemory.filter(m => m.type === 'knowledge_base').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#00f5ff] tracking-widest">MEMORY EXPLORER</h1>
          <p className="text-[rgba(255,255,255,0.4)] text-sm mt-1">Browse and search agent memory stores</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {([
          { label: 'All', type: 'all' as const, color: '#00f5ff' },
          { label: 'Short Term', type: 'short_term' as const, color: typeColors.short_term },
          { label: 'Long Term', type: 'long_term' as const, color: typeColors.long_term },
          { label: 'Agent Specific', type: 'agent_specific' as const, color: typeColors.agent_specific },
          { label: 'Knowledge Base', type: 'knowledge_base' as const, color: typeColors.knowledge_base },
        ]).map(({ label, type, color }) => (
          <div key={type} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[rgba(255,255,255,0.4)] text-xs">{label.toUpperCase()}</span>
              <Brain size={14} style={{ color }} />
            </div>
            <div className="text-2xl font-bold" style={{ color }}>{counts[type]}</div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search memory entries..."
            className="w-full pl-9 pr-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white placeholder-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[rgba(0,245,255,0.3)]"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'short_term', 'long_term', 'agent_specific', 'knowledge_base'] as const).map(type => {
            const color = type === 'all' ? '#00f5ff' : typeColors[type];
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: typeFilter === type ? color + '22' : 'rgba(255,255,255,0.05)',
                  color: typeFilter === type ? color : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${typeFilter === type ? color + '44' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {type === 'all' ? 'ALL' : typeLabels[type]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Memory Cards */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(entry => {
          const color = typeColors[entry.type];
          const agent = mockAgents.find(a => a.agent_id === entry.agent_id);
          return (
            <div key={entry.id} className="bg-[rgba(255,255,255,0.03)] rounded-xl p-4 transition-all hover:bg-[rgba(255,255,255,0.05)]" style={{ border: `1px solid ${color}33` }}>
              <div className="flex items-start justify-between mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ color, background: color + '22' }}>
                  {typeLabels[entry.type]}
                </span>
                <span className="text-[rgba(255,255,255,0.3)] text-xs">{timeAgo(entry.created_at)}</span>
              </div>

              <p className="text-[rgba(255,255,255,0.8)] text-sm mb-3 leading-relaxed">{entry.content}</p>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {agent && (
                    <span className="text-[rgba(255,255,255,0.4)]">
                      Agent: <span className="text-[rgba(255,255,255,0.7)]">{agent.name}</span>
                    </span>
                  )}
                  <span className="text-[rgba(255,255,255,0.4)]">ID: <span className="font-mono text-[rgba(255,255,255,0.3)]">{entry.id}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[rgba(255,255,255,0.4)]">Importance:</span>
                  <div className="w-16 h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${entry.importance * 100}%`, background: color }} />
                  </div>
                  <span style={{ color }}>{Math.round(entry.importance * 100)}%</span>
                </div>
              </div>

              {Object.keys(entry.metadata).length > 0 && (
                <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)]">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(entry.metadata).map(([k, v]) => (
                      <span key={k} className="px-2 py-0.5 bg-[rgba(255,255,255,0.05)] rounded text-[10px] text-[rgba(255,255,255,0.4)]">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[rgba(255,255,255,0.3)]">
          <Brain size={32} className="mx-auto mb-3 opacity-30" />
          <p>No memory entries match your search</p>
        </div>
      )}
    </div>
  );
}
