export type AgentStatus = 'active' | 'idle' | 'paused' | 'error' | 'terminated';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type AutonomyMode = 'manual' | 'assisted' | 'autonomous' | 'research';

export interface Agent {
  agent_id: string;
  name: string;
  role: string;
  status: AgentStatus;
  model: string;
  memory_usage: number;
  token_usage: number;
  task_queue: string[];
  swarm_id?: string;
  created_at: string;
  last_active: string;
}

export interface Swarm {
  swarm_id: string;
  name: string;
  type: string;
  agent_ids: string[];
  status: 'active' | 'idle' | 'terminated';
  created_at: string;
  task_count: number;
}

export interface Task {
  task_id: string;
  name: string;
  status: TaskStatus;
  agent_id?: string;
  dependencies: string[];
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface MemoryEntry {
  id: string;
  type: 'short_term' | 'long_term' | 'agent_specific' | 'knowledge_base';
  content: string;
  agent_id?: string;
  embedding?: number[];
  metadata: Record<string, unknown>;
  created_at: string;
  importance: number;
}

export interface ToolExecution {
  execution_id: string;
  tool_name: string;
  tool_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
  agent_id: string;
  command?: string;
  result?: string;
  started_at: string;
  requires_approval: boolean;
}

export interface ModelRoute {
  provider: string;
  model: string;
  requests_today: number;
  tokens_used: number;
  cost_today: number;
  avg_latency_ms: number;
  error_rate: number;
  status: 'active' | 'degraded' | 'offline';
}

export interface SecurityEvent {
  event_id: string;
  type: 'permission_escalation' | 'api_key_access' | 'tool_abuse' | 'agent_anomaly' | 'kill_switch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  agent_id?: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  gpu_usage: number;
  agent_count: number;
  active_swarms: number;
  task_throughput: number;
  token_usage_per_min: number;
  uptime_seconds: number;
  timestamp: string;
}

export type WebSocketEventType =
  | 'agent_spawned'
  | 'agent_terminated'
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'memory_updated'
  | 'system_alert'
  | 'security_event'
  | 'metrics_update';

export interface WebSocketEvent {
  type: WebSocketEventType;
  payload: unknown;
  timestamp: string;
}
