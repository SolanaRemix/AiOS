"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FolderOpen,
  Bot,
  Zap,
  DollarSign,
  Plus,
  ArrowRight,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Cpu,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { UsageChart } from "@/components/dashboard/UsageChart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";

// Mock data
const STATS = [
  {
    title: "Total Projects",
    value: "24",
    delta: 12,
    deltaLabel: "vs last month",
    icon: FolderOpen,
    neonColor: "cyan" as const,
  },
  {
    title: "Active Agents",
    value: "9/9",
    delta: 0,
    deltaLabel: "all running",
    icon: Bot,
    neonColor: "purple" as const,
  },
  {
    title: "API Calls Today",
    value: "12,412",
    delta: 34,
    deltaLabel: "vs yesterday",
    icon: Zap,
    neonColor: "pink" as const,
  },
  {
    title: "Monthly Cost",
    value: "$142.50",
    delta: -18,
    deltaLabel: "vs last month",
    icon: DollarSign,
    neonColor: "green" as const,
  },
];

const CHART_DATA = [
  { date: "Nov 1", tokens: 420, cost: 4.2, calls: 1200 },
  { date: "Nov 5", tokens: 580, cost: 5.8, calls: 1800 },
  { date: "Nov 10", tokens: 390, cost: 3.9, calls: 900 },
  { date: "Nov 15", tokens: 850, cost: 8.5, calls: 2400 },
  { date: "Nov 20", tokens: 620, cost: 6.2, calls: 1700 },
  { date: "Nov 25", tokens: 940, cost: 9.4, calls: 2900 },
  { date: "Nov 30", tokens: 1100, cost: 11.0, calls: 3200 },
];

const ACTIVITIES = [
  {
    id: "1",
    type: "agent_task_completed",
    icon: CheckCircle,
    color: "text-green-400",
    description: "Code Generator completed task",
    detail: "Generated React component for project Alpha",
    time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    type: "deployment",
    icon: Zap,
    color: "text-primary",
    description: "Deployment succeeded",
    detail: "Project Beta deployed to production",
    time: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    type: "agent_error",
    icon: AlertCircle,
    color: "text-red-400",
    description: "Agent encountered an error",
    detail: "Debugger: Rate limit exceeded on OpenAI",
    time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    type: "project_created",
    icon: FolderOpen,
    color: "text-secondary",
    description: "New project created",
    detail: "Project Gamma initialized with TypeScript",
    time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    type: "api_key_created",
    icon: Clock,
    color: "text-yellow-400",
    description: "API key generated",
    detail: "Production API key for CI/CD pipeline",
    time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
];

const QUICK_ACTIONS = [
  { label: "New Project", href: "/dashboard/projects", icon: FolderOpen, color: "text-primary" },
  { label: "View Agents", href: "/dashboard/agents", icon: Bot, color: "text-secondary" },
  { label: "Switch Model", href: "/dashboard/models", icon: Cpu, color: "text-accent" },
  { label: "View Billing", href: "/dashboard/billing", icon: DollarSign, color: "text-green-400" },
];

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard</h1>
          <p className="text-white/40 text-sm mt-0.5">
            Welcome back. Here&apos;s what&apos;s happening with your AI platform.
          </p>
        </div>
        <Link href="/dashboard/projects">
          <Button variant="neon" size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            New Project
          </Button>
        </Link>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STATS.map((stat, i) => (
          <StatsCard key={stat.title} {...stat} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card glass>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Token & Cost Usage</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Nov 2024</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <UsageChart
                data={CHART_DATA}
                type="area"
                dataKeys={[
                  { key: "tokens", color: "#00f5ff", label: "Tokens (K)" },
                  { key: "cost", color: "#7c3aed", label: "Cost ($)" },
                ]}
                height={260}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card glass>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/8">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Icon className={`w-4 h-4 ${action.color}`} />
                      </div>
                      <span className="text-sm text-white/70 group-hover:text-white/90 flex-1 transition-colors">
                        {action.label}
                      </span>
                      <ArrowRight className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card glass>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-white/40">
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {ACTIVITIES.map((activity, i) => {
                const Icon = activity.icon;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/3 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80">{activity.description}</p>
                      <p className="text-xs text-white/40 mt-0.5 truncate">{activity.detail}</p>
                    </div>
                    <span className="text-xs text-white/25 flex-shrink-0 mt-0.5">
                      {formatRelativeTime(activity.time)}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
