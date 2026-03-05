"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Wand2,
  Settings2,
  ChevronDown,
  Plus,
  Trash2,
  Rocket,
  CheckSquare,
  Square,
  Sparkles,
  Save,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const MODELS = [
  { value: "gpt-4o", label: "GPT-4o", provider: "OpenAI", color: "text-green-400" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI", color: "text-green-400" },
  { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", provider: "Anthropic", color: "text-orange-400" },
  { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", provider: "Anthropic", color: "text-orange-400" },
  { value: "llama-3.3-70b-versatile", label: "LLaMA 3.3 70B", provider: "Groq", color: "text-purple-400" },
  { value: "llama3.2", label: "LLaMA 3.2 (Local)", provider: "Ollama", color: "text-primary" },
];

const AVAILABLE_TOOLS = [
  { id: "web_search", label: "Web Search", description: "Search the internet for information" },
  { id: "calculator", label: "Calculator", description: "Perform mathematical calculations" },
  { id: "code_execution", label: "Code Execution", description: "Run Python code snippets" },
  { id: "file_operations", label: "File Operations", description: "Read and write files" },
  { id: "date_time", label: "Date & Time", description: "Get current date and time info" },
  { id: "memory_search", label: "Memory Search", description: "Query long-term memory store" },
  { id: "weather", label: "Weather", description: "Fetch weather forecasts" },
  { id: "http_request", label: "HTTP Request", description: "Make arbitrary HTTP calls" },
];

const EXAMPLE_AGENTS = [
  { name: "Research Assistant", model: "gpt-4o", tools: ["web_search", "memory_search"] },
  { name: "Code Generator", model: "claude-3-5-sonnet-20241022", tools: ["code_execution", "file_operations"] },
  { name: "Data Analyst", model: "gpt-4o", tools: ["calculator", "code_execution", "file_operations"] },
];

export default function StudioPage() {
  const [agentName, setAgentName] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [temperature, setTemperature] = useState("0.7");
  const [maxTokens, setMaxTokens] = useState("2048");
  const [deployed, setDeployed] = useState(false);
  const [deploying, setDeploying] = useState(false);

  function toggleTool(toolId: string) {
    setSelectedTools((prev) =>
      prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId]
    );
  }

  function loadTemplate(template: typeof EXAMPLE_AGENTS[0]) {
    setAgentName(template.name);
    setSelectedModel(template.model);
    setSelectedTools(template.tools);
    setSystemPrompt(
      `You are ${template.name}. Your role is to assist users effectively using the available tools. Always be concise, accurate, and helpful.`
    );
  }

  async function handleDeploy() {
    if (!agentName || !systemPrompt) return;
    setDeploying(true);
    await new Promise((r) => setTimeout(r, 1800));
    setDeploying(false);
    setDeployed(true);
    setTimeout(() => setDeployed(false), 3000);
  }

  const selectedModelInfo = MODELS.find((m) => m.value === selectedModel);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white">Agent Studio</h1>
              <Badge variant="neon-purple" className="text-xs">Builder</Badge>
            </div>
            <p className="text-white/40 text-sm">Design, configure, and deploy AI agents.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Copy className="w-3.5 h-3.5" /> Duplicate
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <Save className="w-3.5 h-3.5" /> Save Draft
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Builder Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-4"
        >
          {/* Basic Info */}
          <Card glass>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                Agent Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Agent Name"
                placeholder="e.g. Research Assistant"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Model
                </label>
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 hover:border-white/20 transition-colors"
                  >
                    {MODELS.map((m) => (
                      <option key={m.value} value={m.value} className="bg-[#0d0d1a]">
                        {m.label} ({m.provider})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                </div>
                {selectedModelInfo && (
                  <p className={`text-xs mt-1.5 ${selectedModelInfo.color}`}>
                    Provider: {selectedModelInfo.provider}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Temperature"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                />
                <Input
                  label="Max Tokens"
                  type="number"
                  min="256"
                  max="32768"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Prompt */}
          <Card glass>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary" />
                System Prompt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Describe your agent's role, behavior, and constraints. For example: 'You are a helpful coding assistant. Always write clean, well-commented code. Prefer TypeScript. Never expose sensitive information.'"
                rows={8}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 hover:border-white/20 transition-colors resize-y min-h-[160px]"
              />
              <p className="text-xs text-white/30 mt-1.5">
                {systemPrompt.length} characters · Tip: Be specific about tone, format, and limitations.
              </p>
            </CardContent>
          </Card>

          {/* Tools Checklist */}
          <Card glass>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-pink-400" />
                  Available Tools
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {selectedTools.length} selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_TOOLS.map((tool) => {
                  const enabled = selectedTools.includes(tool.id);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                        enabled
                          ? "border-primary/40 bg-primary/5"
                          : "border-white/8 bg-white/3 hover:border-white/15"
                      }`}
                    >
                      {enabled ? (
                        <CheckSquare className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${enabled ? "text-primary" : "text-white/70"}`}>
                          {tool.label}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">{tool.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Deploy Button */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleDeploy}
              disabled={!agentName || !systemPrompt || deploying}
              className="w-full h-12 text-base gap-2"
              variant={deployed ? "default" : "gradient"}
            >
              {deploying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deploying Agent...
                </>
              ) : deployed ? (
                <>
                  <CheckSquare className="w-5 h-5 text-green-400" />
                  Agent Deployed!
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  Deploy Agent
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>

        {/* Templates + Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Templates */}
          <Card glass>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-yellow-400" />
                Quick Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {EXAMPLE_AGENTS.map((tmpl) => (
                <button
                  key={tmpl.name}
                  onClick={() => loadTemplate(tmpl)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg border border-white/8 hover:border-secondary/30 hover:bg-secondary/5 transition-all text-left group"
                >
                  <Bot className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                      {tmpl.name}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {MODELS.find((m) => m.value === tmpl.model)?.label} · {tmpl.tools.length} tools
                    </p>
                  </div>
                </button>
              ))}
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs mt-1">
                <Plus className="w-3.5 h-3.5" />
                Browse All Templates
              </Button>
            </CardContent>
          </Card>

          {/* Agent Preview */}
          <Card glass neon={!!agentName}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                Agent Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Name</span>
                  <span className="text-white/70">{agentName || "—"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Model</span>
                  <span className={selectedModelInfo?.color ?? "text-white/70"}>
                    {selectedModelInfo?.label}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Temperature</span>
                  <span className="text-white/70">{temperature}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Max Tokens</span>
                  <span className="text-white/70">{maxTokens}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Tools</span>
                  <span className="text-white/70">{selectedTools.length} enabled</span>
                </div>
              </div>
              {selectedTools.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedTools.map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px]">
                      {AVAILABLE_TOOLS.find((a) => a.id === t)?.label}
                    </Badge>
                  ))}
                </div>
              )}
              {systemPrompt && (
                <div className="mt-2 p-2.5 rounded-lg bg-white/3 border border-white/5">
                  <p className="text-xs text-white/40 line-clamp-4">{systemPrompt}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-500/20 bg-red-500/3">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-red-400">
                <Trash2 className="w-4 h-4" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" size="sm" className="w-full text-xs">
                Delete Agent
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
