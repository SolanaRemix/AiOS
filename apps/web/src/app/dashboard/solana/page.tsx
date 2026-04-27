"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Activity,
  Zap,
  Shield,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  Play,
  Pause,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Opportunity {
  id: string;
  tokenA: string;
  tokenB: string;
  dexIn: string;
  dexOut: string;
  amountIn: string;
  expectedProfit: string;
  route: string[];
  timestamp: number;
  riskScore: number;
}

interface TradeLog {
  id: string;
  timestamp: string;
  opportunityId: string;
  status: "success" | "failed" | "pending";
  profit: string;
  txSignature?: string;
  durationMs: number;
}

const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp_1",
    tokenA: "SOL",
    tokenB: "USDC",
    dexIn: "Orca",
    dexOut: "Raydium",
    amountIn: "1000000000",
    expectedProfit: "25000",
    route: ["SOL", "USDC", "SOL"],
    timestamp: Date.now() - 2000,
    riskScore: 0.12,
  },
  {
    id: "opp_2",
    tokenA: "BONK",
    tokenB: "SOL",
    dexIn: "Jupiter",
    dexOut: "Orca",
    amountIn: "500000000",
    expectedProfit: "18000",
    route: ["BONK", "SOL", "BONK"],
    timestamp: Date.now() - 5000,
    riskScore: 0.22,
  },
  {
    id: "opp_3",
    tokenA: "USDC",
    tokenB: "USDT",
    dexIn: "Raydium",
    dexOut: "Saber",
    amountIn: "2000000000",
    expectedProfit: "12000",
    route: ["USDC", "USDT", "USDC"],
    timestamp: Date.now() - 8000,
    riskScore: 0.07,
  },
];

const INITIAL_LOGS: TradeLog[] = [
  {
    id: "log_1",
    timestamp: new Date(Date.now() - 60_000).toISOString(),
    opportunityId: "opp_old_1",
    status: "success",
    profit: "0.000031 SOL",
    txSignature: "4xK9mN...3pQrS",
    durationMs: 412,
  },
  {
    id: "log_2",
    timestamp: new Date(Date.now() - 120_000).toISOString(),
    opportunityId: "opp_old_2",
    status: "failed",
    profit: "0",
    durationMs: 280,
  },
  {
    id: "log_3",
    timestamp: new Date(Date.now() - 180_000).toISOString(),
    opportunityId: "opp_old_3",
    status: "success",
    profit: "0.000019 SOL",
    txSignature: "7yG2nP...8wZtV",
    durationMs: 387,
  },
];

function lamportsToSol(lamports: string): string {
  return (Number(lamports) / 1_000_000_000).toFixed(6);
}

function riskLabel(score: number): { label: string; color: string } {
  if (score < 0.1) return { label: "Low",    color: "text-green-400" };
  if (score < 0.2) return { label: "Medium", color: "text-yellow-400" };
  return                   { label: "High",   color: "text-red-400" };
}

export default function SolanaArbitragePage() {
  const [isScanning, setIsScanning] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(MOCK_OPPORTUNITIES);
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>(INITIAL_LOGS);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);

  const stats = {
    totalProfit: tradeLogs
      .filter((l) => l.status === "success")
      .reduce((a, l) => a + parseFloat(l.profit), 0)
      .toFixed(6),
    successRate: tradeLogs.length
      ? Math.round(
          (tradeLogs.filter((l) => l.status === "success").length / tradeLogs.length) * 100
        )
      : 0,
    avgDuration: tradeLogs.length
      ? Math.round(tradeLogs.reduce((a, l) => a + l.durationMs, 0) / tradeLogs.length)
      : 0,
    scans: scanCount,
  };

  const scan = useCallback(() => {
    setScanCount((c) => c + 1);
    // Simulate discovering new opportunities
    const newOpp: Opportunity = {
      id: `opp_${Date.now()}`,
      tokenA: ["SOL", "BONK", "JTO", "PYTH"][Math.floor(Math.random() * 4)],
      tokenB: ["USDC", "SOL", "BONK"][Math.floor(Math.random() * 3)],
      dexIn: ["Orca", "Raydium", "Jupiter"][Math.floor(Math.random() * 3)],
      dexOut: ["Saber", "Meteora", "Phoenix"][Math.floor(Math.random() * 3)],
      amountIn: String(Math.floor(Math.random() * 3_000_000_000)),
      expectedProfit: String(Math.floor(Math.random() * 50_000)),
      route: ["SOL", "USDC", "SOL"],
      timestamp: Date.now(),
      riskScore: Math.random() * 0.4,
    };
    setOpportunities((prev) => [newOpp, ...prev.slice(0, 9)]);
  }, []);

  // Auto-scan while running
  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(scan, 3000);
    return () => clearInterval(interval);
  }, [isScanning, scan]);

  const execute = async (opp: Opportunity) => {
    setExecutingId(opp.id);
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));
    const success = Math.random() > 0.25;
    const log: TradeLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      opportunityId: opp.id,
      status: success ? "success" : "failed",
      profit: success ? `${lamportsToSol(opp.expectedProfit)} SOL` : "0",
      txSignature: success ? `${Math.random().toString(36).slice(2, 8)}...${Math.random().toString(36).slice(2, 8)}` : undefined,
      durationMs: 420 + Math.floor(Math.random() * 200),
    };
    setTradeLogs((prev) => [log, ...prev.slice(0, 49)]);
    setOpportunities((prev) => prev.filter((o) => o.id !== opp.id));
    setExecutingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Solana Flashloan Arbitrage
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            Real-time cross-DEX arbitrage scanning and execution
          </p>
        </div>
        <Button
          variant={isScanning ? "destructive" : "gradient"}
          onClick={() => setIsScanning(!isScanning)}
          className="flex items-center gap-2"
        >
          {isScanning ? (
            <>
              <Pause className="w-4 h-4" />
              Stop Scanner
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start Scanner
            </>
          )}
        </Button>
      </motion.div>

      {/* Scanning indicator */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20"
          >
            <RefreshCw className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm text-primary/80">
              Scanning DEX pools… {scanCount} scans completed
            </span>
            <Badge variant="neon" className="text-[10px] ml-auto">LIVE</Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Profit",   value: `${stats.totalProfit} SOL`, icon: DollarSign,   color: "text-green-400" },
          { label: "Success Rate",   value: `${stats.successRate}%`,    icon: CheckCircle,  color: "text-primary" },
          { label: "Avg Duration",   value: `${stats.avgDuration}ms`,   icon: Clock,        color: "text-yellow-400" },
          { label: "Pool Scans",     value: String(stats.scans),        icon: Activity,     color: "text-blue-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} glass>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-xs text-white/40">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Opportunities */}
        <div>
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Zap className="w-3 h-3 text-yellow-400" />
            Live Opportunities
            <Badge variant="outline" className="text-[10px]">{opportunities.length}</Badge>
          </h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            <AnimatePresence>
              {opportunities.map((opp) => {
                const risk = riskLabel(opp.riskScore);
                return (
                  <motion.div
                    key={opp.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <Card glass className="hover:border-primary/30 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-white">
                                {opp.tokenA} → {opp.tokenB}
                              </span>
                              <Badge variant="outline" className="text-[10px]">{opp.dexIn}</Badge>
                              <span className="text-[10px] text-white/30">→</span>
                              <Badge variant="outline" className="text-[10px]">{opp.dexOut}</Badge>
                            </div>
                            <p className="text-xs text-white/40 mt-1">
                              Route: {opp.route.join(" → ")}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-green-400">
                              +{lamportsToSol(opp.expectedProfit)} SOL
                            </p>
                            <p className={`text-[10px] ${risk.color}`}>
                              {risk.label} Risk
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[10px] text-white/30">
                            <span>In: {lamportsToSol(opp.amountIn)} SOL</span>
                            <span>{new Date(opp.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <Button
                            variant="gradient"
                            size="sm"
                            className="h-7 text-[10px] px-3"
                            disabled={executingId === opp.id}
                            onClick={() => execute(opp)}
                          >
                            {executingId === opp.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Zap className="w-3 h-3 mr-1" />
                                Execute
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {opportunities.length === 0 && (
              <div className="text-center py-10 text-white/20">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No opportunities found</p>
                <p className="text-xs mt-1">Start the scanner to detect arb windows</p>
              </div>
            )}
          </div>
        </div>

        {/* Trade Log */}
        <div>
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Shield className="w-3 h-3 text-primary" />
            Execution Log
            <Badge variant="outline" className="text-[10px]">{tradeLogs.length}</Badge>
          </h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {tradeLogs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-all">
                  {log.status === "success" ? (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : log.status === "failed" ? (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold capitalize ${
                        log.status === "success" ? "text-green-400"
                        : log.status === "failed" ? "text-red-400"
                        : "text-yellow-400"
                      }`}>
                        {log.status}
                      </span>
                      {log.status === "success" && (
                        <span className="text-xs text-green-300">+{log.profit}</span>
                      )}
                      <span className="text-[10px] text-white/20 ml-auto">{log.durationMs}ms</span>
                    </div>
                    {log.txSignature && (
                      <p className="text-[10px] text-white/30 font-mono truncate mt-0.5">
                        tx: {log.txSignature}
                      </p>
                    )}
                    <p className="text-[10px] text-white/20">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {log.txSignature && (
                    <button className="text-white/20 hover:text-white/50 transition-all flex-shrink-0">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* WASM Module Status */}
      <Card glass>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/70">WASM Module Status</p>
            <p className="text-xs text-white/40">
              Running in mock mode – deploy{" "}
              <code className="font-mono text-primary/80">wasm/solana_arbitrage.js</code>
              {" "}to enable live execution
            </p>
          </div>
          <Badge variant="warning" className="ml-auto text-[10px]">Mock</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
