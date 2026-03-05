// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  correlationId?: string;
}

// Pagination
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

// User types
export interface User { id: string; email: string; name: string; role: string; tenantId: string }

// Agent types
export interface Agent { id: string; name: string; model: string; status: string; description?: string }
export type AgentStatus = 'idle' | 'running' | 'error' | 'stopped';

// Tool types
export interface Tool { name: string; description: string; enabled: boolean }

// Memory types
export interface MemoryEntry { id: string; content: string; metadata: Record<string, unknown>; createdAt: string }

// Log types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogEntry { id: string; level: LogLevel; message: string; timestamp: string; correlationId?: string; data?: unknown }

// Event types
export interface AiOSEvent { id: string; type: string; timestamp: string; payload: unknown; source: string; correlationId: string }
