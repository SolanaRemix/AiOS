"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Wrench,
  Calculator,
  Clock,
  FolderOpen,
  Globe,
  Terminal,
  Database,
  Cloud,
  Search,
  Plus,
  Settings,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  iconColor: string;
  status: "active" | "inactive" | "error";
  usageCount: number;
  lastUsed: string;
  requiresConfig: boolean;
}

const TOOLS: Tool[] = [
  {
    id: "calculator",
    name: "Calculator",
    description: "Perform arithmetic, algebraic, and statistical calculations with arbitrary precision.",
    category: "Math",
    icon: Calculator,
    iconColor: "text-primary",
    status: "active",
    usageCount: 2841,
    lastUsed: "2 min ago",
    requiresConfig: false,
  },
  {
    id: "date_time",
    name: "Date & Time",
    description: "Get current date/time, calculate durations, format timestamps, and handle timezones.",
    category: "Utilities",
    icon: Clock,
    iconColor: "text-secondary",
    status: "active",
    usageCount: 1205,
    lastUsed: "5 min ago",
    requiresConfig: false,
  },
  {
    id: "file_operations",
    name: "File Operations",
    description: "Read, write, list, and manipulate files within the sandboxed workspace.",
    category: "I/O",
    icon: FolderOpen,
    iconColor: "text-yellow-400",
    status: "active",
    usageCount: 678,
    lastUsed: "12 min ago",
    requiresConfig: false,
  },
  {
    id: "web_search",
    name: "Web Search",
    description: "Search the internet and retrieve up-to-date information from trusted sources.",
    category: "Web",
    icon: Globe,
    iconColor: "text-green-400",
    status: "active",
    usageCount: 3942,
    lastUsed: "just now",
    requiresConfig: true,
  },
  {
    id: "code_execution",
    name: "Code Execution",
    description: "Execute Python code snippets in an isolated sandbox with a 30s timeout.",
    category: "Dev",
    icon: Terminal,
    iconColor: "text-pink-400",
    status: "active",
    usageCount: 1567,
    lastUsed: "8 min ago",
    requiresConfig: false,
  },
  {
    id: "memory_search",
    name: "Memory Search",
    description: "Query the vector memory store for semantically similar past interactions.",
    category: "AI",
    icon: Database,
    iconColor: "text-purple-400",
    status: "active",
    usageCount: 892,
    lastUsed: "15 min ago",
    requiresConfig: false,
  },
  {
    id: "weather",
    name: "Weather API",
    description: "Fetch real-time weather data and forecasts for any location worldwide.",
    category: "Web",
    icon: Cloud,
    iconColor: "text-sky-400",
    status: "inactive",
    usageCount: 0,
    lastUsed: "never",
    requiresConfig: true,
  },
  {
    id: "http_request",
    name: "HTTP Request",
    description: "Make arbitrary HTTP/HTTPS requests to external APIs with full control over headers.",
    category: "Web",
    icon: Zap,
    iconColor: "text-orange-400",
    status: "error",
    usageCount: 345,
    lastUsed: "1 hr ago",
    requiresConfig: true,
  },
];

const STATUS_CONFIG = {
  active: { label: "Active", variant: "success" as const, dot: "bg-green-400 shadow-[0_0_6px_#4ade80]" },
  inactive: { label: "Inactive", variant: "outline" as const, dot: "bg-white/30" },
  error: { label: "Error", variant: "destructive" as const, dot: "bg-red-400 shadow-[0_0_6px_#f87171]" },
};

export default function ToolsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(
    Object.fromEntries(TOOLS.map((t) => [t.id, t.status === "active"]))
  );

  const categories = ["All", ...Array.from(new Set(TOOLS.map((t) => t.category)))];

  const filtered = TOOLS.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const activeCount = Object.values(enabledMap).filter(Boolean).length;

  function toggleTool(id: string) {
    setEnabledMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white">Tool Manager</h1>
              <Badge variant="neon" className="text-xs">{activeCount} Active</Badge>
            </div>
            <p className="text-white/40 text-sm">Manage tools available to your AI agents.</p>
          </div>
          <Button variant="neon" size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add Tool
          </Button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Tools", value: TOOLS.length, color: "text-white" },
          { label: "Active", value: TOOLS.filter((t) => t.status === "active").length, color: "text-green-400" },
          { label: "Inactive", value: TOOLS.filter((t) => t.status === "inactive").length, color: "text-white/40" },
          { label: "Errors", value: TOOLS.filter((t) => t.status === "error").length, color: "text-red-400" },
        ].map((stat) => (
          <Card key={stat.label} glass>
            <CardContent className="p-4">
              <p className="text-xs text-white/40">{stat.label}</p>
              <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Input
          placeholder="Search tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="sm:max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                categoryFilter === cat
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-white/10 text-white/40 hover:text-white/60"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tool Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((tool, i) => {
          const Icon = tool.icon;
          const statusCfg = STATUS_CONFIG[tool.status];
          const isEnabled = enabledMap[tool.id];

          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <Card
                glass
                className={`h-full transition-all ${
                  isEnabled ? "border-white/10" : "opacity-60 border-white/5"
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Icon className={`w-5 h-5 ${tool.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{tool.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
                          <Badge variant={statusCfg.variant} className="text-[10px]">
                            {statusCfg.label}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {tool.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleTool(tool.id)}
                      className="flex-shrink-0 text-white/40 hover:text-primary transition-colors"
                      aria-label={isEnabled ? "Disable tool" : "Enable tool"}
                    >
                      {isEnabled ? (
                        <ToggleRight className="w-6 h-6 text-primary" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-white/50 leading-relaxed mb-4">
                    {tool.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-white/30">
                    <span>{tool.usageCount.toLocaleString()} uses</span>
                    <span>Last: {tool.lastUsed}</span>
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                    {tool.requiresConfig && (
                      <Button variant="outline" size="sm" className="flex-1 text-xs gap-1">
                        <Settings className="w-3 h-3" /> Configure
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="flex-1 text-xs gap-1">
                      <ChevronRight className="w-3 h-3" /> Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-white/30">
          <Wrench className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No tools match your search.</p>
        </div>
      )}
    </div>
  );
}
