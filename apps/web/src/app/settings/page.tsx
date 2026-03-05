"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Key,
  Bell,
  Shield,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Copy,
  CheckCheck,
  AlertTriangle,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Tab = "profile" | "apikeys" | "notifications" | "security";

const TABS: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
  { id: "profile", label: "Profile", icon: User },
  { id: "apikeys", label: "API Keys", icon: Key },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsed: string;
}

const MOCK_API_KEYS: ApiKey[] = [
  { id: "k1", name: "Production CI/CD", prefix: "aios_sk_prod_4f2a", scopes: ["agents:read", "agents:write", "tools:read"], createdAt: "2024-11-01", lastUsed: "2 min ago" },
  { id: "k2", name: "Local Development", prefix: "aios_sk_dev_9b1c", scopes: ["agents:read", "memory:read"], createdAt: "2024-10-15", lastUsed: "1 day ago" },
  { id: "k3", name: "Analytics Dashboard", prefix: "aios_sk_anl_7d3e", scopes: ["logs:read", "system:read"], createdAt: "2024-09-20", lastUsed: "1 week ago" },
];

function ProfileTab() {
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await new Promise((r) => setTimeout(r, 800));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <Card glass>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-black text-white">
              JD
            </div>
            <div>
              <p className="text-sm font-semibold text-white">John Doe</p>
              <p className="text-xs text-white/40">john@example.com · Developer</p>
              <Button variant="outline" size="sm" className="mt-2 text-xs">
                Change Avatar
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name" defaultValue="John" />
            <Input label="Last Name" defaultValue="Doe" />
          </div>
          <Input label="Email Address" type="email" defaultValue="john@example.com" />
          <Input label="Organization" defaultValue="My Company Inc." />
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Bio</label>
            <textarea
              defaultValue="Full-stack developer passionate about AI and automation."
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <Button variant="neon" className="gap-2" onClick={handleSave}>
        {saved ? <><CheckCheck className="w-4 h-4 text-green-400" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
      </Button>
    </div>
  );
}

function ApiKeysTab() {
  const [keys, setKeys] = useState(MOCK_API_KEYS);
  const [showNew, setShowNew] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function deleteKey(id: string) {
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  function copyKey(id: string) {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-4">
      <Card glass>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">API Keys</CardTitle>
            <Button variant="neon" size="sm" className="gap-1.5 text-xs" onClick={() => setShowNew(true)}>
              <Plus className="w-3.5 h-3.5" /> New Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showNew && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex gap-2 p-3 rounded-lg border border-primary/30 bg-primary/5"
            >
              <Input
                placeholder="Key name (e.g. Staging Server)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1"
              />
              <Button variant="neon" size="sm" onClick={() => setShowNew(false)}>
                Create
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
            </motion.div>
          )}

          {keys.map((key) => (
            <div
              key={key.id}
              className="p-4 rounded-lg border border-white/8 bg-white/3 hover:border-white/12 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{key.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs font-mono text-white/50">
                      {revealedId === key.id ? key.prefix + "••••••••" : "aios_sk_••••••••••••" + key.prefix.slice(-4)}
                    </code>
                    <button
                      onClick={() => setRevealedId(revealedId === key.id ? null : key.id)}
                      className="text-white/30 hover:text-white/60 transition-colors"
                    >
                      {revealedId === key.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => copyKey(key.id)}
                      className="text-white/30 hover:text-white/60 transition-colors"
                    >
                      {copiedId === key.id ? (
                        <CheckCheck className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400/50 hover:text-red-400 hover:bg-red-400/10 w-8 h-8"
                  onClick={() => deleteKey(key.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-3 mt-3">
                {key.scopes.map((scope) => (
                  <Badge key={scope} variant="outline" className="text-[9px]">{scope}</Badge>
                ))}
                <span className="text-[10px] text-white/25 ml-auto">Last used: {key.lastUsed}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-white/60">
          API keys grant full access to your account. Never share them publicly or commit them to source control. Use environment variables instead.
        </p>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [saved, setSaved] = useState(false);

  const notifGroups = [
    {
      group: "Agent Activity",
      items: [
        { id: "agent_complete", label: "Task completed", defaultChecked: true },
        { id: "agent_error", label: "Agent error or crash", defaultChecked: true },
        { id: "agent_idle", label: "Agent idle for > 1 hour", defaultChecked: false },
      ],
    },
    {
      group: "System",
      items: [
        { id: "sys_alert", label: "System health alerts", defaultChecked: true },
        { id: "sys_deploy", label: "Deployment events", defaultChecked: true },
        { id: "sys_backup", label: "Backup completed", defaultChecked: false },
      ],
    },
    {
      group: "Billing",
      items: [
        { id: "bill_limit", label: "Usage limit warnings (80%/100%)", defaultChecked: true },
        { id: "bill_invoice", label: "Monthly invoice ready", defaultChecked: true },
        { id: "bill_trial", label: "Trial expiring soon", defaultChecked: true },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {notifGroups.map((group) => (
        <Card key={group.group} glass>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{group.group}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.items.map((item) => (
              <label key={item.id} className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                  {item.label}
                </span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked={item.defaultChecked} className="accent-cyan-400" />
                    <span className="text-xs text-white/30">Email</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked={false} className="accent-cyan-400" />
                    <span className="text-xs text-white/30">Slack</span>
                  </label>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>
      ))}
      <Button variant="neon" className="gap-2" onClick={async () => { await new Promise(r => setTimeout(r, 600)); setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
        {saved ? <><CheckCheck className="w-4 h-4 text-green-400" /> Saved!</> : <><Save className="w-4 h-4" /> Save Preferences</>}
      </Button>
    </div>
  );
}

function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-4">
      <Card glass>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input
              label="Current Password"
              type={showCurrent ? "text" : "password"}
              placeholder="Enter current password"
              rightIcon={
                <button onClick={() => setShowCurrent((v) => !v)}>
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>
          <Input
            label="New Password"
            type={showNew ? "text" : "password"}
            placeholder="At least 12 characters"
            rightIcon={
              <button onClick={() => setShowNew((v) => !v)}>
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <Input label="Confirm New Password" type="password" placeholder="Repeat new password" />
          <Button
            variant="neon"
            className="gap-2"
            onClick={async () => { await new Promise(r => setTimeout(r, 800)); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          >
            {saved ? <><CheckCheck className="w-4 h-4 text-green-400" /> Updated!</> : <><Save className="w-4 h-4" /> Update Password</>}
          </Button>
        </CardContent>
      </Card>

      <Card glass>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-secondary" />
              Two-Factor Authentication
            </CardTitle>
            <Badge variant="warning" className="text-xs">Not Enabled</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-white/50">
            Add an extra layer of security to your account by enabling TOTP-based two-factor authentication.
          </p>
          <Button variant="neon-purple" size="sm" className="gap-2">
            <Shield className="w-3.5 h-3.5" />
            Enable 2FA
          </Button>
        </CardContent>
      </Card>

      <Card glass>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Active Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { device: "Chrome · macOS", location: "San Francisco, US", current: true, lastSeen: "Now" },
            { device: "Firefox · Windows 11", location: "New York, US", current: false, lastSeen: "2 days ago" },
          ].map((session, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white/40" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/80">
                  {session.device}
                  {session.current && <Badge variant="success" className="ml-2 text-[9px]">Current</Badge>}
                </p>
                <p className="text-xs text-white/30 mt-0.5">{session.location} · {session.lastSeen}</p>
              </div>
              {!session.current && (
                <Button variant="ghost" size="sm" className="text-xs text-red-400/60 hover:text-red-400">
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-red-500/20 bg-red-500/3">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-white/40">
            Once you delete your account, there is no going back. All your data will be permanently removed.
          </p>
          <Button variant="destructive" size="sm" className="gap-2">
            <Trash2 className="w-3.5 h-3.5" />
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const tabContent: Record<Tab, React.ReactNode> = {
    profile: <ProfileTab />,
    apikeys: <ApiKeysTab />,
    notifications: <NotificationsTab />,
    security: <SecurityTab />,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-black text-white">Settings</h1>
        </div>
        <p className="text-white/40 text-sm">Manage your profile, API keys, notifications, and security.</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Tab Nav */}
        <motion.nav
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="sm:w-48 flex-shrink-0"
        >
          <ul className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : "text-white/50 hover:text-white/80 hover:bg-white/5 border-l-2 border-transparent"
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-white/40"}`} />
                    {tab.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.nav>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 min-w-0"
        >
          {tabContent[activeTab]}
        </motion.div>
      </div>
    </div>
  );
}
