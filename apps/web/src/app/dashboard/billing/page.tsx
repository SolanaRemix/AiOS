"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Download,
  Zap,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const CURRENT_PLAN = {
  name: "Pro",
  price: 49,
  nextBillingDate: "2024-12-15",
  tokensUsed: 6_420_000,
  tokenLimit: 10_000_000,
  apiCallsUsed: 24_500,
  apiCallLimit: 100_000,
  costThisMonth: 142.5,
};

const MOCK_INVOICES: Invoice[] = [
  { id: "inv-001", amount: 49.0, status: "paid", period: "November 2024", createdAt: "2024-11-01" },
  { id: "inv-002", amount: 49.0, status: "paid", period: "October 2024", createdAt: "2024-10-01" },
  { id: "inv-003", amount: 49.0, status: "paid", period: "September 2024", createdAt: "2024-09-01" },
  { id: "inv-004", amount: 49.0, status: "paid", period: "August 2024", createdAt: "2024-08-01" },
  { id: "inv-005", amount: 49.0, status: "paid", period: "July 2024", createdAt: "2024-07-01" },
];

const PLANS = [
  {
    name: "Free",
    price: 0,
    features: ["3 projects", "100K tokens/month", "2 agents"],
    current: false,
  },
  {
    name: "Pro",
    price: 49,
    features: ["Unlimited projects", "10M tokens/month", "All 9 agents", "All models"],
    current: true,
    highlight: true,
  },
  {
    name: "Enterprise",
    price: null,
    features: ["Unlimited tokens", "Dedicated infra", "SSO/SAML", "SLA"],
    current: false,
  },
];

const pctTokens = Math.round(
  (CURRENT_PLAN.tokensUsed / CURRENT_PLAN.tokenLimit) * 100
);
const pctApiCalls = Math.round(
  (CURRENT_PLAN.apiCallsUsed / CURRENT_PLAN.apiCallLimit) * 100
);

export default function BillingPage() {
  const [invoices] = useState(MOCK_INVOICES);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black text-white">Billing</h1>
        <p className="text-white/40 text-sm mt-0.5">
          Manage your subscription, usage, and invoices
        </p>
      </motion.div>

      {/* Current Plan & Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Current Plan */}
        <Card glass className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-primary">{CURRENT_PLAN.name}</span>
              </div>
              <p className="text-2xl font-bold text-white/90 mt-1">
                ${CURRENT_PLAN.price}
                <span className="text-sm text-white/40 font-normal">/mo</span>
              </p>
              <p className="text-xs text-white/40 mt-1">
                Next billing: {formatDate(CURRENT_PLAN.nextBillingDate)}
              </p>
            </div>
            <div className="space-y-2 mb-5">
              {PLANS.find((p) => p.current)?.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-white/60">
                  <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Manage Subscription
            </Button>
          </CardContent>
        </Card>

        {/* Usage */}
        <Card glass className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Usage This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Cost */}
            <div className="glass-card rounded-xl p-4 border border-primary/20 bg-primary/3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white/70">Current month spend</span>
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl font-black text-primary">
                {formatCurrency(CURRENT_PLAN.costThisMonth)}
              </p>
              <p className="text-xs text-white/40 mt-1">
                On track for ${Math.round(CURRENT_PLAN.costThisMonth * 1.1)} by month end
              </p>
            </div>

            {/* Token Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/70">Token Usage</span>
                <span className="text-xs text-white/50">
                  {(CURRENT_PLAN.tokensUsed / 1_000_000).toFixed(1)}M / {(CURRENT_PLAN.tokenLimit / 1_000_000).toFixed(0)}M
                </span>
              </div>
              <div className="progress-neon h-2">
                <div
                  className="progress-neon-fill h-full transition-all"
                  style={{ width: `${pctTokens}%` }}
                />
              </div>
              {pctTokens > 80 && (
                <div className="flex items-center gap-1 mt-1.5 text-xs text-yellow-400">
                  <AlertTriangle className="w-3 h-3" />
                  {pctTokens}% used — consider upgrading
                </div>
              )}
            </div>

            {/* API Calls */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/70">API Calls</span>
                <span className="text-xs text-white/50">
                  {CURRENT_PLAN.apiCallsUsed.toLocaleString()} / {CURRENT_PLAN.apiCallLimit.toLocaleString()}
                </span>
              </div>
              <div className="progress-neon h-2">
                <div
                  className="progress-neon-fill h-full transition-all"
                  style={{
                    width: `${pctApiCalls}%`,
                    background: "linear-gradient(90deg, #7c3aed, #f0abfc)",
                  }}
                />
              </div>
              <p className="text-xs text-white/30 mt-1">{pctApiCalls}% used</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Plans */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Upgrade Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`glass-card rounded-xl p-5 ${
                plan.highlight ? "border-primary/30 bg-primary/3" : ""
              } ${plan.current ? "opacity-70" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white">{plan.name}</h3>
                {plan.current && <Badge variant="neon" className="text-[10px]">Current</Badge>}
                {plan.highlight && !plan.current && (
                  <Badge variant="neon-purple" className="text-[10px]">Popular</Badge>
                )}
              </div>
              <p className="text-2xl font-black text-white mb-4">
                {plan.price === null
                  ? "Custom"
                  : plan.price === 0
                  ? "Free"
                  : `$${plan.price}/mo`}
              </p>
              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-white/60">
                    <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? "gradient" : "outline"}
                size="sm"
                className="w-full"
                disabled={plan.current}
              >
                {plan.current ? "Current Plan" : plan.price === null ? "Contact Sales" : "Upgrade"}
                {!plan.current && <ArrowUpRight className="w-3 h-3 ml-1" />}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Invoice History</h2>
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="font-mono text-xs text-white/50">{invoice.id}</td>
                  <td>{invoice.period}</td>
                  <td className="font-semibold">{formatCurrency(invoice.amount)}</td>
                  <td>
                    <Badge
                      variant={invoice.status === "paid" ? "success" : invoice.status === "pending" ? "warning" : "destructive"}
                      className="text-[10px] capitalize"
                    >
                      {invoice.status}
                    </Badge>
                  </td>
                  <td>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                      <Download className="w-3 h-3" />
                      PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
