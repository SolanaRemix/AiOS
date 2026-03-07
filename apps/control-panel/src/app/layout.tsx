import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SWARM GOD CONTROL PANEL | AiOS',
  description: 'Real-time command center for orchestrating AI agents and swarms',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#050508] font-mono antialiased">
        {children}
      </body>
    </html>
  );
}
