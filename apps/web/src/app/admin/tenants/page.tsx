"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Ban,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tenant } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const MOCK_TENANTS: Tenant[] = [
  {
    id: "t1",
    name: "TechNova Inc",
    slug: "technova",
    plan: "enterprise",
    status: "active",
    userCount: 45,
    projectCount: 18,
    apiCallsThisMonth: 245000,
    costThisMonth: 599,
    createdAt: "2024-01-15T00:00:00Z",
    settings: { allowedModels: ["gpt-4o", "claude-3-5-sonnet"], maxProjects: 999, maxAgents: 9, monthlyTokenLimit: 999999999 },
  },
  {
    id: "t2",
    name: "StartupX Labs",
    slug: "startupx",
    plan: "pro",
    status: "active",
    userCount: 12,
    projectCount: 8,
    apiCallsThisMonth: 89000,
    costThisMonth: 49,
    createdAt: "2024-03-20T00:00:00Z",
    settings: { allowedModels: ["gpt-4o", "claude-3-5-sonnet", "gemini-pro-1.5"], maxProjects: 999, maxAgents: 9, monthlyTokenLimit: 10000000 },
  },
  {
    id: "t3",
    name: "DataCorp AI",
    slug: "datacorp",
    plan: "enterprise",
    status: "active",
    userCount: 78,
    projectCount: 31,
    apiCallsThisMonth: 534000,
    costThisMonth: 999,
    createdAt: "2023-11-05T00:00:00Z",
    settings: { allowedModels: ["gpt-4o", "claude-3-5-sonnet", "gemini-pro-1.5"], maxProjects: 999, maxAgents: 9, monthlyTokenLimit: 999999999 },
  },
  {
    id: "t4",
    name: "DevStream Co",
    slug: "devstream",
    plan: "pro",
    status: "active",
    userCount: 8,
    projectCount: 5,
    apiCallsThisMonth: 45000,
    costThisMonth: 49,
    createdAt: "2024-06-01T00:00:00Z",
    settings: { allowedModels: ["gpt-4o"], maxProjects: 999, maxAgents: 9, monthlyTokenLimit: 10000000 },
  },
  {
    id: "t5",
    name: "CloudBase Inc",
    slug: "cloudbase",
    plan: "free",
    status: "trial",
    userCount: 3,
    projectCount: 2,
    apiCallsThisMonth: 5000,
    costThisMonth: 0,
    createdAt: "2024-11-20T00:00:00Z",
    settings: { allowedModels: ["gpt-4o"], maxProjects: 3, maxAgents: 2, monthlyTokenLimit: 100000 },
  },
  {
    id: "t6",
    name: "Legacy Systems Ltd",
    slug: "legacysys",
    plan: "pro",
    status: "suspended",
    userCount: 22,
    projectCount: 11,
    apiCallsThisMonth: 0,
    costThisMonth: 0,
    createdAt: "2024-02-10T00:00:00Z",
    settings: { allowedModels: ["gpt-4o"], maxProjects: 999, maxAgents: 9, monthlyTokenLimit: 10000000 },
  },
];

export default function TenantsPage() {
  const [tenants, setTenants] = useState(MOCK_TENANTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === "all" || t.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  const suspendTenant = (id: string) => {
    setTenants(ts => ts.map(t => t.id === id ? { ...t, status: "suspended" as const } : t));
    toast.success("Tenant suspended");
    setOpenMenuId(null);
  };

  const activateTenant = (id: string) => {
    setTenants(ts => ts.map(t => t.id === id ? { ...t, status: "active" as const } : t));
    toast.success("Tenant activated");
    setOpenMenuId(null);
  };

  const deleteTenant = (id: string) => {
    setTenants(ts => ts.filter(t => t.id !== id));
    toast.success("Tenant deleted");
    setOpenMenuId(null);
  };

  const planColors: Record<string, string> = {
    free: "outline",
    pro: "neon",
    enterprise: "neon-purple",
  };

  const statusColors: Record<string, string> = {
    active: "success",
    suspended: "destructive",
    trial: "warning",
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Tenant Management</h1>
          <p className="text-white/40 text-sm mt-0.5">{tenants.length} total tenants</p>
        </div>
        <Button variant="neon" size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Create Tenant
        </Button>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search tenants..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["all", "free", "pro", "enterprise"].map((p) => (
            <button
              key={p}
              onClick={() => setPlanFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                planFilter === p
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-white/40 border border-white/8 hover:text-white/70"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: tenants.length, color: "text-white" },
          { label: "Active", value: tenants.filter(t => t.status === "active").length, color: "text-green-400" },
          { label: "Enterprise", value: tenants.filter(t => t.plan === "enterprise").length, color: "text-secondary" },
          { label: "Suspended", value: tenants.filter(t => t.status === "suspended").length, color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tenants Table */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Users</th>
                  <th>Projects</th>
                  <th>API Calls</th>
                  <th>Revenue</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {tenant.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white/90">{tenant.name}</p>
                          <p className="text-xs text-white/30 font-mono">{tenant.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={(planColors[tenant.plan] || "outline") as "neon" | "neon-purple" | "outline"} className="text-[10px] capitalize">
                        {tenant.plan}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={(statusColors[tenant.status] || "outline") as "success" | "destructive" | "warning"} className="text-[10px] capitalize">
                        {tenant.status}
                      </Badge>
                    </td>
                    <td className="text-white/60 text-sm">{tenant.userCount}</td>
                    <td className="text-white/60 text-sm">{tenant.projectCount}</td>
                    <td className="text-white/60 text-sm">{tenant.apiCallsThisMonth.toLocaleString()}</td>
                    <td className="text-green-400 font-semibold text-sm">
                      {tenant.costThisMonth > 0 ? formatCurrency(tenant.costThisMonth) : "-"}
                    </td>
                    <td className="text-white/40 text-xs">{formatDate(tenant.createdAt)}</td>
                    <td>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === tenant.id ? null : tenant.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === tenant.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 glass-card rounded-lg border border-white/10 shadow-glass-lg z-20 overflow-hidden">
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/60 hover:bg-white/5 hover:text-white">
                              <Eye className="w-3.5 h-3.5" /> View Details
                            </button>
                            <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/60 hover:bg-white/5 hover:text-white">
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            {tenant.status === "active" ? (
                              <button
                                onClick={() => suspendTenant(tenant.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-yellow-400 hover:bg-yellow-500/5"
                              >
                                <Ban className="w-3.5 h-3.5" /> Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => activateTenant(tenant.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-green-400 hover:bg-green-500/5"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Activate
                              </button>
                            )}
                            <button
                              onClick={() => deleteTenant(tenant.id)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/5"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
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
