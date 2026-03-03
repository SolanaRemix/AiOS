"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  CheckCircle,
  Clock,
  DollarSign,
  Zap,
  ArrowUpDown,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsageChart } from "@/components/dashboard/UsageChart";
import { LLMModel } from "@/types";
import { cn } from "@/lib/utils";

const MODELS: LLMModel[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    contextWindow: 128000,
    inputCostPer1k: 0.005,
    outputCostPer1k: 0.015,
    avgLatency: 1.8,
    capabilities: ["Vision", "Function Calling", "JSON Mode", "Code"],
    isAvailable: true,
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    contextWindow: 128000,
    inputCostPer1k: 0.01,
    outputCostPer1k: 0.03,
    avgLatency: 2.3,
    capabilities: ["Vision", "Function Calling", "JSON Mode"],
    isAvailable: true,
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    contextWindow: 200000,
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
    avgLatency: 2.1,
    capabilities: ["Vision", "Code", "Long Context", "Artifacts"],
    isAvailable: true,
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    contextWindow: 200000,
    inputCostPer1k: 0.00025,
    outputCostPer1k: 0.00125,
    avgLatency: 0.8,
    capabilities: ["Vision", "Fast", "Code"],
    isAvailable: true,
  },
  {
    id: "gemini-pro-1.5",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    contextWindow: 1000000,
    inputCostPer1k: 0.00125,
    outputCostPer1k: 0.005,
    avgLatency: 3.2,
    capabilities: ["Vision", "1M Context", "Code", "Multimodal"],
    isAvailable: true,
  },
  {
    id: "llama-3.1-70b",
    name: "LLaMA 3.1 70B",
    provider: "Meta (via Groq)",
    contextWindow: 128000,
    inputCostPer1k: 0.00059,
    outputCostPer1k: 0.00079,
    avgLatency: 0.5,
    capabilities: ["Open Source", "Fast", "Code"],
    isAvailable: true,
  },
  {
    id: "mixtral-8x7b",
    name: "Mixtral 8x7B",
    provider: "Mistral AI",
    contextWindow: 32000,
    inputCostPer1k: 0.0006,
    outputCostPer1k: 0.0006,
    avgLatency: 0.7,
    capabilities: ["Open Source", "Code", "Fast"],
    isAvailable: false,
  },
];

const MODEL_USAGE_DATA = [
  { date: "Nov 25", "GPT-4o": 45, "Claude 3.5": 30, "Gemini": 15, "LLaMA": 10 },
  { date: "Nov 26", "GPT-4o": 40, "Claude 3.5": 35, "Gemini": 20, "LLaMA": 5 },
  { date: "Nov 27", "GPT-4o": 55, "Claude 3.5": 28, "Gemini": 12, "LLaMA": 5 },
  { date: "Nov 28", "GPT-4o": 42, "Claude 3.5": 40, "Gemini": 8, "LLaMA": 10 },
  { date: "Nov 29", "GPT-4o": 60, "Claude 3.5": 25, "Gemini": 10, "LLaMA": 5 },
  { date: "Nov 30", "GPT-4o": 48, "Claude 3.5": 32, "Gemini": 15, "LLaMA": 5 },
];

const providerColors: Record<string, string> = {
  OpenAI: "text-green-400 bg-green-400/10 border-green-400/20",
  Anthropic: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  Google: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "Meta (via Groq)": "text-purple-400 bg-purple-400/10 border-purple-400/20",
  "Mistral AI": "text-pink-400 bg-pink-400/10 border-pink-400/20",
};

export default function ModelsPage() {
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [sortBy, setSortBy] = useState<"cost" | "latency" | "context">("cost");

  const sortedModels = [...MODELS].sort((a, b) => {
    if (sortBy === "cost") return a.inputCostPer1k - b.inputCostPer1k;
    if (sortBy === "latency") return a.avgLatency - b.avgLatency;
    return b.contextWindow - a.contextWindow;
  });

  const selected = MODELS.find((m) => m.id === selectedModel);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-white">LLM Federation</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {MODELS.filter((m) => m.isAvailable).length} models available · Auto-routing enabled
          </p>
        </div>
        <Button variant="neon" size="sm" className="gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          Enable Smart Routing
        </Button>
      </motion.div>

      {/* Smart Routing Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-xl p-4 border border-primary/20 bg-primary/3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white/90 text-sm">Smart Model Routing</p>
            <p className="text-xs text-white/50 mt-0.5">
              AIOS automatically selects the best model for each task based on complexity, cost, and latency requirements.
              Currently routing: <span className="text-primary">34% to GPT-4o</span>, <span className="text-orange-400">28% to Claude 3.5</span>, <span className="text-primary">38% to fast models</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="neon" className="whitespace-nowrap">
              <TrendingDown className="w-3 h-3 mr-1" />
              -23% cost
            </Badge>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Model List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/50">Sort by:</span>
            {(["cost", "latency", "context"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all",
                  sortBy === s
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-white/40 border border-white/8 hover:text-white/70"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {sortedModels.map((model, i) => {
              const providerColor = providerColors[model.provider] || "text-white/50 bg-white/5 border-white/10";
              const isSelected = selectedModel === model.id;
              return (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedModel(model.id)}
                  className={cn(
                    "glass-card rounded-xl p-4 cursor-pointer transition-all duration-200",
                    isSelected
                      ? "border-primary/30 bg-primary/3"
                      : "hover:border-white/15",
                    !model.isAvailable && "opacity-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 text-sm font-bold",
                      providerColor
                    )}>
                      {model.provider.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white/90 text-sm">{model.name}</span>
                        <Badge variant="outline" className={cn("text-[10px]", providerColor)}>
                          {model.provider}
                        </Badge>
                        {!model.isAvailable && (
                          <Badge variant="warning" className="text-[10px]">Unavailable</Badge>
                        )}
                        {isSelected && (
                          <Badge variant="neon" className="text-[10px]">
                            <CheckCircle className="w-2.5 h-2.5 mr-1" /> Selected
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${model.inputCostPer1k}/1K in · ${model.outputCostPer1k}/1K out
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {model.avgLatency}s avg
                        </span>
                        <span>{(model.contextWindow / 1000).toFixed(0)}K context</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {model.capabilities.map((cap) => (
                          <Badge key={cap} variant="outline" className="text-[10px] px-1.5 py-0">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-black text-primary">{model.avgLatency}s</p>
                      <p className="text-[10px] text-white/30">avg latency</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Selected Model Details */}
          {selected && (
            <Card glass>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Selected Model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xl font-black text-white">{selected.name}</p>
                  <p className="text-sm text-white/40">{selected.provider}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Input Cost", value: `$${selected.inputCostPer1k}/1K` },
                    { label: "Output Cost", value: `$${selected.outputCostPer1k}/1K` },
                    { label: "Avg Latency", value: `${selected.avgLatency}s` },
                    { label: "Context Window", value: `${(selected.contextWindow / 1000).toFixed(0)}K` },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/3 rounded-lg p-3">
                      <p className="text-xs text-white/40">{item.label}</p>
                      <p className="text-sm font-semibold text-white/90 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                <Button variant="gradient" size="sm" className="w-full">
                  Set as Default Model
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Cost Comparison */}
          <Card glass>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cost per 1M tokens (input)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {MODELS.filter((m) => m.isAvailable)
                  .sort((a, b) => a.inputCostPer1k - b.inputCostPer1k)
                  .slice(0, 5)
                  .map((model) => {
                    const maxCost = 10;
                    const pct = Math.min((model.inputCostPer1k / maxCost) * 100, 100);
                    return (
                      <div key={model.id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-white/70">{model.name}</span>
                          <span className="text-white/50">${(model.inputCostPer1k * 1000).toFixed(2)}/1M</span>
                        </div>
                        <div className="progress-neon h-1.5">
                          <div
                            className="progress-neon-fill h-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Usage by Model Chart */}
      <Card glass>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Usage Distribution (Last 6 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <UsageChart
            data={MODEL_USAGE_DATA}
            type="bar"
            dataKeys={[
              { key: "GPT-4o", color: "#00f5ff", label: "GPT-4o" },
              { key: "Claude 3.5", color: "#f97316", label: "Claude 3.5" },
              { key: "Gemini", color: "#3b82f6", label: "Gemini" },
              { key: "LLaMA", color: "#a855f7", label: "LLaMA" },
            ]}
            height={240}
          />
        </CardContent>
      </Card>
    </div>
  );
}
