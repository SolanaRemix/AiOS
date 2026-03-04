"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  Bot,
  Brain,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  BarChart3,
  Users,
  Activity,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  section?: string;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    section: "Main",
  },
  {
    href: "/dashboard/projects",
    label: "Projects",
    icon: FolderOpen,
    section: "Main",
  },
  {
    href: "/dashboard/agents",
    label: "Agents",
    icon: Bot,
    badge: "9",
    section: "Main",
  },
  {
    href: "/dashboard/models",
    label: "LLM Models",
    icon: Brain,
    section: "Main",
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    section: "Insights",
  },
  {
    href: "/dashboard/activity",
    label: "Activity",
    icon: Activity,
    section: "Insights",
  },
  {
    href: "/dashboard/billing",
    label: "Billing",
    icon: CreditCard,
    section: "Account",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    section: "Account",
  },
];

const adminItems: NavItem[] = [
  { href: "/admin", label: "Admin Panel", icon: Shield, section: "Admin" },
  {
    href: "/admin/tenants",
    label: "Tenants",
    icon: Users,
    section: "Admin",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Cpu,
    section: "Admin",
  },
];

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems;
  const sections = Array.from(new Set(allItems.map((item) => item.section)));

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex flex-col h-full border-r border-white/5 bg-[#08080f]/90 backdrop-blur-xl overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/5 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-neon">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-lg gradient-text overflow-hidden whitespace-nowrap"
              >
                AIOS
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-6">
        {sections.map((section) => {
          const items = allItems.filter((item) => item.section === section);
          return (
            <div key={section}>
              <AnimatePresence>
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] font-semibold uppercase tracking-widest text-white/25 px-3 mb-2"
                  >
                    {section}
                  </motion.p>
                )}
              </AnimatePresence>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative",
                          isActive
                            ? "bg-primary/10 text-primary border-l-2 border-primary"
                            : "text-white/50 hover:text-white/80 hover:bg-white/5 border-l-2 border-transparent"
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 flex-shrink-0 transition-colors",
                            isActive ? "text-primary" : "text-white/40 group-hover:text-white/70"
                          )}
                        />
                        <AnimatePresence>
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              className="overflow-hidden whitespace-nowrap flex-1"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {!collapsed && item.badge && (
                          <span className="ml-auto text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute right-2 w-1 h-4 bg-primary rounded-full shadow-neon"
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#0d0d1a] border border-white/10 flex items-center justify-center hover:border-primary/30 transition-colors z-10"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-white/50" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-white/50" />
        )}
      </button>
    </motion.aside>
  );
}
