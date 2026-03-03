"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Zap,
  Moon,
  Sun,
  Search,
} from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const mockNotifications = [
  {
    id: "1",
    title: "Agent Task Completed",
    message: "Code Generator finished project-x",
    time: "2m ago",
    read: false,
  },
  {
    id: "2",
    title: "New Model Available",
    message: "GPT-4o has been added to federation",
    time: "1h ago",
    read: false,
  },
  {
    id: "3",
    title: "Deployment Success",
    message: "Project Alpha deployed to production",
    time: "3h ago",
    read: true,
  },
];

export function Navbar() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-white/5 bg-[#08080f]/90 backdrop-blur-xl flex items-center px-4 gap-4 relative z-40">
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          placeholder="Search projects, agents, models..."
          className="w-full h-9 bg-white/5 border border-white/8 rounded-lg pl-9 pr-4 text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-colors"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/25 font-mono bg-white/5 px-1.5 py-0.5 rounded">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-white/50 hover:text-white/80"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="text-white/50 hover:text-white/80 relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full shadow-neon animate-pulse" />
            )}
          </Button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 glass-card rounded-xl border border-white/10 shadow-glass-lg overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  <Badge variant="neon" className="text-[10px]">
                    {unreadCount} new
                  </Badge>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {mockNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/3 transition-colors",
                        !notif.read && "bg-primary/3"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!notif.read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        )}
                        <div className={cn(!notif.read ? "" : "ml-3.5")}>
                          <p className="text-xs font-medium text-white/90">{notif.title}</p>
                          <p className="text-xs text-white/50 mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-white/30 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2">
                  <Button variant="ghost" size="sm" className="w-full text-primary text-xs">
                    View all notifications
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Upgrade Button */}
        <Button variant="neon" size="sm" className="hidden sm:flex gap-1.5">
          <Zap className="w-3 h-3" />
          Upgrade
        </Button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-white/90 leading-none">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] text-white/40 mt-0.5 capitalize">{user?.role || "member"}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-white/40 hidden sm:block" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-52 glass-card rounded-xl border border-white/10 shadow-glass-lg overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-semibold text-white">{user?.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <div className="border-t border-white/5 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click outside overlay */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
}
