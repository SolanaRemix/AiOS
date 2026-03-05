# AiOS SDK Guide

Developer guide for building custom agents on the AiOS platform.

---

## Installation and Setup

### Prerequisites

- Node.js 18+
- An AiOS API server running (see [DEPLOYMENT.md](./DEPLOYMENT.md))
- Your AiOS API key (obtain from the dashboard or via `POST /auth/api-keys`)

### Install the SDK

```bash
npm install @aios/sdk
```

Or if you are building inside the AiOS monorepo:

```bash
# From the repo root
npm install   # installs all workspace packages
```

### Initialize the Client

```typescript
import { AiOSClient } from '@aios/sdk';

const client = new AiOSClient({
  apiUrl: process.env.AIOS_API_URL ?? 'http://localhost:3001',
  apiKey: process.env.AIOS_API_KEY,
});
```

---

## Creating Your First Agent

The simplest way to define a custom agent is to extend `BaseAgent`:

```typescript
import { BaseAgent, AgentContext, AgentResult } from '@aios/sdk';

export class GreetingAgent extends BaseAgent {
  name = 'greeting-agent';
  description = 'A simple agent that greets the user';

  async run(context: AgentContext): Promise<AgentResult> {
    const { userMessage, memory, llm } = context;

    const response = await llm.complete({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a friendly greeter. Keep responses short.' },
        { role: 'user', content: userMessage },
      ],
    });

    await memory.shortTerm.append({ role: 'assistant', content: response.text });

    return {
      output: response.text,
      exitCode: 0,
    };
  }
}
```

### Register and Run

```typescript
import { AgentRegistry } from '@aios/sdk';

AgentRegistry.register(GreetingAgent);

const process = await client.agents.spawn('greeting-agent', {
  userMessage: 'Hello!',
});

console.log(process.output); // "Hello! Great to see you!"
```

---

## Using AgentBuilder

`AgentBuilder` provides a fluent API to configure agents without subclassing, useful for quickly composing agents from existing building blocks:

```typescript
import { AgentBuilder } from '@aios/sdk';

const researchAgent = AgentBuilder.create('quick-researcher')
  .description('Researches a topic and returns a summary')
  .model('claude-3-5-sonnet-20241022')
  .temperature(0.3)
  .maxTokens(2048)
  .systemPrompt(`You are a research assistant. When given a topic:
1. Break it into key subtopics
2. Summarize current knowledge on each
3. Cite sources where possible`)
  .tools(['web_search', 'calculator'])
  .memory({ shortTermTokens: 4096, longTermEnabled: true })
  .build();

AgentRegistry.register(researchAgent);
```

### Builder Method Reference

| Method | Type | Description |
|---|---|---|
| `.model(name)` | `string` | LLM model identifier |
| `.temperature(t)` | `0.0–2.0` | Sampling temperature |
| `.maxTokens(n)` | `number` | Max output tokens |
| `.systemPrompt(text)` | `string` | System instruction prepended to every conversation |
| `.tools(names[])` | `string[]` | Names of tools to bind (must be registered in ToolRegistry) |
| `.memory(opts)` | `MemoryOptions` | Configure short-term and long-term memory |
| `.onStart(fn)` | `lifecycle hook` | Called when agent process starts |
| `.onStop(fn)` | `lifecycle hook` | Called when agent process stops |
| `.onError(fn)` | `error hook` | Called on unhandled errors |

---

## Tool Bindings

Agents can only execute tools that are explicitly bound to them. This is both a security boundary and a way to communicate to the LLM what capabilities it has.

### Binding Built-In Tools

```typescript
const agent = AgentBuilder.create('analyst')
  .tools([
    'calculator',        // arithmetic
    'date_time',         // current date/time
    'web_search',        // internet search
    'code_interpreter',  // run Python/JS code
  ])
  .build();
```

### Creating and Binding a Custom Tool

```typescript
import { defineTool, ToolRegistry } from '@aios/sdk';

const stockPriceTool = defineTool({
  name: 'get_stock_price',
  description: 'Returns the current stock price for a given ticker symbol',
  inputSchema: {
    type: 'object',
    properties: {
      ticker: { type: 'string', description: 'Stock ticker, e.g. AAPL' },
    },
    required: ['ticker'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      ticker: { type: 'string' },
      price: { type: 'number' },
      currency: { type: 'string' },
    },
  },
  async handler({ ticker }) {
    const data = await fetchStockPrice(ticker); // your implementation
    return { ticker, price: data.price, currency: 'USD' };
  },
});

ToolRegistry.register(stockPriceTool);

const tradingAgent = AgentBuilder.create('trading-analyst')
  .tools(['get_stock_price', 'calculator'])
  .build();
```

---

## Memory Access

Agents can read and write both short-term and long-term memory within their `run()` method via the `context.memory` handle.

### Short-Term Memory

Short-term memory is the conversation buffer for the current session:

```typescript
async run(context: AgentContext) {
  const { memory } = context;

  // Read recent messages
  const history = await memory.shortTerm.getMessages();

  // Append a message
  await memory.shortTerm.append({ role: 'assistant', content: 'Here is my analysis...' });

  // Clear the buffer (rarely needed)
  await memory.shortTerm.clear();
}
```

### Long-Term Memory (Vector Store)

Long-term memory persists across sessions and supports semantic search:

```typescript
async run(context: AgentContext) {
  const { memory, userMessage } = context;

  // Search for relevant memories
  const relevant = await memory.longTerm.search(userMessage, { topK: 5 });
  const context_text = relevant.map(m => m.content).join('\n');

  // Store a new memory
  await memory.longTerm.upsert(
    'User prefers concise responses and uses TypeScript',
    { type: 'user_preference', confidence: 0.9 }
  );

  // Build prompt with memory context
  const prompt = `Relevant context:\n${context_text}\n\nUser: ${userMessage}`;
}
```

### MemoryAccessAPI Reference

```typescript
interface MemoryAccessAPI {
  shortTerm: {
    getMessages(): Promise<Message[]>;
    append(message: Message): Promise<void>;
    getTokenCount(): Promise<number>;
    clear(): Promise<void>;
  };
  longTerm: {
    search(query: string, options?: { topK?: number; minScore?: number }): Promise<MemoryEntry[]>;
    upsert(content: string, metadata?: object): Promise<string>;
    delete(id: string): Promise<void>;
  };
}
```

---

## Event Subscriptions

Agents can subscribe to platform events to react to system-wide changes, or emit events for other agents or services to consume.

### Subscribing to Events

```typescript
import { EventBus } from '@aios/sdk';

// Subscribe to all tool executions
const unsubscribe = EventBus.subscribe('agent.tool.*', (event) => {
  console.log(`Tool ${event.payload.toolName} executed in ${event.payload.durationMs}ms`);
});

// Subscribe to agent lifecycle events
EventBus.subscribe('agent.lifecycle.stopped', async (event) => {
  console.log(`Agent ${event.source} stopped with code ${event.payload.exitCode}`);
  // Trigger follow-up actions
});

// Unsubscribe when done
unsubscribe();
```

### Emitting Custom Events

```typescript
async run(context: AgentContext) {
  const { events, correlationId } = context;

  await events.emit({
    type: 'agent.output.analysis_complete',
    payload: {
      summary: '...',
      confidence: 0.87,
    },
    correlationId,
  });
}
```

### Subscribing Inside an Agent

Use the `onEvent` decorator or hook to wire event handlers to your agent class:

```typescript
import { BaseAgent, onEvent } from '@aios/sdk';

export class WatcherAgent extends BaseAgent {
  name = 'watcher';

  @onEvent('system.health.degraded')
  async handleDegradedHealth(event) {
    await this.alert(`System health degraded: ${event.payload.service}`);
  }

  async run(context: AgentContext) {
    // Main logic
  }
}
```

---

## Deployment

### Registering with AgentRegistry

Before an agent can be spawned, it must be registered with the `AgentRegistry`. In the monorepo, agent registrations live in `core/agents/registry.ts`:

```typescript
// core/agents/registry.ts
import { AgentRegistry } from '@aios/sdk';
import { GreetingAgent } from './greeting/GreetingAgent';
import { TradingAgent } from './trading/TradingAgent';

AgentRegistry.register(GreetingAgent);
AgentRegistry.register(TradingAgent);
```

### Registering via the API

For dynamic agent registration (e.g., user-defined agents), use the REST API:

```bash
curl -X POST http://localhost:3001/agents/register \
  -H "Authorization: Bearer $AIOS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-custom-agent",
    "description": "Does something useful",
    "model": "gpt-4o",
    "tools": ["web_search"],
    "systemPrompt": "You are a helpful assistant."
  }'
```

### Spawning Agents at Runtime

```typescript
// Spawn a new agent process
const proc = await client.agents.spawn('my-custom-agent', {
  userMessage: 'Research the latest AI news',
  config: {
    temperature: 0.5,
  },
});

// Stream output
for await (const chunk of proc.stream()) {
  process.stdout.write(chunk.text);
}

// Or wait for completion
const result = await proc.wait();
console.log(result.output);
```

### Environment Variables for SDK

| Variable | Required | Description |
|---|---|---|
| `AIOS_API_URL` | Yes | URL of the AiOS API server |
| `AIOS_API_KEY` | Yes | API key for authentication |
| `AIOS_DEFAULT_MODEL` | No | Fallback model if none specified (default: `gpt-4o-mini`) |
| `AIOS_LOG_LEVEL` | No | SDK log verbosity (`debug`, `info`, `warn`, `error`) |
