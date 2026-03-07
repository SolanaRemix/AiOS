'use client';

import { Bell, Wifi, WifiOff, Activity } from 'lucide-react';
import { useMockWebSocket } from '@/hooks/useWebSocket';
import { mockSystemMetrics } from '@/lib/mock-data';

export function TopBar() {
  const { connected, events } = useMockWebSocket();
  const recentAlerts = events.filter(e => e.type === 'system_alert' || e.type === 'security_event').length;

  return (
    <header className="h-14 border-b border-[rgba(0,245,255,0.1)] bg-[#050508] flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-[rgba(255,255,255,0.5)]">
          <Activity size={14} className="text-[#00f5ff]" />
          <span>CPU: <span className="text-[#00f5ff]">{mockSystemMetrics.cpu_usage}%</span></span>
          <span className="text-[rgba(255,255,255,0.2)]">|</span>
          <span>MEM: <span className="text-[#7c3aed]">{mockSystemMetrics.memory_usage}%</span></span>
          <span className="text-[rgba(255,255,255,0.2)]">|</span>
          <span>GPU: <span className="text-[#00ff88]">{mockSystemMetrics.gpu_usage}%</span></span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {recentAlerts > 0 && (
          <div className="relative">
            <Bell size={16} className="text-[rgba(255,255,255,0.5)]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">{recentAlerts}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs">
          {connected ? (
            <><Wifi size={14} className="text-[#00ff88]" /><span className="text-[#00ff88]">LIVE</span></>
          ) : (
            <><WifiOff size={14} className="text-red-400" /><span className="text-red-400">OFFLINE</span></>
          )}
        </div>
        <div className="w-8 h-8 rounded-full bg-[rgba(0,245,255,0.1)] border border-[rgba(0,245,255,0.2)] flex items-center justify-center text-[#00f5ff] text-xs font-bold">SG</div>
      </div>
    </header>
  );
}
