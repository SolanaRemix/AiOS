// ===== User & Auth =====
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type UserRole = "super_admin" | "admin" | "developer" | "viewer";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  company?: string;
}

// ===== Tenant =====
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: PlanType;
  status: "active" | "suspended" | "trial";
  userCount: number;
  projectCount: number;
  apiCallsThisMonth: number;
  costThisMonth: number;
  createdAt: string;
  settings: TenantSettings;
}

export interface TenantSettings {
  allowedModels: string[];
  maxProjects: number;
  maxAgents: number;
  monthlyTokenLimit: number;
}

export type PlanType = "free" | "pro" | "enterprise";

// ===== Project =====
export interface Project {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  status: ProjectStatus;
  language: string;
  agentCount: number;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  files?: ProjectFile[];
}

export type ProjectStatus = "active" | "paused" | "archived";

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  updatedAt: string;
}

// ===== Agent =====
export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  projectId: string;
  currentTask?: string;
  completedTasks: number;
  successRate: number;
  avgResponseTime: number;
  model: string;
  lastActive: string;
  metadata?: Record<string, unknown>;
}

export type AgentRole =
  | "orchestrator"
  | "code_generator"
  | "code_reviewer"
  | "debugger"
  | "tester"
  | "documenter"
  | "security_auditor"
  | "devops"
  | "data_analyst";

export type AgentStatus = "active" | "idle" | "busy" | "error" | "offline";

// ===== LLM Models =====
export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  avgLatency: number;
  capabilities: string[];
  isAvailable: boolean;
}

// ===== Chat / Messages =====
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  model?: string;
  agentId?: string;
  tokens?: number;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  projectId: string;
  messages: Message[];
  model: string;
  agentType: AgentRole;
  createdAt: string;
}

// ===== Usage & Stats =====
export interface UsageStats {
  period: string;
  apiCalls: number;
  tokensUsed: number;
  cost: number;
  activeProjects: number;
  activeAgents: number;
}

export interface UsageDataPoint {
  date: string;
  tokens: number;
  cost: number;
  calls: number;
}

export interface DashboardStats {
  totalProjects: number;
  activeAgents: number;
  apiCallsToday: number;
  costThisMonth: number;
  projectsDelta: number;
  agentsDelta: number;
  apiCallsDelta: number;
  costDelta: number;
}

// ===== Activity =====
export interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  projectId?: string;
  projectName?: string;
  agentId?: string;
  agentName?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type ActivityType =
  | "project_created"
  | "project_updated"
  | "agent_task_completed"
  | "agent_error"
  | "deployment"
  | "api_key_created"
  | "user_invited"
  | "model_switched";

// ===== Billing =====
export interface Invoice {
  id: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  period: string;
  createdAt: string;
  pdfUrl?: string;
}

export interface BillingInfo {
  plan: PlanType;
  billingEmail: string;
  nextBillingDate: string;
  currentUsage: {
    tokens: number;
    tokenLimit: number;
    apiCalls: number;
    apiCallLimit: number;
    cost: number;
  };
  invoices: Invoice[];
}

// ===== API Keys =====
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed?: string;
  createdAt: string;
  permissions: string[];
  isActive: boolean;
}

// ===== Team Members =====
export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "pending" | "inactive";
  joinedAt: string;
  avatar?: string;
}

// ===== Notifications =====
export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

// ===== API Responses =====
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== Forms =====
export interface ProjectCreateForm {
  name: string;
  description?: string;
  language: string;
  tags?: string[];
}

export interface ProfileUpdateForm {
  name: string;
  email: string;
  avatar?: string;
}
