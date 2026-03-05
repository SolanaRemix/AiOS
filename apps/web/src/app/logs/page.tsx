"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ScrollText,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Info,
  Bug,
  XCircle,
  Clock,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  source: string;
  timestamp: string;
  correlationId?: string;
  data?: Record<string, unknown>;
}

const MOCK_LOGS: LogEntry[] = [
  { id: "log-001", level: "info", message: "Agent 'Alpha Orchestrator' started task execution", source: "agent-service", timestamp: new Date(Date.now() - 1000 * 10).toISOString(), correlationId: "corr-abc123", data: { agentId: "agent-1", taskId: "task-99" } },
  { id: "log-002", level: "debug", message: "LLM router selected model: gpt-4o (latency: 42ms)", source: "llm-router", timestamp: new Date(Date.now() - 1000 * 25).toISOString(), correlationId: "corr-abc123" },
  { id: "log-003", level: "warn", message: "OpenAI API rate limit approaching: 85% of quota used", source: "llm-router", timestamp: new Date(Date.now() - 1000 * 60).toISOString(), data: { provider: "openai", usedTokens: 85000, limitTokens: 100000 } },
  { id: "log-004", level: "info", message: "Memory search completed: 12 results in 38ms", source: "memory-service", timestamp: new Date(Date.now() - 1000 * 90).toISOString(), correlationId: "corr-def456" },
  { id: "log-005", level: "error", message: "Tool execution failed: http_request timed out after 30s", source: "tool-runner", timestamp: new Date(Date.now() - 1000 * 120).toISOString(), correlationId: "corr-ghi789", data: { tool: "http_request", url: "https://api.example.com/data", timeout: 30000 } },
  { id: "log-006", level: "info", message: "Webhook delivered successfully to https://customer.app/hooks", source: "webhook-service", timestamp: new Date(Date.now() - 1000 * 150).toISOString(), data: { event: "agent.task.completed", responseCode: 200 } },
  { id: "log-007", level: "debug", message: "Vector embedding generated for memory entry mem-007", source: "memory-service", timestamp: new Date(Date.now() - 1000 * 200).toISOString() },
  { id: "log-008", level: "warn", message: "Database connection pool nearing capacity: 45/50 connections in use", source: "database", timestamp: new Date(Date.now() - 1000 * 300).toISOString(), data: { active: 45, max: 50 } },
  { id: "log-009", level: "info", message: "User 'john@example.com' authenticated via JWT", source: "auth-service", timestamp: new Date(Date.now() - 1000 * 400).toISOString(), correlationId: "corr-jkl012" },
  { id: "log-010", level: "error", message: "Agent 'Debug Hawk' crashed with unhandled exception: TypeError", source: "agent-service", timestamp: new Date(Date.now() - 1000 * 500).toISOString(), correlationId: "corr-mno345", data: { error: "Cannot read property 'data' of undefined", stack: "TypeError: Cannot read...\n  at handler.js:42" } },
  { id: "log-011", level: "info", message: "System health check passed: all services nominal", source: "monitor", timestamp: new Date(Date.now() - 1000 * 600).toISOString() },
  { id: "log-012", level: "debug", message: "Cache hit for agent config: agent-1 (TTL: 295s remaining)", source: "cache", timestamp: new Date(Date.now() - 1000 * 700).toISOString() },
];

const LEVEL_CONFIG: Record<LogLevel, { icon: React.ElementType; badge: "destructive" | "warning" | "default" | "outline"; row: string; text: string }> = {
  debug: { icon: Bug, badge: "outline", row: "", text: "text-white/40" },
  info: { icon: Info, badge: "default", row: "", text: "text-white/70" },
  warn: { icon: AlertTriangle, badge: "warning", row: "bg-yellow-500/3", text: "text-yellow-200/80" },
  error: { icon: XCircle, badge: "destructive", row: "bg-red-500/5", text: "text-red-200/80" },
};

const TIME_RANGES = ["Last 15m", "Last 1h", "Last 6h", "Last 24h", "Last 7d"];

export default function LogsPage() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [timeRange, setTimeRange] = useState("Last 1h");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const levels: Array<LogLevel | "all"> = ["all", "debug", "info", "warn", "error"];

  const filtered = MOCK_LOGS.filter((log) => {
    const matchesSearch =
      !search ||
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.source.toLowerCase().includes(search.toLowerCase()) ||
      (log.correlationId?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  function formatTime(iso: string) {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    if (secs < 60) return `${secs}s ago`;
    if (mins < 60) return `${mins}m ago`;
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  const levelCounts = {
    error: MOCK_LOGS.filter((l) => l.level === "error").length,
    warn: MOCK_LOGS.filter((l) => l.level === "warn").length,
    info: MOCK_LOGS.filter((l) => l.level === "info").length,
    debug: MOCK_LOGS.filter((l) => l.level === "debug").length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white">Logs & Events</h1>
              {autoRefresh && (
                <div className="flex items-center gap-1.5 text-xs text-green-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live
                </div>
              )}
            </div>
            <p className="text-white/40 text-sm">Real-time log stream from all system services.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "neon" : "outline"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setAutoRefresh((v) => !v)}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? "animate-spin [animation-duration:3s]" : ""}`} />
              {autoRefresh ? "Live" : "Paused"}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Level Count Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["error", "warn", "info", "debug"] as LogLevel[]).map((level) => {
          const cfg = LEVEL_CONFIG[level];
          const Icon = cfg.icon;
          return (
            <motion.div key={level} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card
                glass
                className={`cursor-pointer transition-all ${
                  levelFilter === level ? "border-primary/30" : ""
                }`}
                onClick={() => setLevelFilter((prev) => (prev === level ? "all" : level))}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className={`w-5 h-5 flex-shrink-0 ${
                    level === "error" ? "text-red-400" :
                    level === "warn" ? "text-yellow-400" :
                    level === "info" ? "text-primary" : "text-white/30"
                  }`} />
                  <div>
                    <p className="text-xs text-white/40 capitalize">{level}</p>
                    <p className={`text-2xl font-black ${
                      level === "error" ? "text-red-400" :
                      level === "warn" ? "text-yellow-400" :
                      level === "info" ? "text-primary" : "text-white/40"
                    }`}>
                      {levelCounts[level]}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Input
          placeholder="Search messages, sources, correlation IDs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="sm:max-w-sm"
        />
        <div className="flex gap-2 flex-wrap items-center">
          <Filter className="w-4 h-4 text-white/30 flex-shrink-0" />
          {levels.map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(l)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${
                levelFilter === l
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-white/10 text-white/40 hover:text-white/60"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Clock className="w-4 h-4 text-white/30" />
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-xs border border-white/10 bg-white/5 text-white rounded-lg px-3 py-1.5 pr-7 appearance-none focus:outline-none focus:border-primary/50"
            >
              {TIME_RANGES.map((r) => (
                <option key={r} value={r} className="bg-[#0d0d1a]">{r}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
          </div>
        </div>
      </motion.div>

      {/* Log Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card glass>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-primary" />
              Log Stream
              <span className="text-white/30 font-normal text-sm">({filtered.length} entries)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-white/5 overflow-hidden font-mono text-xs">
              {filtered.map((log, i) => {
                const cfg = LEVEL_CONFIG[log.level];
                const Icon = cfg.icon;
                const isExpanded = expandedId === log.id;

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.02 * i }}
                    className={`border-b border-white/5 last:border-0 ${cfg.row}`}
                  >
                    <div
                      className="flex items-start gap-3 px-4 py-2.5 hover:bg-white/3 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    >
                      <span className="text-white/20 w-8 flex-shrink-0 mt-0.5 text-right">
                        {String(i + 1).padStart(3, "0")}
                      </span>
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                        log.level === "error" ? "text-red-400" :
                        log.level === "warn" ? "text-yellow-400" :
                        log.level === "info" ? "text-primary" : "text-white/30"
                      }`} />
                      <span className="text-white/25 flex-shrink-0 w-20">
                        {formatTime(log.timestamp)}
                      </span>
                      <Badge variant={cfg.badge} className="text-[9px] py-0 flex-shrink-0 capitalize">
                        {log.level}
                      </Badge>
                      <span className="text-primary/60 flex-shrink-0 min-w-[120px]">
                        [{log.source}]
                      </span>
                      <span className={`flex-1 ${cfg.text}`}>{log.message}</span>
                      {log.correlationId && (
                        <span className="text-white/20 flex-shrink-0 hidden md:block">
                          {log.correlationId}
                        </span>
                      )}
                      {log.data && (
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-white/20 flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        />
                      )}
                    </div>
                    {isExpanded && log.data && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="px-4 pb-3 ml-11"
                      >
                        <pre className="text-[10px] text-white/50 bg-black/30 rounded-lg p-3 overflow-x-auto border border-white/5">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}

              {filtered.length === 0 && (
                <div className="text-center py-16 text-white/30">
                  <Hash className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p>No logs match your filters.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
