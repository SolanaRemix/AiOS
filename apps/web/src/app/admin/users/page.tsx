"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, UserRole } from "@/types";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

const MOCK_USERS: (User & { tenantName: string })[] = [
  { id: "u1", email: "sarah@technova.com", name: "Sarah Johnson", role: "admin", tenantId: "t1", tenantName: "TechNova Inc", createdAt: "2024-01-15T00:00:00Z", lastLoginAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), updatedAt: "" },
  { id: "u2", email: "mike@technova.com", name: "Mike Chen", role: "developer", tenantId: "t1", tenantName: "TechNova Inc", createdAt: "2024-02-20T00:00:00Z", lastLoginAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), updatedAt: "" },
  { id: "u3", email: "john@startupx.io", name: "John Smith", role: "admin", tenantId: "t2", tenantName: "StartupX Labs", createdAt: "2024-03-20T00:00:00Z", lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), updatedAt: "" },
  { id: "u4", email: "emma@datacorp.ai", name: "Emma Wilson", role: "developer", tenantId: "t3", tenantName: "DataCorp AI", createdAt: "2023-11-05T00:00:00Z", lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), updatedAt: "" },
  { id: "u5", email: "alex@devstream.co", name: "Alex Brown", role: "viewer", tenantId: "t4", tenantName: "DevStream Co", createdAt: "2024-06-01T00:00:00Z", lastLoginAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: "" },
  { id: "u6", email: "admin@aios.ai", name: "AIOS Admin", role: "super_admin", tenantId: "system", tenantName: "System", createdAt: "2023-01-01T00:00:00Z", lastLoginAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(), updatedAt: "" },
  { id: "u7", email: "dev@cloudbase.io", name: "Chris Taylor", role: "developer", tenantId: "t5", tenantName: "CloudBase Inc", createdAt: "2024-11-20T00:00:00Z", lastLoginAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), updatedAt: "" },
  { id: "u8", email: "pm@technova.com", name: "Lisa Park", role: "viewer", tenantId: "t1", tenantName: "TechNova Inc", createdAt: "2024-04-10T00:00:00Z", lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: "" },
];

const ROLES: UserRole[] = ["super_admin", "admin", "developer", "viewer"];

const roleConfig: Record<UserRole, { label: string; variant: string; color: string }> = {
  super_admin: { label: "Super Admin", variant: "destructive", color: "text-red-400" },
  admin: { label: "Admin", variant: "neon-purple", color: "text-secondary" },
  developer: { label: "Developer", variant: "neon", color: "text-primary" },
  viewer: { label: "Viewer", variant: "outline", color: "text-white/50" },
};

export default function UsersPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.tenantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const changeRole = (userId: string, newRole: UserRole) => {
    setUsers(us => us.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast.success(`Role updated to ${newRole}`);
    setEditingRole(null);
  };

  const deleteUser = (id: string) => {
    setUsers(us => us.filter(u => u.id !== id));
    toast.success("User deleted");
    setOpenMenuId(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">User Management</h1>
          <p className="text-white/40 text-sm mt-0.5">{users.length} total users across all tenants</p>
        </div>
        <Button variant="neon" size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Invite User
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: users.length, color: "text-white" },
          { label: "Admins", value: users.filter(u => u.role === "admin" || u.role === "super_admin").length, color: "text-secondary" },
          { label: "Developers", value: users.filter(u => u.role === "developer").length, color: "text-primary" },
          { label: "Viewers", value: users.filter(u => u.role === "viewer").length, color: "text-white/50" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search users, emails, tenants..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["all", ...ROLES].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                roleFilter === r
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-white/40 border border-white/8 hover:text-white/70"
              }`}
            >
              {r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card glass>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Tenant</th>
                  <th>Last Login</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const rc = roleConfig[user.role];
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {user.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white/90">{user.name}</p>
                            <p className="text-xs text-white/40">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        {editingRole === user.id ? (
                          <select
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/80 focus:outline-none focus:border-primary/30"
                            defaultValue={user.role}
                            onChange={(e) => changeRole(user.id, e.target.value as UserRole)}
                            onBlur={() => setEditingRole(null)}
                            autoFocus
                          >
                            {ROLES.map(r => (
                              <option key={r} value={r} className="bg-[#0d0d1a]">{r.replace("_", " ")}</option>
                            ))}
                          </select>
                        ) : (
                          <Badge
                            variant={(rc.variant || "outline") as "destructive" | "neon-purple" | "neon" | "outline"}
                            className="text-[10px] capitalize cursor-pointer"
                            onClick={() => setEditingRole(user.id)}
                          >
                            <Shield className="w-2.5 h-2.5 mr-1" />
                            {rc.label}
                          </Badge>
                        )}
                      </td>
                      <td>
                        <span className="text-sm text-white/60">{user.tenantName}</span>
                      </td>
                      <td className="text-xs text-white/40">
                        {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : "Never"}
                      </td>
                      <td className="text-xs text-white/40">{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === user.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 glass-card rounded-lg border border-white/10 shadow-glass-lg z-20 overflow-hidden">
                              <button
                                onClick={() => { setEditingRole(user.id); setOpenMenuId(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/60 hover:bg-white/5 hover:text-white"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Change Role
                              </button>
                              <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/60 hover:bg-white/5 hover:text-white">
                                <Mail className="w-3.5 h-3.5" /> Send Email
                              </button>
                              <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-yellow-400 hover:bg-yellow-500/5">
                                <UserX className="w-3.5 h-3.5" /> Suspend
                              </button>
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/5"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
