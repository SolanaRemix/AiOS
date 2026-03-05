"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Code2,
  Terminal,
  Webhook,
  BookOpen,
  Copy,
  CheckCheck,
  ExternalLink,
  ChevronRight,
  Key,
  Zap,
  Globe,
  FileCode2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const REST_ENDPOINTS = [
  { method: "GET", path: "/api/v1/agents", description: "List all agents", tag: "Agents" },
  { method: "POST", path: "/api/v1/agents", description: "Create a new agent", tag: "Agents" },
  { method: "GET", path: "/api/v1/agents/:id", description: "Get agent by ID", tag: "Agents" },
  { method: "DELETE", path: "/api/v1/agents/:id", description: "Delete an agent", tag: "Agents" },
  { method: "POST", path: "/api/v1/agents/:id/run", description: "Run agent task", tag: "Agents" },
  { method: "GET", path: "/api/v1/tools", description: "List available tools", tag: "Tools" },
  { method: "POST", path: "/api/v1/memory/search", description: "Search memory entries", tag: "Memory" },
  { method: "DELETE", path: "/api/v1/memory", description: "Clear all memory", tag: "Memory" },
  { method: "GET", path: "/api/v1/logs", description: "Fetch system logs", tag: "Logs" },
  { method: "GET", path: "/api/v1/system/status", description: "Get system health", tag: "System" },
];

const SDK_LINKS = [
  { name: "TypeScript / Node.js SDK", icon: FileCode2, href: "#", status: "stable", color: "text-primary" },
  { name: "Python SDK", icon: FileCode2, href: "#", status: "stable", color: "text-secondary" },
  { name: "REST API Reference", icon: BookOpen, href: "#", status: "stable", color: "text-green-400" },
  { name: "WebSocket Events", icon: Globe, href: "#", status: "beta", color: "text-yellow-400" },
  { name: "CLI Reference", icon: Terminal, href: "#", status: "stable", color: "text-pink-400" },
];

const CODE_EXAMPLES: Record<string, string> = {
  "Create Agent": `import { AgentBuilder, AgentRegistry } from '@aios/core';

const registry = new AgentRegistry();

const agent = new AgentBuilder('my-assistant')
  .withName('My Assistant')
  .withModel('gpt-4o')
  .withSystemPrompt('You are a helpful assistant.')
  .withTools(['webSearch', 'calculator'])
  .build();

registry.register(agent);
console.log('Agent registered:', agent.config.id);`,

  "Run Task": `import { AgentRegistry, AgentExecutor } from '@aios/core';

const registry = new AgentRegistry();
const executor = new AgentExecutor();

const agent = registry.get('my-assistant');
if (agent) {
  const result = await executor.execute(
    agent,
    'Summarize the latest AI research papers',
    { correlationId: crypto.randomUUID() },
  );
  console.log(result);
}`,

  "Search Memory": `import { LongTermMemory } from '@aios/core';

const ltm = new LongTermMemory();

// Search for relevant memories (Jaccard similarity)
const results = ltm.search('project requirements', 10);
results.forEach(r => console.log(r.entry.content));`,

  "Webhook Setup": `// Listen to platform events via EventBus
import { EventBus } from '@aios/core';

const bus = new EventBus();

// Subscribe to agent completion events
bus.on('agent:complete', (event) => {
  console.log('Agent completed:', event.payload);
});

// Subscribe to agent error events
bus.on('agent:error', (event) => {
  console.error('Agent error:', event.payload);
});`,
};

const METHOD_COLORS: Record<string, string> = {
  GET: "text-green-400 bg-green-400/10 border-green-400/20",
  POST: "text-primary bg-primary/10 border-primary/20",
  PUT: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  DELETE: "text-red-400 bg-red-400/10 border-red-400/20",
  PATCH: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

export default function DeveloperPage() {
  const [activeExample, setActiveExample] = useState("Create Agent");
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [apiFilter, setApiFilter] = useState("All");

  const tags = ["All", ...Array.from(new Set(REST_ENDPOINTS.map((e) => e.tag)))];
  const filteredEndpoints =
    apiFilter === "All" ? REST_ENDPOINTS : REST_ENDPOINTS.filter((e) => e.tag === apiFilter);

  function copyCode() {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeExample]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-black text-white">Developer Dashboard</h1>
          <Badge variant="neon" className="text-xs">API v1</Badge>
        </div>
        <p className="text-white/40 text-sm">Explore APIs, SDKs, and integration tools.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REST API Explorer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-4"
        >
          <Card glass>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  REST API Endpoints
                </CardTitle>
                <div className="flex items-center gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setApiFilter(tag)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        apiFilter === tag
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-white/10 text-white/40 hover:text-white/60"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {filteredEndpoints.map((ep) => (
                  <div
                    key={`${ep.method}-${ep.path}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0 w-14 text-center ${METHOD_COLORS[ep.method]}`}
                    >
                      {ep.method}
                    </span>
                    <code className="text-xs text-white/70 font-mono flex-1">{ep.path}</code>
                    <span className="text-xs text-white/30 group-hover:text-white/50 transition-colors hidden sm:block">
                      {ep.description}
                    </span>
                    <Badge variant="outline" className="text-[10px] hidden md:flex">
                      {ep.tag}
                    </Badge>
                    <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Code Examples */}
          <Card glass>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-secondary" />
                  Code Examples
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={copyCode}
                >
                  {copied ? (
                    <><CheckCheck className="w-3.5 h-3.5 text-green-400" /> Copied</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy</>
                  )}
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap mt-2">
                {Object.keys(CODE_EXAMPLES).map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setActiveExample(ex)}
                    className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                      activeExample === ex
                        ? "border-secondary/50 bg-secondary/10 text-secondary"
                        : "border-white/10 text-white/40 hover:text-white/60"
                    }`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-black/40 border border-white/5 rounded-lg p-4 overflow-x-auto text-xs text-white/70 font-mono leading-relaxed">
                <code>{CODE_EXAMPLES[activeExample]}</code>
              </pre>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar: SDK Links + Webhook Config */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* API Key */}
          <Card glass neon>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                Your API Key
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="password"
                value="aios_sk_••••••••••••••••4f2a"
                readOnly
                className="font-mono text-xs"
              />
              <div className="flex gap-2">
                <Button variant="neon" size="sm" className="flex-1 text-xs gap-1.5">
                  <Copy className="w-3 h-3" /> Copy
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  Regenerate
                </Button>
              </div>
              <p className="text-xs text-white/30">
                Keep your API key secret. Rotate it if compromised.
              </p>
            </CardContent>
          </Card>

          {/* SDK Documentation Links */}
          <Card glass>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-secondary" />
                SDK & Docs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {SDK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <Icon className={`w-4 h-4 ${link.color} flex-shrink-0`} />
                    <span className="text-sm text-white/70 group-hover:text-white/90 flex-1 transition-colors">
                      {link.name}
                    </span>
                    <Badge
                      variant={link.status === "stable" ? "success" : "warning"}
                      className="text-[10px]"
                    >
                      {link.status}
                    </Badge>
                    <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors" />
                  </a>
                );
              })}
            </CardContent>
          </Card>

          {/* Webhook Configuration */}
          <Card glass>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Webhook className="w-4 h-4 text-pink-400" />
                Webhook Config
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                label="Endpoint URL"
                placeholder="https://your-app.com/webhooks"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <div className="space-y-2">
                <p className="text-xs text-white/50 font-medium">Events</p>
                {["agent.task.completed", "agent.error", "system.alert"].map((ev) => (
                  <label key={ev} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      defaultChecked={ev !== "system.alert"}
                      className="rounded border-white/20 bg-white/5 accent-cyan-400"
                    />
                    <span className="text-xs text-white/60 font-mono group-hover:text-white/80 transition-colors">
                      {ev}
                    </span>
                  </label>
                ))}
              </div>
              <Button variant="neon" size="sm" className="w-full gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Save Webhook
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
