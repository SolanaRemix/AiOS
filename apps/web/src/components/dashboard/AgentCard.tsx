"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bot, CheckCircle, AlertCircle, Clock, Wifi, WifiOff } from "lucide-react";
import { Agent, AgentStatus, AgentRole } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const roleColors: Record<AgentRole, string> = {
  orchestrator: "text-primary",
  code_generator: "text-secondary",
  code_reviewer: "text-accent",
  debugger: "text-red-400",
  tester: "text-green-400",
  documenter: "text-yellow-400",
  security_auditor: "text-orange-400",
  devops: "text-blue-400",
  data_analyst: "text-pink-400",
};

const roleLabels: Record<AgentRole, string> = {
  orchestrator: "Orchestrator",
  code_generator: "Code Generator",
  code_reviewer: "Code Reviewer",
  debugger: "Debugger",
  tester: "Tester",
  documenter: "Documenter",
  security_auditor: "Security Auditor",
  devops: "DevOps",
  data_analyst: "Data Analyst",
};

const statusConfig: Record<
  AgentStatus,
  { label: string; color: string; icon: React.ElementType; pulse: boolean }
> = {
  active: {
    label: "Active",
    color: "text-green-400",
    icon: CheckCircle,
    pulse: true,
  },
  idle: {
    label: "Idle",
    color: "text-yellow-400",
    icon: Clock,
    pulse: false,
  },
  busy: {
    label: "Busy",
    color: "text-primary",
    icon: Wifi,
    pulse: true,
  },
  error: {
    label: "Error",
    color: "text-red-400",
    icon: AlertCircle,
    pulse: false,
  },
  offline: {
    label: "Offline",
    color: "text-white/30",
    icon: WifiOff,
    pulse: false,
  },
};

interface AgentCardProps {
  agent: Agent;
  index?: number;
  onClick?: () => void;
}

export function AgentCard({ agent, index = 0, onClick }: AgentCardProps) {
  const status = statusConfig[agent.status];
  const StatusIcon = status.icon;
  const roleColor = roleColors[agent.role];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "glass-card rounded-xl p-5 cursor-pointer group transition-all duration-300",
        "hover:border-primary/20 hover:shadow-[0_0_20px_rgba(0,245,255,0.05)]",
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
          <Bot className={cn("w-5 h-5", roleColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white/90 text-sm truncate">{agent.name}</h3>
          <p className={cn("text-xs mt-0.5", roleColor)}>{roleLabels[agent.role]}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {status.pulse && (
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse",
                agent.status === "active"
                  ? "bg-green-400"
                  : agent.status === "busy"
                  ? "bg-primary"
                  : "bg-white/30"
              )}
            />
          )}
          <StatusIcon className={cn("w-3.5 h-3.5", status.color)} />
          <span className={cn("text-xs", status.color)}>{status.label}</span>
        </div>
      </div>

      {agent.currentTask && (
        <div className="mb-4 px-3 py-2 bg-white/3 rounded-lg border border-white/5">
          <p className="text-xs text-white/40 mb-0.5">Current Task</p>
          <p className="text-xs text-white/70 truncate">{agent.currentTask}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-sm font-semibold text-white/90">
            {agent.completedTasks}
          </p>
          <p className="text-[10px] text-white/30 mt-0.5">Tasks Done</p>
        </div>
        <div className="text-center border-x border-white/5">
          <p className="text-sm font-semibold text-green-400">
            {agent.successRate}%
          </p>
          <p className="text-[10px] text-white/30 mt-0.5">Success</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white/90">
            {agent.avgResponseTime}s
          </p>
          <p className="text-[10px] text-white/30 mt-0.5">Avg Time</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
          {agent.model}
        </Badge>
        <span className="text-[10px] text-white/25">
          {agent.lastActive}
        </span>
      </div>
    </motion.div>
  );
}
