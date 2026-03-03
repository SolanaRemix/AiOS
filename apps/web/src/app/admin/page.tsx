"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  DollarSign,
  Zap,
  TrendingUp,
  Server,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { UsageChart } from "@/components/dashboard/UsageChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ADMIN_STATS = [
  { title: "Total Tenants", value: "142", delta: 12, deltaLabel: "this month", icon: Building2, neonColor: "cyan" as const },
  { title: "Total Users", value: "2,891", delta: 8, deltaLabel: "this month", icon: Users, neonColor: "purple" as const },
  { title: "MRR", value: "$14,250", delta: 23, deltaLabel: "vs last month", icon: DollarSign, neonColor: "green" as const },
  { title: "API Calls Today", value: "1.2M", delta: 15, deltaLabel: "vs yesterday", icon: Zap, neonColor: "pink" as const },
];

const REVENUE_DATA = [
  { date: "Jun", revenue: 8200, tenants: 89, churn: 3 },
  { date: "Jul", revenue: 9500, tenants: 98, churn: 2 },
  { date: "Aug", revenue: 10100, tenants: 108, churn: 4 },
  { date: "Sep", revenue: 11400, tenants: 119, churn: 1 },
  { date: "Oct", revenue: 12800, tenants: 133, churn: 2 },
  { date: "Nov", revenue: 14250, tenants: 142, churn: 3 },
];

const TOP_TENANTS = [
  { name: "TechNova Inc", plan: "enterprise", users: 45, apiCalls: 245000, revenue: 599, status: "active" },
  { name: "StartupX Labs", plan: "pro", users: 12, apiCalls: 89000, revenue: 49, status: "active" },
  { name: "DataCorp AI", plan: "enterprise", users: 78, apiCalls: 534000, revenue: 999, status: "active" },
  { name: "DevStream Co", plan: "pro", users: 8, apiCalls: 45000, revenue: 49, status: "active" },
  { name: "CloudBase Inc", plan: "pro", users: 23, apiCalls: 120000, revenue: 49, status: "trial" },
];

const SYSTEM_HEALTH = [
  { service: "API Server", status: "healthy", uptime: "99.99%", latency: "42ms" },
  { service: "Database", status: "healthy", uptime: "99.98%", latency: "8ms" },
  { service: "AI Agents", status: "healthy", uptime: "99.95%", latency: "1.2s" },
  { service: "LLM Router", status: "degraded", uptime: "98.12%", latency: "3.4s" },
  { service: "WebSocket", status: "healthy", uptime: "99.97%", latency: "12ms" },
];

export default function AdminPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-black text-white">System Administration</h1>
          <Badge variant="destructive" className="text-xs">Super Admin</Badge>
        </div>
        <p className="text-white/40 text-sm">Platform-wide metrics and management</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {ADMIN_STATS.map((stat, i) => (
          <StatsCard key={stat.title} {...stat} index={i} />
        ))}
      </div>

      {/* Revenue Chart + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card glass className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Revenue & Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UsageChart
              data={REVENUE_DATA}
              type="area"
              dataKeys={[
                { key: "revenue", color: "#00ff88", label: "MRR ($)" },
                { key: "tenants", color: "#00f5ff", label: "Tenants" },
              ]}
              height={240}
            />
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {SYSTEM_HEALTH.map((service) => (
              <div key={service.service} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  service.status === "healthy" ? "bg-green-400 shadow-[0_0_6px_#00ff88]" :
                  service.status === "degraded" ? "bg-yellow-400 shadow-[0_0_6px_#facc15]" :
                  "bg-red-400 shadow-[0_0_6px_#f87171]"
                }`} />
                <span className="text-sm text-white/70 flex-1">{service.service}</span>
                <span className="text-xs text-white/30">{service.latency}</span>
                <span className="text-xs text-white/40">{service.uptime}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Tenants */}
      <Card glass>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Top Tenants by Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Plan</th>
                  <th>Users</th>
                  <th>API Calls</th>
                  <th>Revenue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {TOP_TENANTS.map((tenant) => (
                  <tr key={tenant.name}>
                    <td className="font-medium text-white/90">{tenant.name}</td>
                    <td>
                      <Badge
                        variant={tenant.plan === "enterprise" ? "neon-purple" : "neon"}
                        className="text-[10px] capitalize"
                      >
                        {tenant.plan}
                      </Badge>
                    </td>
                    <td className="text-white/60">{tenant.users}</td>
                    <td className="text-white/60">{tenant.apiCalls.toLocaleString()}</td>
                    <td className="text-green-400 font-semibold">${tenant.revenue}/mo</td>
                    <td>
                      <Badge
                        variant={tenant.status === "active" ? "success" : "warning"}
                        className="text-[10px] capitalize"
                      >
                        {tenant.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
