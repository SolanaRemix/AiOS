# AiOS Agent Guide

Guide for using the pre-built agents included in the AiOS platform.

---

## Pre-Built Agents Overview

AiOS ships with a set of ready-to-use agents covering the most common AI automation needs. All pre-built agents are located in `core/agents/` and are registered automatically at startup.

---

## General LLM Agent

**Name:** `llm-agent`  
**Location:** `core/agents/llm/`

A general-purpose conversational assistant backed by any configured LLM. This is the default agent used when no specialized agent is required.

**Capabilities:**
- Multi-turn conversation with full history
- Summarization, Q&A, writing assistance, brainstorming
- Configurable persona via system prompt

**Example usage via API:**

```bash
curl -X POST http://localhost:3001/agents/llm-agent/run \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "message": "Explain the difference between TCP and UDP" }'
```

**Example usage via SDK:**

```typescript
const proc = await client.agents.spawn('llm-agent', {
  userMessage: 'Write a haiku about distributed systems',
  config: { model: 'claude-3-5-sonnet-20241022', temperature: 0.8 },
});
console.log(await proc.wait());
```

---

## Research Agent

**Name:** `research-agent`  
**Location:** `core/agents/research/`

Performs web research on a given topic, synthesizes information from multiple sources, and returns a structured summary with citations.

**Capabilities:**
- Web search and content retrieval
- Multi-source synthesis and deduplication
- Structured output: summary, key findings, citations
- Configurable depth (quick vs. deep research)

**Tools used:** `web_search`, `url_fetch`, `text_summarizer`

**Example:**

```bash
curl -X POST http://localhost:3001/agents/research-agent/run \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the latest developments in quantum computing?",
    "config": { "depth": "deep", "maxSources": 10 }
  }'
```

**Response format:**

```json
{
  "summary": "Quantum computing has seen...",
  "keyFindings": [
    "IBM released a 1000+ qubit processor in 2024",
    "..."
  ],
  "citations": [
    { "title": "IBM Quantum Report", "url": "https://...", "date": "2024-01" }
  ]
}
```

---

## Coding Agent

**Name:** `coding-agent`  
**Location:** `core/agents/coding/`

Specialized in code generation, review, debugging, and explanation. Understands the codebase structure and can reason about multi-file changes.

**Capabilities:**
- Code generation in any language
- Bug identification and fix suggestions
- Code review with actionable feedback
- Explanation of existing code
- Test generation

**Tools used:** `code_interpreter`, `file_read`, `web_search` (for documentation lookup)

**Example:**

```bash
curl -X POST http://localhost:3001/agents/coding-agent/run \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Write a TypeScript function that debounces async functions",
    "config": { "language": "typescript", "includeTests": true }
  }'
```

**Debugging workflow:**

```typescript
const proc = await client.agents.spawn('coding-agent', {
  userMessage: 'Debug this function: ' + buggyCode,
  config: {
    mode: 'debug',    // 'generate' | 'debug' | 'review' | 'explain'
    language: 'python',
  },
});
```

---

## Automation Agent

**Name:** `automation-agent`  
**Location:** `core/agents/automation/`

Plans and executes multi-step workflows. Given a high-level goal, it breaks the goal into subtasks, executes each, and aggregates results. Supports ReAct (Reason + Act) and Plan-and-Execute strategies.

**Capabilities:**
- Goal decomposition into sequential or parallel tasks
- Conditional branching based on intermediate results
- Integration with external APIs via HTTP tool
- Retry and error recovery logic

**Tools used:** `web_search`, `http_request`, `calculator`, `date_time`, `file_write`

**Example:**

```bash
curl -X POST http://localhost:3001/agents/automation-agent/run \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Monitor the GitHub repo octocat/Hello-World and send me a summary of new issues opened in the last 24 hours",
    "config": { "strategy": "plan-execute" }
  }'
```

**Strategy options:**

| Strategy | Description |
|---|---|
| `react` | Interleave reasoning and actions in a single loop (default) |
| `plan-execute` | Generate full plan first, then execute each step |
| `reflexion` | Self-critique and revise plan after each step |

---

## Terminal Agent

**Name:** `terminal-agent`  
**Location:** `core/agents/terminal/`

Executes system commands and scripts, interprets their output, and can chain commands to accomplish file management, environment setup, or DevOps tasks.

> ⚠️ **Security note:** The Terminal Agent operates within a sandboxed environment with a restricted filesystem view and no outbound network by default. It cannot be used to exfiltrate data or compromise the host system.

**Capabilities:**
- Shell command execution (bash, sh)
- File and directory management
- Process management (within sandbox)
- Script generation and execution

**Tools used:** `shell_exec`, `file_read`, `file_write`

**Example:**

```bash
curl -X POST http://localhost:3001/agents/terminal-agent/run \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "List all TypeScript files modified in the last 7 days and count lines of code",
    "config": { "workingDir": "/workspace" }
  }'
```

---

## Agent Configuration Options

All agents accept a shared set of configuration options:

| Option | Type | Default | Description |
|---|---|---|---|
| `model` | `string` | `gpt-4o-mini` | LLM model to use |
| `temperature` | `number` | `0.7` | Sampling temperature (0.0 = deterministic, 2.0 = very random) |
| `maxTokens` | `number` | `2048` | Maximum output tokens |
| `systemPrompt` | `string` | Agent default | Override the system instruction |
| `tools` | `string[]` | Agent default | Override the tool list |
| `maxIterations` | `number` | `10` | Maximum tool-use iterations before stopping |
| `timeout` | `number` | `60000` | Total execution timeout in milliseconds |
| `memoryEnabled` | `boolean` | `true` | Whether to use long-term memory |
| `streamOutput` | `boolean` | `false` | Stream response tokens as they are generated |

---

## Running Agents via CLI

AiOS includes a CLI tool for running agents directly from the terminal:

```bash
# Install globally (or use npx)
npm install -g @aios/cli

# Run an agent
aios run llm-agent "Summarize the history of Unix"

# Run with config overrides
aios run coding-agent "Write a fizzbuzz in Rust" --model gpt-4o --temperature 0

# Stream output
aios run research-agent "Latest news in AI" --stream

# List available agents
aios agents list

# Show agent details
aios agents show research-agent
```

---

## Running Agents via API

### REST API

```
POST /agents/:agentName/run
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "message": "Your input here",
  "sessionId": "optional-session-id-for-continuity",
  "config": { ... }
}
```

Response:

```json
{
  "processId": "proc_abc123",
  "output": "Agent response text...",
  "toolsUsed": ["web_search"],
  "tokensUsed": { "input": 320, "output": 512 },
  "durationMs": 2340
}
```

### Streaming via SSE

```
GET /agents/:processId/stream
Authorization: Bearer <api_key>
Accept: text/event-stream
```

```
data: {"type":"text","content":"The history of "}
data: {"type":"text","content":"Unix begins in "}
data: {"type":"tool_call","toolName":"web_search","args":{"query":"Unix history"}}
data: {"type":"tool_result","toolName":"web_search","summary":"..."}
data: {"type":"done","exitCode":0}
```

---

## Monitoring Agent Execution

### Via Dashboard

The web dashboard (`apps/web`) provides real-time monitoring:
- Active processes table with CPU/memory estimates
- Per-agent execution history and token usage
- Tool call traces with timing breakdowns
- Live output streaming

### Via API

```bash
# Get process status
curl http://localhost:3001/processes/proc_abc123 \
  -H "Authorization: Bearer $API_KEY"

# List all active processes
curl http://localhost:3001/processes?state=running \
  -H "Authorization: Bearer $API_KEY"

# Get execution logs for a process
curl http://localhost:3001/processes/proc_abc123/logs \
  -H "Authorization: Bearer $API_KEY"

# Kill a running process
curl -X DELETE http://localhost:3001/processes/proc_abc123 \
  -H "Authorization: Bearer $API_KEY"
```

### Metrics

AiOS exposes a Prometheus-compatible metrics endpoint:

```
GET /metrics
```

Key metrics:

| Metric | Description |
|---|---|
| `aios_agent_executions_total` | Total agent runs, labeled by agent name and status |
| `aios_agent_duration_seconds` | Agent execution duration histogram |
| `aios_llm_tokens_total` | Total tokens consumed, labeled by provider and model |
| `aios_tool_executions_total` | Tool call counts, labeled by tool name |
| `aios_active_processes` | Current count of running agent processes |
