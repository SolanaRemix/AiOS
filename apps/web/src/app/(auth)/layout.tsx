import React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#080810] flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 cyber-grid opacity-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl gradient-text">AIOS</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-white/50 hover:text-white transition-colors">
            Back to home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        {children}
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-4">
        <p className="text-xs text-white/25">
          © 2024 AIOS · Enterprise AI Platform
        </p>
      </div>
    </div>
  );
}
