"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";
interface UsageChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>[];
  type?: "line" | "bar" | "area";
  dataKeys?: Array<{ key: string; color: string; label: string }>;
  height?: number;
}

const defaultDataKeys = [
  { key: "tokens", color: "#00f5ff", label: "Tokens (K)" },
  { key: "cost", color: "#7c3aed", label: "Cost ($)" },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card border border-white/10 rounded-lg p-3 shadow-glass-lg">
        <p className="text-xs text-white/60 mb-2">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} className="text-xs font-medium" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function UsageChart({
  data,
  type = "area",
  dataKeys = defaultDataKeys,
  height = 280,
}: UsageChartProps) {
  const commonProps = {
    data,
    margin: { top: 5, right: 5, left: -20, bottom: 5 },
  };

  const axisStyle = {
    tick: { fill: "rgba(255,255,255,0.3)", fontSize: 11 },
    axisLine: { stroke: "rgba(255,255,255,0.1)" },
    tickLine: { stroke: "rgba(255,255,255,0.1)" },
  };

  const gridStyle = {
    strokeDasharray: "3 3",
    stroke: "rgba(255,255,255,0.05)",
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === "bar" ? (
        <BarChart {...commonProps}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="date" {...axisStyle} />
          <YAxis {...axisStyle} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}
          />
          {dataKeys.map((dk) => (
            <Bar
              key={dk.key}
              dataKey={dk.key}
              name={dk.label}
              fill={dk.color}
              radius={[4, 4, 0, 0]}
              fillOpacity={0.8}
            />
          ))}
        </BarChart>
      ) : type === "area" ? (
        <AreaChart {...commonProps}>
          <defs>
            {dataKeys.map((dk) => (
              <linearGradient
                key={dk.key}
                id={`gradient-${dk.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={dk.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={dk.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="date" {...axisStyle} />
          <YAxis {...axisStyle} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}
          />
          {dataKeys.map((dk) => (
            <Area
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.label}
              stroke={dk.color}
              strokeWidth={2}
              fill={`url(#gradient-${dk.key})`}
              dot={false}
              activeDot={{ r: 4, fill: dk.color, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      ) : (
        <LineChart {...commonProps}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="date" {...axisStyle} />
          <YAxis {...axisStyle} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}
          />
          {dataKeys.map((dk) => (
            <Line
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.label}
              stroke={dk.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: dk.color, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
