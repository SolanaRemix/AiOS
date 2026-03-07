'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Network, Bot, ListTodo, Brain, Wrench, Cpu, Zap, Activity, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Swarm Map', href: '/swarms', icon: Network },
  { label: 'Agents', href: '/agents', icon: Bot },
  { label: 'Tasks', href: '/tasks', icon: ListTodo },
  { label: 'Memory', href: '/memory', icon: Brain },
  { label: 'Tools', href: '/tools', icon: Wrench },
  { label: 'Models', href: '/models', icon: Cpu },
  { label: 'Autonomy', href: '/autonomy', icon: Zap },
  { label: 'Health', href: '/health', icon: Activity },
  { label: 'Security', href: '/security', icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 min-h-screen bg-[#050508] border-r border-[rgba(0,245,255,0.1)] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[rgba(0,245,255,0.1)]">
        <div className="text-[#00f5ff] font-bold text-xl tracking-widest">SWARM GOD</div>
        <div className="text-[rgba(0,245,255,0.5)] text-xs tracking-widest mt-1">CONTROL PANEL v0.1</div>
      </div>
      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[rgba(0,245,255,0.1)] text-[#00f5ff] border border-[rgba(0,245,255,0.2)]'
                  : 'text-[rgba(255,255,255,0.5)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
              )}
            >
              <Icon size={16} className={isActive ? 'text-[#00f5ff]' : 'text-[rgba(255,255,255,0.4)]'} />
              {label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00f5ff] animate-pulse" />}
            </Link>
          );
        })}
      </nav>
      {/* Footer */}
      <div className="p-4 border-t border-[rgba(0,245,255,0.1)]">
        <div className="text-[rgba(255,255,255,0.3)] text-xs space-y-1">
          <div className="flex justify-between"><span>STATUS</span><span className="text-[#00ff88]">ONLINE</span></div>
          <div className="flex justify-between"><span>VERSION</span><span>0.1.0</span></div>
        </div>
      </div>
    </aside>
  );
}
