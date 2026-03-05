# AiOS System Design

Detailed design specification for the core subsystems of the AiOS platform.

---

## Kernel Design

The AiOS Kernel is the central runtime responsible for agent process management, context switching, and syscall dispatch. It is deliberately modeled on Unix process semantics to provide a familiar mental model for developers.

### Process Management

Each agent instance is represented as an **AgentProcess** in the Kernel's process table:

```
ProcessTable
├── pid: string (UUID)
├── agentId: string
├── state: AgentState
├── createdAt: Date
├── cpu: number         (estimated LLM token budget used)
├── memory: MemoryHandle
└── channels: string[]  (subscribed event channels)
```

The Kernel exposes the following process operations:

| Operation | Description |
|---|---|
| `spawn(agentConfig)` | Create and start a new agent process |
| `fork(pid)` | Clone an existing agent process with its context |
| `kill(pid, signal)` | Terminate an agent process (SIGTERM waits for cleanup, SIGKILL is immediate) |
| `suspend(pid)` | Pause a running process (preserves context in Redis) |
| `resume(pid)` | Resume a suspended process |
| `wait(pid)` | Block until a process completes and return its exit value |
| `ps()` | List all processes and their states |

### Context Switching

When an agent is suspended, its full execution context is serialized and written to Redis:

```json
{
  "pid": "proc_abc123",
  "conversationHistory": [...],
  "pendingToolCalls": [...],
  "memorySnapshot": { "shortTerm": [...] },
  "resumeAt": "2024-01-01T00:00:00Z"
}
```

On resume, the Kernel loads this snapshot and reconstructs the agent's in-memory state before continuing execution. This enables long-running multi-step agents to survive API server restarts.

### Syscall Dispatch

Agents communicate with the Kernel through a typed syscall interface rather than directly accessing infrastructure. This provides a clean abstraction and enables the Kernel to enforce policies:

```typescript
// Agent code — never touches database or Redis directly
const result = await syscall('memory.read', { scope: 'long-term', query: 'user preferences' });
const output = await syscall('tool.execute', { name: 'web_search', args: { query: 'Node.js docs' } });
await syscall('event.emit', { channel: 'agent.output', payload: { text: output } });
```

Syscall categories: `memory.*`, `tool.*`, `event.*`, `process.*`, `llm.*`

---

## Agent Lifecycle

```
         ┌──────────────┐
         │   CREATED    │  ← AgentProcess entry exists in DB, not yet running
         └──────┬───────┘
                │ spawn()
                ▼
         ┌──────────────┐
         │ INITIALIZING │  ← Loading config, connecting to memory, registering tools
         └──────┬───────┘
                │ ready
                ▼
         ┌──────────────┐
    ┌───►│   RUNNING    │  ← Actively processing, invoking LLM, executing tools
    │    └──────┬───────┘
    │           │
    │    ┌──────▼───────┐
    │    │    PAUSED    │  ← Waiting for user input, rate limit backoff, or explicit suspend()
    │    └──────┬───────┘
    │           │ resume()
    └───────────┘
                │ kill() / task complete
                ▼
         ┌──────────────┐
         │   STOPPED    │  ← Final state; context flushed to long-term memory
         └──────────────┘
                │ unrecoverable error
                ▼
         ┌──────────────┐
         │    FAILED    │  ← Error captured; process table entry retained for diagnostics
         └──────────────┘
```

State transitions are atomic (using Redis SETNX for distributed locking) to prevent race conditions when multiple API server instances operate on the same agent.

---

## Multi-Model Routing

AiOS presents a single unified `LLMProvider` interface to all agents, hiding provider-specific SDKs behind a common contract:

```typescript
interface LLMProvider {
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  stream(request: CompletionRequest): AsyncIterable<CompletionChunk>;
  embed(texts: string[]): Promise<number[][]>;
}
```

### Provider Implementations

| Provider | Adapter Class | Notes |
|---|---|---|
| OpenAI | `OpenAIProvider` | GPT-4o, GPT-4-turbo, o1 series |
| Anthropic | `AnthropicProvider` | Claude 3.5 Sonnet, Claude 3 Opus |
| Groq | `GroqProvider` | Llama 3, Mixtral — fast inference |
| Ollama | `OllamaProvider` | Local models, no API key required |

### Routing Logic

The `ModelRouter` selects a provider based on the model name prefix in the agent's configuration:

```
gpt-*       → OpenAIProvider
claude-*    → AnthropicProvider
llama-*     → GroqProvider  (or OllamaProvider if local=true)
mixtral-*   → GroqProvider
ollama/*    → OllamaProvider
```

Fallback chains are configurable — if a provider returns a 429 (rate limit) or 503 (unavailable), the router can automatically retry with a fallback provider.

### Tool Call Normalization

Each provider has a different format for tool/function calling. The `ToolCallNormalizer` converts provider-specific formats into a unified `ToolCall[]` structure before passing to the Tool Executor, and converts results back to the provider's expected format.

---

## Memory Architecture

AiOS implements a two-tier memory model inspired by human cognition:

### Short-Term Memory (Conversation Buffer)

- Stores the immediate conversation history for an active agent session
- Implemented as an in-process circular buffer with a configurable token budget (default: 8,192 tokens)
- When the buffer approaches its limit, older messages are summarized and evicted via a background summarization step
- Persisted to Redis with a TTL matching the agent's idle timeout

```
ConversationBuffer
├── maxTokens: number
├── messages: Message[]
├── tokenCount: number
└── summarize(): Promise<void>   // LLM-backed summarization
```

### Long-Term Memory (Vector Store)

- Stores important facts, past conversation summaries, and user preferences
- Implemented using a vector database (pgvector extension on PostgreSQL)
- Text is embedded using the configured embedding model (default: `text-embedding-3-small`)
- Retrieval uses cosine similarity search with a configurable top-K and minimum score threshold

```
VectorStore
├── upsert(content: string, metadata: object): Promise<string>  // returns doc ID
├── search(query: string, topK?: number): Promise<MemoryEntry[]>
├── delete(id: string): Promise<void>
└── namespace: string   // per-user or per-agent isolation
```

### Memory Access Hierarchy

```
Agent
  └─► MemoryManager
        ├─► ShortTermBuffer   (fast, in-process, token-limited)
        └─► VectorStore       (persistent, semantic search, unlimited)
```

Agents access memory exclusively through `MemoryManager`, which decides automatically whether to read from short-term or perform a vector search based on the query type.

---

## Event Bus Design

The AiOS Event Bus provides decoupled communication between all platform components. It is built on Redis Pub/Sub for cross-instance delivery and an in-process EventEmitter for low-latency local events.

### Event Schema

Every event on the bus conforms to the following envelope:

```typescript
interface AiOSEvent<T = unknown> {
  id: string;            // UUID — unique event identifier
  correlationId: string; // Groups related events (e.g., one user request)
  causationId?: string;  // ID of the event that caused this event
  type: string;          // Namespaced event type, e.g. "agent.tool.executed"
  source: string;        // Emitter identifier (e.g., "agent/proc_abc123")
  timestamp: Date;
  payload: T;
}
```

### Event Channels

| Channel Pattern | Description |
|---|---|
| `agent.lifecycle.*` | Agent state transitions (created, started, stopped, failed) |
| `agent.output.*` | Streamed and final outputs from agents |
| `agent.tool.*` | Tool invocation start, completion, and errors |
| `system.health.*` | Service health check results |
| `user.request.*` | Incoming user requests and their completion |
| `memory.updated` | Triggered when long-term memory is written |

### Correlation ID Tracing

Every user request is assigned a `correlationId` at the API layer. This ID is propagated through all events triggered by that request — LLM calls, tool executions, memory reads/writes. This enables complete end-to-end tracing of a single user interaction across all subsystems.

### Pub/Sub Architecture

```
Publisher (any service)
      │
      ▼
Redis Channel (e.g., "aios:agent.output.stream")
      │
      ├──► Subscriber: API Server (forwards to WebSocket clients)
      ├──► Subscriber: Monitoring Service (records metrics)
      └──► Subscriber: Audit Logger (writes to DB)
```

---

## Tool Execution Sandbox

The Tool Executor enforces a strict validate → execute → result pipeline for every tool call to ensure safety and correctness.

### Execution Pipeline

```
1. RECEIVE ToolCall from LLM response
       │
       ▼
2. LOOKUP tool in ToolRegistry
   - Tool not found → return error to LLM
       │
       ▼
3. VALIDATE input args against tool's JSON Schema
   - Invalid → return validation error to LLM (not thrown as exception)
       │
       ▼
4. AUTHORIZE
   - Check agent has permission to use this tool
   - Check rate limit for this tool
       │
       ▼
5. EXECUTE in sandbox
   - Timeout enforced (default 30s)
   - For code execution: containerized subprocess (no outbound network by default)
   - For web search: proxy through allow-listed domains
       │
       ▼
6. VALIDATE output against tool's output schema (optional)
       │
       ▼
7. RETURN ToolResult to Agent Executor
   - Append to conversation context
   - Emit "agent.tool.executed" event
```

### Tool Categories and Sandboxing Levels

| Category | Sandbox Level | Description |
|---|---|---|
| Pure computation (calculator, date) | None | In-process, no I/O |
| File operations | Chroot jail | Restricted to agent's working directory |
| Web search / HTTP | Network proxy | Allow-listed domains, no local network |
| Code execution | Container (gVisor) | Isolated container, read-only filesystem, no network |
| Database queries | Prepared statements only | No DDL, row-level security applied |

### ToolRegistry

Tools are registered at startup and are immutable at runtime:

```typescript
toolRegistry.register({
  name: 'web_search',
  description: 'Search the web for information',
  schema: {
    input: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    output: { type: 'array', items: { type: 'object' } }
  },
  handler: webSearchHandler,
  permissions: ['network:read'],
  timeout: 15000,
});
```
