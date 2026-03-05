# AiOS Architecture

## System Overview

AiOS is an LLM-driven operating system abstraction layer that brings the paradigm of a traditional OS — processes, memory management, I/O, and scheduling — to AI agent orchestration. Instead of managing CPU threads and file descriptors, the AiOS Kernel manages agent lifecycles, context windows, tool dispatch, and inter-agent communication.

At its core, AiOS provides:

- **Agent execution runtime** — spawn, suspend, resume, and terminate agents as first-class processes
- **Unified LLM interface** — route requests to OpenAI, Anthropic, Groq, or locally-hosted Ollama models transparently
- **Tool sandbox** — validated, isolated execution of tools (code, web search, file I/O, etc.)
- **Shared memory bus** — short-term conversation buffers and long-term vector-backed memory stores
- **Event system** — pub/sub event bus with correlation IDs for tracing and orchestration

---

## Monorepo Structure

```
AiOS/
├── apps/
│   ├── web/          # Next.js 15 frontend dashboard
│   └── api/          # Express.js REST + WebSocket API server
├── core/             # Shared kernel, SDK, and runtime packages
│   ├── kernel/       # Agent scheduler, syscall dispatcher, process table
│   ├── sdk/          # Developer SDK: BaseAgent, AgentBuilder, decorators
│   ├── agents/       # Pre-built agents (LLM, Research, Coding, Automation, Terminal)
│   ├── tools/        # Built-in tools + tool registry
│   ├── memory/       # Memory adapters (in-memory, Redis, vector store)
│   └── events/       # Event bus implementation
├── mobile/           # React Native / Expo mobile client
├── lib/              # Shared utility libraries (auth, logging, config)
├── types/            # TypeScript type definitions shared across packages
├── config/           # Environment configuration, feature flags
├── docs/             # Documentation
├── k8s/              # Kubernetes manifests
└── scripts/          # Dev tooling, bootstrap, migration helpers
```

The monorepo is managed with **Turborepo** (`turbo.json`), enabling incremental builds, remote caching, and parallel task execution across packages.

---

## Core Modules Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        AiOS Platform                         │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────────┐  │
│  │  Web UI  │    │  Mobile  │    │     External API      │  │
│  │(Next.js) │    │  (Expo)  │    │    (REST/WebSocket)   │  │
│  └────┬─────┘    └────┬─────┘    └──────────┬───────────┘  │
│       └───────────────┴──────────────────────┘              │
│                             │                               │
│                    ┌────────▼────────┐                      │
│                    │    API Server   │                      │
│                    │  (Express.js)   │                      │
│                    └────────┬────────┘                      │
│                             │                               │
│               ┌─────────────▼─────────────┐                │
│               │          KERNEL            │                │
│               │  (Scheduler / Dispatcher)  │                │
│               └──┬──────┬──────┬──────┬───┘                │
│                  │      │      │      │                     │
│            ┌─────▼──┐ ┌─▼───┐ ┌▼────┐ ┌▼──────┐           │
│            │  SDK   │ │Agents│ │Tools│ │Memory │           │
│            │(Builder│ │(LLM, │ │(Calc│ │(Short │           │
│            │ Base   │ │Code, │ │Web, │ │ Term +│           │
│            │ Agent) │ │Term) │ │File)│ │Vector)│           │
│            └────────┘ └──┬──┘ └──┬──┘ └───┬───┘           │
│                          │       │         │               │
│               ┌──────────▼───────▼─────────▼──────┐        │
│               │            Event Bus               │        │
│               │        (Pub/Sub + Correlation)     │        │
│               └───────────────────────────────────┘        │
│                                                             │
│  ┌──────────────┐   ┌────────────┐   ┌──────────────────┐  │
│  │  PostgreSQL  │   │   Redis    │   │   LLM Providers  │  │
│  │  (Prisma ORM)│   │(Cache/PubSub│  │OpenAI│Anthropic  │  │
│  └──────────────┘   └────────────┘  │Groq  │Ollama     │  │
│                                      └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### User Request → Response

```
1. User Input
      │
      ▼
2. API Server (Express.js)
   - Authenticate JWT
   - Rate limit check
   - Validate request schema
      │
      ▼
3. Kernel Dispatcher
   - Resolve target agent or create new agent process
   - Attach conversation context from Memory
   - Emit REQUEST event on Event Bus
      │
      ▼
4. Agent Executor
   - Load agent configuration (model, tools, system prompt)
   - Construct prompt with memory context
   - Invoke LLM Provider via unified adapter
      │
      ▼
5. LLM Provider (OpenAI / Anthropic / Groq / Ollama)
   - Model inference
   - Tool call detection (function calling / tool use)
      │
      ▼
6. Tool Execution Loop (if tool calls present)
   - Validate tool call against schema
   - Execute in sandbox
   - Append tool results to context
   - Re-invoke LLM if required (multi-step)
      │
      ▼
7. Response Assembly
   - Strip internal reasoning if configured
   - Store assistant turn in Memory
   - Emit RESPONSE event on Event Bus
      │
      ▼
8. API Response → Client
   - Stream via SSE/WebSocket or return JSON
   - Update agent state in database
```

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js | 15.x |
| Mobile | Expo / React Native | ~51.0 / 0.74 |
| API Server | Express.js | 4.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 16+ |
| Cache / PubSub | Redis | 7+ |
| Language | TypeScript | 5.x |
| Build System | Turborepo | latest |
| Containerization | Docker / Docker Compose | latest |
| Orchestration | Kubernetes | 1.28+ |

### LLM Providers

| Provider | Interface |
|---|---|
| OpenAI | REST API via `openai` SDK |
| Anthropic | REST API via `@anthropic-ai/sdk` |
| Groq | OpenAI-compatible REST API |
| Ollama | Local REST API (`http://localhost:11434`) |

---

## Security Model

### Authentication

- **JWT (JSON Web Tokens)** are used for all API authentication
- Tokens are signed with RS256 (asymmetric) in production
- Access tokens expire in 15 minutes; refresh tokens in 7 days
- Tokens are validated on every request via middleware before reaching any handler

### Encryption

- All data at rest in PostgreSQL is encrypted at the volume level
- Sensitive fields (API keys, secrets) are additionally encrypted using AES-256-GCM at the application layer before being stored
- TLS 1.3 is required for all in-transit communication

### Rate Limiting

- Global: 1000 requests/minute per IP
- Per-user: 200 requests/minute
- Agent execution: configurable per agent (default 60 executions/minute)
- Implemented via Redis sliding window counters

### Tool Execution Sandboxing

- All tool executions run in isolated contexts
- Code execution tools use containerized sandboxes (no network, limited filesystem)
- Tool input/output is validated against JSON Schema before and after execution
- Maximum execution time enforced (default 30 seconds per tool call)
- Allowlist-based tool registration — only registered tools can be invoked

### API Key Management

- Third-party API keys (OpenAI, Anthropic, etc.) are stored encrypted in the database
- Keys are decrypted in-memory only at the moment of use and never logged
- Per-user key isolation ensures users can only access their own credentials

---

## Scalability Considerations

### Horizontal Scaling

- The API server is stateless — any number of instances can be run behind a load balancer
- Agent state is persisted in PostgreSQL and cached in Redis, not in process memory
- Docker and Kubernetes manifests in `k8s/` support multi-replica deployments

### Redis Pub/Sub

- The Event Bus is backed by Redis Pub/Sub channels
- Cross-instance agent events (e.g., agent A on server 1 communicating with agent B on server 2) are routed through Redis
- Each event carries a correlation ID enabling distributed tracing

### Message Queues

- Long-running agent tasks are queued via a Redis-backed job queue (BullMQ)
- Workers can be scaled independently from the API tier
- Job priorities allow interactive queries to preempt batch background tasks

### Database Connection Pooling

- Prisma uses PgBouncer-compatible connection pooling
- In Kubernetes, a PgBouncer sidecar is recommended for large-scale deployments

### Caching Strategy

- LLM provider responses are cached in Redis by a hash of (model + prompt + temperature=0) to reduce redundant API calls
- Agent configurations and tool schemas are cached with a short TTL to avoid repeated database reads
- Vector store queries are cached by embedding similarity bucket
