import { Agent, Swarm, Task, MemoryEntry, ToolExecution, ModelRoute, SecurityEvent, SystemMetrics } from '@/types';

export const mockAgents: Agent[] = [
  { agent_id: 'agent-001', name: 'ResearchBot Alpha', role: 'Researcher', status: 'active', model: 'gpt-4o', memory_usage: 45, token_usage: 125000, task_queue: ['task-001', 'task-002'], swarm_id: 'swarm-001', created_at: '2024-01-01T00:00:00Z', last_active: new Date().toISOString() },
  { agent_id: 'agent-002', name: 'DevBot Prime', role: 'Developer', status: 'active', model: 'claude-3-5-sonnet', memory_usage: 62, token_usage: 89000, task_queue: ['task-003'], swarm_id: 'swarm-002', created_at: '2024-01-01T00:00:00Z', last_active: new Date().toISOString() },
  { agent_id: 'agent-003', name: 'TradingBot X', role: 'Trader', status: 'idle', model: 'gpt-4o-mini', memory_usage: 28, token_usage: 45000, task_queue: [], swarm_id: 'swarm-003', created_at: '2024-01-01T00:00:00Z', last_active: new Date(Date.now() - 60000).toISOString() },
  { agent_id: 'agent-004', name: 'SecurityBot Omega', role: 'Security', status: 'active', model: 'claude-3-5-sonnet', memory_usage: 78, token_usage: 200000, task_queue: ['task-004', 'task-005', 'task-006'], swarm_id: 'swarm-004', created_at: '2024-01-01T00:00:00Z', last_active: new Date().toISOString() },
  { agent_id: 'agent-005', name: 'DataBot Sigma', role: 'Data Analyst', status: 'paused', model: 'gemini-1.5-pro', memory_usage: 33, token_usage: 67000, task_queue: [], swarm_id: 'swarm-001', created_at: '2024-01-01T00:00:00Z', last_active: new Date(Date.now() - 300000).toISOString() },
  { agent_id: 'agent-006', name: 'WriterBot Zeta', role: 'Content Writer', status: 'error', model: 'gpt-4o', memory_usage: 15, token_usage: 12000, task_queue: ['task-007'], swarm_id: 'swarm-001', created_at: '2024-01-01T00:00:00Z', last_active: new Date(Date.now() - 600000).toISOString() },
];

export const mockSwarms: Swarm[] = [
  { swarm_id: 'swarm-001', name: 'Research Swarm', type: 'research', agent_ids: ['agent-001', 'agent-005', 'agent-006'], status: 'active', created_at: '2024-01-01T00:00:00Z', task_count: 12 },
  { swarm_id: 'swarm-002', name: 'Developer Swarm', type: 'development', agent_ids: ['agent-002'], status: 'active', created_at: '2024-01-01T00:00:00Z', task_count: 5 },
  { swarm_id: 'swarm-003', name: 'Trading Swarm', type: 'trading', agent_ids: ['agent-003'], status: 'idle', created_at: '2024-01-01T00:00:00Z', task_count: 0 },
  { swarm_id: 'swarm-004', name: 'Security Swarm', type: 'security', agent_ids: ['agent-004'], status: 'active', created_at: '2024-01-01T00:00:00Z', task_count: 8 },
];

export const mockTasks: Task[] = [
  { task_id: 'task-001', name: 'Analyze market trends Q4', status: 'running', agent_id: 'agent-001', dependencies: [], created_at: '2024-01-10T00:00:00Z', started_at: new Date(Date.now() - 120000).toISOString() },
  { task_id: 'task-002', name: 'Generate research report', status: 'pending', agent_id: 'agent-001', dependencies: ['task-001'], created_at: '2024-01-10T00:00:00Z' },
  { task_id: 'task-003', name: 'Refactor authentication module', status: 'running', agent_id: 'agent-002', dependencies: [], created_at: '2024-01-10T00:00:00Z', started_at: new Date(Date.now() - 300000).toISOString() },
  { task_id: 'task-004', name: 'Scan for vulnerabilities', status: 'completed', agent_id: 'agent-004', dependencies: [], created_at: '2024-01-09T00:00:00Z', started_at: '2024-01-09T01:00:00Z', completed_at: '2024-01-09T02:00:00Z' },
  { task_id: 'task-005', name: 'Audit API key access', status: 'running', agent_id: 'agent-004', dependencies: ['task-004'], created_at: '2024-01-10T00:00:00Z', started_at: new Date(Date.now() - 60000).toISOString() },
  { task_id: 'task-006', name: 'Generate security report', status: 'pending', agent_id: 'agent-004', dependencies: ['task-005'], created_at: '2024-01-10T00:00:00Z' },
  { task_id: 'task-007', name: 'Write product documentation', status: 'failed', agent_id: 'agent-006', dependencies: [], created_at: '2024-01-08T00:00:00Z', started_at: '2024-01-08T01:00:00Z', error: 'Model rate limit exceeded' },
];

export const mockMemory: MemoryEntry[] = [
  { id: 'mem-001', type: 'short_term', content: 'User requested analysis of Q4 market data for crypto assets', agent_id: 'agent-001', metadata: { session: 'sess-123' }, created_at: new Date(Date.now() - 300000).toISOString(), importance: 0.8 },
  { id: 'mem-002', type: 'long_term', content: 'Bitcoin tends to rally in Q4 based on historical data from 2017-2023', metadata: { source: 'research', verified: true }, created_at: '2024-01-01T00:00:00Z', importance: 0.95 },
  { id: 'mem-003', type: 'agent_specific', content: 'Authentication module uses JWT with 1h expiry', agent_id: 'agent-002', metadata: { project: 'aios-api' }, created_at: '2024-01-05T00:00:00Z', importance: 0.7 },
  { id: 'mem-004', type: 'knowledge_base', content: 'CVE-2024-1234: Critical buffer overflow in libssl < 3.0.8', metadata: { severity: 'critical', cve: 'CVE-2024-1234' }, created_at: '2024-01-07T00:00:00Z', importance: 1.0 },
  { id: 'mem-005', type: 'short_term', content: 'User wants Docker deployment for the control panel', agent_id: 'agent-002', metadata: { session: 'sess-456' }, created_at: new Date(Date.now() - 60000).toISOString(), importance: 0.6 },
];

export const mockToolExecutions: ToolExecution[] = [
  { execution_id: 'exec-001', tool_name: 'GitHub', tool_type: 'vcs', status: 'running', agent_id: 'agent-002', command: 'git clone https://github.com/org/repo', started_at: new Date(Date.now() - 30000).toISOString(), requires_approval: false },
  { execution_id: 'exec-002', tool_name: 'Terminal', tool_type: 'system', status: 'blocked', agent_id: 'agent-004', command: 'sudo rm -rf /var/log/*', started_at: new Date(Date.now() - 10000).toISOString(), requires_approval: true },
  { execution_id: 'exec-003', tool_name: 'Browser', tool_type: 'web', status: 'completed', agent_id: 'agent-001', command: 'Navigate to coinmarketcap.com', result: 'Page loaded successfully', started_at: new Date(Date.now() - 120000).toISOString(), requires_approval: false },
  { execution_id: 'exec-004', tool_name: 'Docker', tool_type: 'container', status: 'pending', agent_id: 'agent-002', command: 'docker build -t aios-control-panel .', started_at: new Date(Date.now() - 5000).toISOString(), requires_approval: false },
  { execution_id: 'exec-005', tool_name: 'Blockchain', tool_type: 'blockchain', status: 'blocked', agent_id: 'agent-003', command: 'Transfer 5 SOL to wallet 7xKX...', started_at: new Date().toISOString(), requires_approval: true },
];

export const mockModelRoutes: ModelRoute[] = [
  { provider: 'OpenAI', model: 'gpt-4o', requests_today: 1250, tokens_used: 2500000, cost_today: 12.50, avg_latency_ms: 850, error_rate: 0.02, status: 'active' },
  { provider: 'Anthropic', model: 'claude-3-5-sonnet', requests_today: 890, tokens_used: 1780000, cost_today: 8.90, avg_latency_ms: 1200, error_rate: 0.01, status: 'active' },
  { provider: 'OpenAI', model: 'gpt-4o-mini', requests_today: 3400, tokens_used: 5100000, cost_today: 2.55, avg_latency_ms: 450, error_rate: 0.05, status: 'active' },
  { provider: 'Google', model: 'gemini-1.5-pro', requests_today: 420, tokens_used: 840000, cost_today: 1.68, avg_latency_ms: 780, error_rate: 0.03, status: 'active' },
  { provider: 'Groq', model: 'llama-3.1-70b', requests_today: 670, tokens_used: 1340000, cost_today: 0.67, avg_latency_ms: 320, error_rate: 0.08, status: 'degraded' },
  { provider: 'Ollama', model: 'mistral-7b', requests_today: 0, tokens_used: 0, cost_today: 0, avg_latency_ms: 0, error_rate: 0, status: 'offline' },
];

export const mockSecurityEvents: SecurityEvent[] = [
  { event_id: 'sec-001', type: 'tool_abuse', severity: 'critical', agent_id: 'agent-004', description: 'Agent attempted to execute rm -rf on system directory', timestamp: new Date(Date.now() - 10000).toISOString(), resolved: false },
  { event_id: 'sec-002', type: 'permission_escalation', severity: 'high', agent_id: 'agent-003', description: 'Agent requested sudo privileges without authorization', timestamp: new Date(Date.now() - 60000).toISOString(), resolved: false },
  { event_id: 'sec-003', type: 'api_key_access', severity: 'medium', agent_id: 'agent-001', description: 'Agent accessed production API key outside allowed scope', timestamp: new Date(Date.now() - 300000).toISOString(), resolved: true },
  { event_id: 'sec-004', type: 'agent_anomaly', severity: 'low', agent_id: 'agent-005', description: 'Unusual memory access pattern detected', timestamp: new Date(Date.now() - 600000).toISOString(), resolved: true },
  { event_id: 'sec-005', type: 'tool_abuse', severity: 'high', agent_id: 'agent-003', description: 'Attempted unauthorized blockchain transaction (5 SOL)', timestamp: new Date().toISOString(), resolved: false },
];

export const mockSystemMetrics: SystemMetrics = {
  cpu_usage: 67,
  memory_usage: 54,
  gpu_usage: 82,
  agent_count: 6,
  active_swarms: 3,
  task_throughput: 24,
  token_usage_per_min: 15000,
  uptime_seconds: 86400 * 3,
  timestamp: new Date().toISOString(),
};

export const generateMetricsHistory = (points: number = 20) => {
  return Array.from({ length: points }, (_, i) => ({
    time: new Date(Date.now() - (points - i) * 30000).toLocaleTimeString(),
    cpu: Math.round(50 + Math.random() * 30),
    memory: Math.round(40 + Math.random() * 30),
    gpu: Math.round(60 + Math.random() * 30),
    tasks: Math.round(10 + Math.random() * 20),
    tokens: Math.round(10000 + Math.random() * 10000),
  }));
};
