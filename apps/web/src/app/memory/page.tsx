"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Search,
  Trash2,
  Filter,
  ChevronRight,
  Clock,
  Hash,
  RefreshCw,
  Download,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface MemoryEntry {
  id: string;
  content: string;
  source: string;
  agentId: string;
  similarity?: number;
  tags: string[];
  createdAt: string;
  tokenCount: number;
}

const MOCK_ENTRIES: MemoryEntry[] = [
  {
    id: "mem-001",
    content: "User prefers TypeScript with strict mode enabled. Always use explicit return types for public functions.",
    source: "conversation",
    agentId: "code-gen-1",
    similarity: 0.94,
    tags: ["preference", "typescript"],
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    tokenCount: 32,
  },
  {
    id: "mem-002",
    content: "Project Alpha uses PostgreSQL 16 with pg_vector extension for embeddings. Schema: agents, tasks, memory tables.",
    source: "document",
    agentId: "orchestrator",
    tags: ["database", "project-alpha", "schema"],
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    tokenCount: 45,
  },
  {
    id: "mem-003",
    content: "API rate limit hit for OpenAI at 2024-11-30T14:23:00Z. Fallback to Claude 3.5 Sonnet successfully applied.",
    source: "system",
    agentId: "llm-router",
    tags: ["error", "rate-limit", "openai"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    tokenCount: 38,
  },
  {
    id: "mem-004",
    content: "Code review checklist: 1) No console.logs in production, 2) All async functions use try/catch, 3) Input validation at API boundary.",
    source: "conversation",
    agentId: "code-reviewer",
    tags: ["checklist", "code-review"],
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    tokenCount: 55,
  },
  {
    id: "mem-005",
    content: "Deployment pipeline: GitHub Actions → Docker build → ECR push → ECS rolling update. Avg deploy time: 4m 30s.",
    source: "document",
    agentId: "devops",
    tags: ["deployment", "ci-cd"],
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    tokenCount: 42,
  },
  {
    id: "mem-006",
    content: "Security audit findings: JWT expiry set to 7 days (recommend 1h for sensitive ops). CORS policy is too permissive.",
    source: "system",
    agentId: "security",
    tags: ["security", "audit", "jwt"],
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    tokenCount: 48,
  },
  {
    id: "mem-007",
    content: "User's preferred stack: Next.js 15, TypeScript, Tailwind CSS, Shadcn UI, Prisma, PostgreSQL, Redis, Docker.",
    source: "conversation",
    agentId: "orchestrator",
    tags: ["preference", "tech-stack"],
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    tokenCount: 28,
  },
];

const SOURCE_COLORS: Record<string, string> = {
  conversation: "neon",
  document: "neon-purple",
  system: "secondary",
} as const;

export default function MemoryPage() {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<MemoryEntry[]>(MOCK_ENTRIES);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sourceFilter, setSourceFilter] = useState("all");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [searching, setSearching] = useState(false);

  const sources = ["all", "conversation", "document", "system"];

  const filtered = entries.filter((e) => {
    const matchesQuery =
      !query ||
      e.content.toLowerCase().includes(query.toLowerCase()) ||
      e.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
    const matchesSource = sourceFilter === "all" || e.source === sourceFilter;
    return matchesQuery && matchesSource;
  });

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function deleteSelected() {
    setEntries((prev) => prev.filter((e) => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
  }

  async function handleSearch() {
    setSearching(true);
    await new Promise((r) => setTimeout(r, 800));
    setSearching(false);
  }

  function clearAll() {
    setEntries([]);
    setShowClearConfirm(false);
  }

  function formatTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  const totalTokens = entries.reduce((sum, e) => sum + e.tokenCount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white">Memory Manager</h1>
              <Badge variant="neon-purple" className="text-xs">{entries.length} entries</Badge>
            </div>
            <p className="text-white/40 text-sm">Search, inspect, and manage your agents&apos; long-term memory.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Clear Confirm Banner */}
      {showClearConfirm && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 rounded-xl border border-red-500/30 bg-red-500/5"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-white/70 flex-1">
            This will permanently delete all {entries.length} memory entries. This cannot be undone.
          </p>
          <Button variant="destructive" size="sm" onClick={clearAll}>Confirm Clear</Button>
          <Button variant="ghost" size="sm" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
        </motion.div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Entries", value: entries.length, color: "text-white" },
          { label: "Total Tokens", value: totalTokens.toLocaleString(), color: "text-primary" },
          { label: "Conversations", value: entries.filter((e) => e.source === "conversation").length, color: "text-secondary" },
          { label: "Documents", value: entries.filter((e) => e.source === "document").length, color: "text-yellow-400" },
        ].map((stat) => (
          <Card key={stat.label} glass>
            <CardContent className="p-4">
              <p className="text-xs text-white/40">{stat.label}</p>
              <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card glass>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Search by content or tag (semantic search)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                  className="flex-1"
                />
                <Button
                  variant="neon"
                  size="sm"
                  onClick={handleSearch}
                  disabled={searching}
                  className="gap-1.5 px-4"
                >
                  {searching ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Brain className="w-3.5 h-3.5" />
                  )}
                  {searching ? "Searching..." : "Semantic"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-white/30 flex-shrink-0" />
                {sources.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSourceFilter(s)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${
                      sourceFilter === s
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-white/10 text-white/40 hover:text-white/60"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card glass>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4 text-secondary" />
                Memory Entries
                <span className="text-white/30 font-normal text-sm">({filtered.length})</span>
              </CardTitle>
              {selectedIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={deleteSelected}
                >
                  <Trash2 className="w-3 h-3" />
                  Delete {selectedIds.size} selected
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filtered.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i }}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all cursor-pointer ${
                    selectedIds.has(entry.id)
                      ? "border-primary/40 bg-primary/5"
                      : "border-white/5 hover:border-white/10 hover:bg-white/3"
                  }`}
                  onClick={() => toggleSelect(entry.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(entry.id)}
                    onChange={() => toggleSelect(entry.id)}
                    className="mt-1 accent-cyan-400"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 leading-relaxed line-clamp-2">
                      {entry.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/8"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge
                      variant={SOURCE_COLORS[entry.source] as "neon" | "neon-purple" | "secondary"}
                      className="text-[10px] capitalize"
                    >
                      {entry.source}
                    </Badge>
                    {entry.similarity && (
                      <span className="text-[10px] text-green-400 font-mono">
                        {(entry.similarity * 100).toFixed(0)}% match
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-white/25">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTime(entry.createdAt)}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-white/25">
                      <Hash className="w-2.5 h-2.5" />
                      {entry.tokenCount}t
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0 mt-1" />
                </motion.div>
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-16 text-white/30">
                  <Brain className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No memory entries found.</p>
                  {query && <p className="text-xs mt-1">Try a different search query.</p>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
