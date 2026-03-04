"use client";

import React from "react";
import Link from "next/link";
import { Shield, Users, Building2, Settings, BarChart3, Zap } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#080810] overflow-hidden">
      {/* Admin Sidebar */}
      <div className="w-60 border-r border-red-500/10 bg-[#0a0508]/90 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-red-500/10">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <span className="font-bold text-white/90">Admin Panel</span>
            <p className="text-[10px] text-red-400/70">Super Admin Access</p>
          </div>
        </div>

        {/* Admin Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {[
            { href: "/admin", label: "Overview", icon: BarChart3 },
            { href: "/admin/tenants", label: "Tenants", icon: Building2 },
            { href: "/admin/users", label: "Users", icon: Users },
            { href: "/dashboard", label: "Back to App", icon: Zap },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white/80 hover:bg-red-500/5 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
