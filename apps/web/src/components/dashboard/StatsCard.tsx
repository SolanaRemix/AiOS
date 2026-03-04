"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon: React.ElementType;
  iconColor?: string;
  neonColor?: "cyan" | "purple" | "pink" | "green";
  description?: string;
  index?: number;
}

export function StatsCard({
  title,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  iconColor,
  neonColor = "cyan",
  description,
  index = 0,
}: StatsCardProps) {
  const neonColors = {
    cyan: {
      glow: "rgba(0, 245, 255, 0.15)",
      border: "rgba(0, 245, 255, 0.2)",
      icon: "text-primary",
      bg: "bg-primary/10",
      shadow: "shadow-neon",
    },
    purple: {
      glow: "rgba(124, 58, 237, 0.15)",
      border: "rgba(124, 58, 237, 0.2)",
      icon: "text-secondary",
      bg: "bg-secondary/10",
      shadow: "shadow-neon-purple",
    },
    pink: {
      glow: "rgba(240, 171, 252, 0.15)",
      border: "rgba(240, 171, 252, 0.2)",
      icon: "text-accent",
      bg: "bg-accent/10",
      shadow: "shadow-neon-pink",
    },
    green: {
      glow: "rgba(0, 255, 136, 0.15)",
      border: "rgba(0, 255, 136, 0.2)",
      icon: "text-green-400",
      bg: "bg-green-400/10",
      shadow: "shadow-[0_0_20px_rgba(0,255,136,0.3)]",
    },
  };

  const colors = neonColors[neonColor];

  const isPositive = delta !== undefined && delta > 0;
  const isNegative = delta !== undefined && delta < 0;
  const isNeutral = delta !== undefined && delta === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={cn(
        "glass-card rounded-xl p-5 relative overflow-hidden group transition-all duration-300",
        "hover:border-opacity-40"
      )}
      style={{
        borderColor: colors.border,
      }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 0% 0%, ${colors.glow}, transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {description && (
            <p className="text-xs text-white/40 mt-1">{description}</p>
          )}
          {delta !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive && (
                <TrendingUp className="w-3 h-3 text-green-400" />
              )}
              {isNegative && (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              {isNeutral && <Minus className="w-3 h-3 text-white/40" />}
              <span
                className={cn(
                  "text-xs font-medium",
                  isPositive
                    ? "text-green-400"
                    : isNegative
                    ? "text-red-400"
                    : "text-white/40"
                )}
              >
                {isPositive && "+"}
                {delta}%
              </span>
              {deltaLabel && (
                <span className="text-xs text-white/30">{deltaLabel}</span>
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            colors.bg
          )}
        >
          <Icon
            className={cn("w-5 h-5", iconColor || colors.icon)}
          />
        </div>
      </div>
    </motion.div>
  );
}
