"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Key,
  Users,
  Bell,
  Save,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  Mail,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiKey, TeamMember } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "team", label: "Team", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const MOCK_API_KEYS: ApiKey[] = [
  {
    id: "1",
    name: "Production API Key",
    key: "aios_prod_xxxx...xxxx",
    lastUsed: "2024-11-30T12:00:00Z",
    createdAt: "2024-10-01T00:00:00Z",
    permissions: ["read", "write", "deploy"],
    isActive: true,
  },
  {
    id: "2",
    name: "CI/CD Pipeline",
    key: "aios_ci_xxxx...xxxx",
    lastUsed: "2024-11-29T18:30:00Z",
    createdAt: "2024-11-01T00:00:00Z",
    permissions: ["read", "write"],
    isActive: true,
  },
  {
    id: "3",
    name: "Dev Environment",
    key: "aios_dev_xxxx...xxxx",
    createdAt: "2024-11-15T00:00:00Z",
    permissions: ["read"],
    isActive: false,
  },
];

const MOCK_TEAM: TeamMember[] = [
  {
    id: "1",
    userId: "u1",
    name: "Sarah Johnson",
    email: "sarah@company.com",
    role: "admin",
    status: "active",
    joinedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "2",
    userId: "u2",
    name: "Mike Chen",
    email: "mike@company.com",
    role: "developer",
    status: "active",
    joinedAt: "2024-03-20T00:00:00Z",
  },
  {
    id: "3",
    userId: "u3",
    name: "Emma Wilson",
    email: "emma@company.com",
    role: "viewer",
    status: "pending",
    joinedAt: "2024-11-28T00:00:00Z",
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [apiKeys, setApiKeys] = useState(MOCK_API_KEYS);
  const [team, setTeam] = useState(MOCK_TEAM);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "John Smith",
      email: "john@company.com",
      company: "Acme Corp",
    },
  });

  const onSaveProfile = async (data: ProfileForm) => {
    await new Promise(r => setTimeout(r, 500));
    toast.success("Profile updated successfully");
  };

  const copyKey = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(id);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  const revokeKey = (id: string) => {
    setApiKeys(keys => keys.map(k => k.id === id ? { ...k, isActive: false } : k));
    toast.success("API key revoked");
  };

  const roleColors: Record<string, string> = {
    admin: "neon-purple",
    developer: "neon",
    viewer: "outline",
    super_admin: "destructive",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-white/40 text-sm mt-0.5">Manage your account and team settings</p>
      </motion.div>

      <div className="flex gap-1 bg-white/3 border border-white/8 rounded-xl p-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card glass>
            <CardHeader>
              <CardTitle className="text-base">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-black text-white">
                  JS
                </div>
                <div>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                  <p className="text-xs text-white/30 mt-1">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    leftIcon={<User className="w-4 h-4" />}
                    error={errors.name?.message}
                    {...register("name")}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    leftIcon={<Mail className="w-4 h-4" />}
                    error={errors.email?.message}
                    {...register("email")}
                  />
                </div>
                <Input
                  label="Company"
                  leftIcon={<Shield className="w-4 h-4" />}
                  {...register("company")}
                />
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Bio</label>
                  <textarea
                    placeholder="Tell us about yourself..."
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-primary/30 resize-none"
                    {...register("bio")}
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="neon" loading={isSubmitting} className="gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card glass className="mt-5">
            <CardHeader>
              <CardTitle className="text-base text-red-400">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-red-500/10 rounded-lg bg-red-500/3">
                <div>
                  <p className="text-sm font-medium text-white/90">Delete Account</p>
                  <p className="text-xs text-white/40">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* API Keys Tab */}
      {activeTab === "api-keys" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card glass>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">API Keys</CardTitle>
                <Button variant="neon" size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  New Key
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {apiKeys.map((key) => (
                <div key={key.id} className={cn(
                  "glass-card rounded-xl p-4 transition-all",
                  !key.isActive && "opacity-50"
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white/90 text-sm">{key.name}</span>
                        <Badge variant={key.isActive ? "success" : "outline"} className="text-[10px]">
                          {key.isActive ? "Active" : "Revoked"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">
                          {showKey === key.id ? key.key : "aios_••••••••••••••••••••••"}
                        </code>
                        <button
                          onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                          className="text-white/30 hover:text-white/60 transition-colors"
                        >
                          {showKey === key.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                        <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                        {key.lastUsed && (
                          <span>Last used {new Date(key.lastUsed).toLocaleDateString()}</span>
                        )}
                        {key.permissions.map((p) => (
                          <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => copyKey(key.key, key.id)}
                      >
                        {copied === key.id ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      {key.isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-red-400 hover:text-red-300"
                          onClick={() => revokeKey(key.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Team Tab */}
      {activeTab === "team" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card glass>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Team Members</CardTitle>
                <Button variant="neon" size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Invite
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {team.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary/30 to-primary/30 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {member.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/90">{member.name}</p>
                      <p className="text-xs text-white/40">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={(roleColors[member.role] || "outline") as "neon" | "neon-purple" | "outline"} className="text-[10px] capitalize">
                        {member.role}
                      </Badge>
                      <Badge variant={member.status === "active" ? "success" : "warning"} className="text-[10px] capitalize">
                        {member.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-red-400/50 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card glass>
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Agent task completed", description: "When an AI agent finishes a task", enabled: true },
                { label: "Agent errors", description: "When an agent encounters an error", enabled: true },
                { label: "Deployment status", description: "Success or failure of deployments", enabled: true },
                { label: "Usage alerts", description: "When usage exceeds 80% of limits", enabled: true },
                { label: "New model available", description: "When new LLM models are added", enabled: false },
                { label: "Team activity", description: "When team members join or make changes", enabled: false },
                { label: "Weekly digest", description: "Summary of activity and usage", enabled: true },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm text-white/80">{pref.label}</p>
                    <p className="text-xs text-white/40">{pref.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={pref.enabled} className="sr-only peer" />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary/60" />
                  </label>
                </div>
              ))}
              <Button variant="neon" size="sm" className="gap-2 mt-2">
                <Save className="w-3.5 h-3.5" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
