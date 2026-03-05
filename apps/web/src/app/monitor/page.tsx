"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Cpu,
  MemoryStick,
  Bot,
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Server,
  Database,
  Globe,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HealthService {
  name: string;
  status: "healthy" | "degraded" | "down";
  uptime: string;
  latency: string;
  icon: React.ElementType;
}

const SERVICES: HealthService[] = [
  { name: "API Server", status: "healthy", uptime: "99.99%", latency: "42ms", icon: Server },
  { name: "Database (PG)", status: "healthy", uptime: "99.98%", latency: "8ms", icon: Database },
  { name: "Redis Cache", status: "healthy", uptime: "100%", latency: "2ms", icon: Database },
  { name: "AI Agent Pool", status: "healthy", uptime: "99.95%", latency: "1.2s", icon: Bot },
  { name: "LLM Router", status: "degraded", uptime: "98.12%", latency: "3.4s", icon: Activity },
  { name: "WebSocket", status: "healthy", uptime: "99.97%", latency: "12ms", icon: Globe },
  { name: "Memory Store", status: "healthy", uptime: "99.99%", latency: "18ms", icon: MemoryStick },
  { name: "Webhook Service", status: "down", uptime: "92.34%", latency: "—", icon: Zap },
];

const RECENT_EVENTS = [
  { id: "ev-1", type: "alert", icon: AlertTriangle, color: "text-yellow-400", message: "LLM Router latency spike: 3.4s avg (threshold: 2s)", time: "2m ago" },
  { id: "ev-2", type: "success", icon: CheckCircle, color: "text-green-400", message: "Auto-scaling event: agent pool scaled up to 12 instances", time: "8m ago" },
  { id: "ev-3", type: "error", icon: XCircle, color: "text-red-400", message: "Webhook Service health check failed — restarting container", time: "15m ago" },
  { id: "ev-4", type: "info", icon: Activity, color: "text-primary", message: "Database backup completed successfully (size: 2.4 GB)", time: "1h ago" },
  { id: "ev-5", type: "info", icon: CheckCircle, color: "text-green-400", message: "SSL certificate renewed — expires in 89 days", time: "2h ago" },
  { id: "ev-6", type: "alert", icon: AlertTriangle, color: "text-yellow-400", message: "Memory usage at 78% — approaching warning threshold", time: "3h ago" },
];

const STATUS_CONFIG = {
  healthy: { label: "Healthy", badge: "success" as const, dot: "bg-green-400 shadow-[0_0_8px_#4ade80]" },
  degraded: { label: "Degraded", badge: "warning" as const, dot: "bg-yellow-400 shadow-[0_0_8px_#facc15]" },
  down: { label: "Down", badge: "destructive" as const, dot: "bg-red-400 shadow-[0_0_8px_#f87171] animate-pulse" },
};

function MetricBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

export default function MonitorPage() {
  const [cpuUsage, setCpuUsage] = useState(42);
  const [memUsage, setMemUsage] = useState(68);
  const [reqPerMin, setReqPerMin] = useState(1847);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setCpuUsage((v) => Math.max(10, Math.min(95, v + (Math.random() - 0.5) * 8)));
      setMemUsage((v) => Math.max(30, Math.min(92, v + (Math.random() - 0.5) * 4)));
      setReqPerMin((v) => Math.max(500, Math.min(5000, v + Math.floor((Math.random() - 0.5) * 200))));
      setLastUpdated(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const healthyCount = SERVICES.filter((s) => s.status === "healthy").length;
  const degradedCount = SERVICES.filter((s) => s.status === "degraded").length;
  const downCount = SERVICES.filter((s) => s.status === "down").length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white">System Monitor</h1>
              {downCount > 0 ? (
                <Badge variant="destructive" className="text-xs">{downCount} Down</Badge>
              ) : degradedCount > 0 ? (
                <Badge variant="warning" className="text-xs">{degradedCount} Degraded</Badge>
              ) : (
                <Badge variant="success" className="text-xs">All Healthy</Badge>
              )}
            </div>
            <p className="text-white/40 text-sm">
              Real-time system health and performance metrics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30">
              Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <Button
              variant={autoRefresh ? "neon" : "outline"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setAutoRefresh((v) => !v)}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? "animate-spin [animation-duration:3s]" : ""}`} />
              {autoRefresh ? "Live" : "Paused"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: "CPU Usage",
            value: `${cpuUsage.toFixed(1)}%`,
            sub: "8 cores · 3.2 GHz",
            icon: Cpu,
            color: cpuUsage > 80 ? "text-red-400" : cpuUsage > 60 ? "text-yellow-400" : "text-primary",
            barColor: cpuUsage > 80 ? "bg-red-400" : cpuUsage > 60 ? "bg-yellow-400" : "bg-primary",
            barValue: cpuUsage,
            trend: cpuUsage > 60 ? "up" : "stable",
          },
          {
            label: "Memory Usage",
            value: `${memUsage.toFixed(1)}%`,
            sub: `${((memUsage / 100) * 32).toFixed(1)} / 32 GB`,
            icon: MemoryStick,
            color: memUsage > 85 ? "text-red-400" : memUsage > 70 ? "text-yellow-400" : "text-secondary",
            barColor: memUsage > 85 ? "bg-red-400" : memUsage > 70 ? "bg-yellow-400" : "bg-secondary",
            barValue: memUsage,
            trend: memUsage > 70 ? "up" : "stable",
          },
          {
            label: "Active Agents",
            value: "7/9",
            sub: "2 idle · 0 errors",
            icon: Bot,
            color: "text-pink-400",
            barColor: "bg-pink-400",
            barValue: (7 / 9) * 100,
            trend: "stable",
          },
          {
            label: "Requests / min",
            value: reqPerMin.toLocaleString(),
            sub: "~30.8 req/s",
            icon: Zap,
            color: "text-green-400",
            barColor: "bg-green-400",
            barValue: (reqPerMin / 5000) * 100,
            trend: "up",
          },
        ].map((metric, i) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === "up" ? TrendingUp : metric.trend === "down" ? TrendingDown : Minus;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <Card glass>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                      <Icon className={`w-4.5 h-4.5 ${metric.color}`} />
                    </div>
                    <TrendIcon className={`w-4 h-4 ${
                      metric.trend === "up" ? "text-yellow-400" :
                      metric.trend === "down" ? "text-green-400" : "text-white/20"
                    }`} />
                  </div>
                  <p className={`text-2xl font-black ${metric.color}`}>{metric.value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{metric.label}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">{metric.sub}</p>
                  <div className="mt-3">
                    <MetricBar value={metric.barValue} color={metric.barColor} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card glass>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" />
                  Service Health
                </CardTitle>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-green-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    {healthyCount} healthy
                  </span>
                  {degradedCount > 0 && (
                    <span className="flex items-center gap-1.5 text-yellow-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      {degradedCount} degraded
                    </span>
                  )}
                  {downCount > 0 && (
                    <span className="flex items-center gap-1.5 text-red-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      {downCount} down
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SERVICES.map((svc) => {
                  const Icon = svc.icon;
                  const cfg = STATUS_CONFIG[svc.status];
                  return (
                    <div
                      key={svc.name}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-white/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 font-medium truncate">{svc.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-white/30">{svc.uptime} uptime</span>
                          <span className="text-xs text-white/20">·</span>
                          <span className="text-xs text-white/30">{svc.latency}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        <Badge variant={cfg.badge} className="text-[10px]">
                          {cfg.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card glass>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-secondary" />
                Recent Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {RECENT_EVENTS.map((event) => {
                  const Icon = event.icon;
                  return (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className={`w-3.5 h-3.5 ${event.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/70 leading-relaxed">{event.message}</p>
                        <p className="text-[10px] text-white/25 mt-1">{event.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
