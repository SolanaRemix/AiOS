"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bot, RefreshCw, Settings, Filter } from "lucide-react";
import { AgentCard } from "@/components/dashboard/AgentCard";
import { UsageChart } from "@/components/dashboard/UsageChart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Agent, AgentRole, AgentStatus } from "@/types";

const MOCK_AGENTS: Agent[] = [
  {
    id: "1",
    name: "Alpha Orchestrator",
    role: "orchestrator",
    status: "active",
    projectId: "proj-1",
    currentTask: "Coordinating multi-agent pipeline for project Alpha",
    completedTasks: 342,
    successRate: 98.5,
    avgResponseTime: 1.2,
    model: "gpt-4o",
    lastActive: "just now",
  },
  {
    id: "2",
    name: "CodeGen Prime",
    role: "code_generator",
    status: "busy",
    projectId: "proj-1",
    currentTask: "Generating TypeScript API client from OpenAPI spec",
    completedTasks: 1205,
    successRate: 96.2,
    avgResponseTime: 3.8,
    model: "claude-3-5-sonnet",
    lastActive: "2m ago",
  },
  {
    id: "3",
    name: "Review Bot 3000",
    role: "code_reviewer",
    status: "idle",
    projectId: "proj-2",
    completedTasks: 567,
    successRate: 99.1,
    avgResponseTime: 2.1,
    model: "gpt-4o",
    lastActive: "10m ago",
  },
  {
    id: "4",
    name: "Debug Hawk",
    role: "debugger",
    status: "active",
    projectId: "proj-3",
    currentTask: "Analyzing stack trace for memory leak in service worker",
    completedTasks: 289,
    successRate: 94.8,
    avgResponseTime: 5.2,
    model: "claude-3-5-sonnet",
    lastActive: "1m ago",
  },
  {
    id: "5",
    name: "TestMaster X",
    role: "tester",
    status: "idle",
    projectId: "proj-1",
    completedTasks: 891,
    successRate: 97.3,
    avgResponseTime: 4.5,
    model: "gemini-pro-1.5",
    lastActive: "25m ago",
  },
  {
    id: "6",
    name: "DocuBot Pro",
    role: "documenter",
    status: "busy",
    projectId: "proj-4",
    currentTask: "Generating API documentation for 47 endpoints",
    completedTasks: 423,
    successRate: 99.6,
    avgResponseTime: 2.8,
    model: "gpt-4o",
    lastActive: "5m ago",
  },
  {
    id: "7",
    name: "SecureGuard AI",
    role: "security_auditor",
    status: "active",
    projectId: "proj-3",
    currentTask: "Running OWASP security scan on authentication module",
    completedTasks: 156,
    successRate: 99.9,
    avgResponseTime: 8.4,
    model: "gpt-4o",
    lastActive: "3m ago",
  },
  {
    id: "8",
    name: "DevOps Nexus",
    role: "devops",
    status: "idle",
    projectId: "proj-2",
    completedTasks: 78,
    successRate: 95.5,
    avgResponseTime: 12.1,
    model: "claude-3-5-sonnet",
    lastActive: "1h ago",
  },
  {
    id: "9",
    name: "DataSense AI",
    role: "data_analyst",
    status: "error",
    projectId: "proj-5",
    completedTasks: 234,
    successRate: 91.2,
    avgResponseTime: 6.7,
    model: "gemini-pro-1.5",
    lastActive: "2h ago",
  },
];

const AGENT_PERFORMANCE_DATA = [
  { date: "Mon", tasks: 45, success: 44, errors: 1 },
  { date: "Tue", tasks: 62, success: 60, errors: 2 },
  { date: "Wed", tasks: 38, success: 37, errors: 1 },
  { date: "Thu", tasks: 85, success: 82, errors: 3 },
  { date: "Fri", tasks: 71, success: 70, errors: 1 },
  { date: "Sat", tasks: 29, success: 29, errors: 0 },
  { date: "Sun", tasks: 53, success: 51, errors: 2 },
];

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Agents" },
  { value: "active", label: "Active" },
  { value: "busy", label: "Busy" },
  { value: "idle", label: "Idle" },
  { value: "error", label: "Error" },
  { value: "offline", label: "Offline" },
];

export default function AgentsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [agents] = useState(MOCK_AGENTS);

  const filtered = agents.filter(
    (a) => statusFilter === "all" || a.status === statusFilter
  );

  const stats = {
    total: agents.length,
    active: agents.filter((a) => a.status === "active").length,
    busy: agents.filter((a) => a.status === "busy").length,
    idle: agents.filter((a) => a.status === "idle").length,
    error: agents.filter((a) => a.status === "error").length,
    avgSuccessRate:
      Math.round(
        agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length * 10
      ) / 10,
    totalTasks: agents.reduce((sum, a) => sum + a.completedTasks, 0),
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-white">AI Agents</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {stats.total} agents · {stats.active + stats.busy} active · {stats.error} errors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button variant="neon" size="sm" className="gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            Configure
          </Button>
        </div>
      </motion.div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "Active", value: stats.active, color: "text-green-400" },
          { label: "Busy", value: stats.busy, color: "text-primary" },
          { label: "Idle", value: stats.idle, color: "text-yellow-400" },
          { label: "Errors", value: stats.error, color: "text-red-400" },
          { label: "Avg Success", value: `${stats.avgSuccessRate}%`, color: "text-secondary" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4 text-center"
          >
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-white/40 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart */}
      <Card glass>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            Agent Performance (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UsageChart
            data={AGENT_PERFORMANCE_DATA}
            type="bar"
            dataKeys={[
              { key: "tasks", color: "#00f5ff", label: "Total Tasks" },
              { key: "success", color: "#00ff88", label: "Successful" },
              { key: "errors", color: "#ff4444", label: "Errors" },
            ]}
            height={240}
          />
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-white/30" />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === f.value
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-white/40 hover:text-white/70 border border-white/8"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((agent, i) => (
          <AgentCard key={agent.id} agent={agent} index={i} />
        ))}
      </div>
    </div>
  );
}
