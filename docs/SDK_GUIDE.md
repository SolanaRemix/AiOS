# AiOS SDK Guide

Developer guide for building custom agents on the AiOS platform.

---

## Installation and Setup

### Prerequisites

- Node.js 18+
- An AiOS API server running (see [DEPLOYMENT.md](./DEPLOYMENT.md))
- Your AiOS API key (obtain from the dashboard or via `POST /auth/api-keys`)

### Install the SDK

The AiOS SDK is part of the `@aios/core` package in this monorepo:

```bash
# From the repo root
npm install   # installs all workspace packages
```

To use `@aios/core` in your own project:

```bash
npm install @aios/core
```

### Import the Core Module

```typescript
import { BaseAgent, AgentBuilder, AgentRegistry, AgentExecutor } from '@aios/core';
import { ToolRegistry, calculatorTool, webSearchTool } from '@aios/core';
import { MemoryManager } from '@aios/core';
import { EventBus, EventTypes, withCorrelationId } from '@aios/core';
```

---

## Creating Your First Agent

The simplest way to define a custom agent is to extend `BaseAgent`:

```typescript
import { BaseAgent } from '@aios/core';

export class GreetingAgent extends BaseAgent {
  readonly name = 'greeting-agent';
  readonly description = 'A simple agent that greets the user';

  async onStart(): Promise<void> {
    // Optional: set up resources before running
  }

  async onStop(): Promise<void> {
    // Optional: clean up resources
  }
}
```

### Run via AgentExecutor

```typescript
import { AgentExecutor, AgentRegistry, createGeneralAgent } from '@aios/core';

const registry = new AgentRegistry();
const executor = new AgentExecutor();

// Use a built-in template
const agent = createGeneralAgent();
registry.register(agent);

// Execute with input
const result = await executor.execute(agent, 'Hello!', {
  correlationId: 'req-123',
  userId: 'user-456',
});
```

---

## Using AgentBuilder

`AgentBuilder` provides a fluent API to configure agents without subclassing, useful for quickly composing agents from existing building blocks:

```typescript
import { AgentBuilder, AgentRegistry } from '@aios/core';

const researchAgent = new AgentBuilder('quick-researcher')
  .withName('Quick Researcher')
  .withDescription('Researches a topic and returns a summary')
  .withModel('claude-3-5-sonnet-20241022')
  .withMaxTokens(2048)
  .withSystemPrompt(`You are a research assistant. When given a topic:
1. Break it into key subtopics
2. Summarize current knowledge on each
3. Cite sources where possible`)
  .withTools(['webSearch', 'urlFetch'])
  .build();

const registry = new AgentRegistry();
registry.register(researchAgent);
```

### Builder Method Reference

| Method | Type | Description |
|---|---|---|
| `withName(name)` | `string` | Human-readable agent name |
| `withDescription(text)` | `string` | Purpose description |
| `withModel(name)` | `string` | LLM model identifier |
| `withMaxTokens(n)` | `number` | Max output tokens |
| `withSystemPrompt(text)` | `string` | System instruction prepended to every conversation |
| `withTools(names[])` | `string[]` | Names of tools to bind (must be registered in ToolRegistry) |
| `withMemory(opts)` | `Partial<MemoryOptions>` | Configure short-term and long-term memory |

---

## Tool Bindings

Agents can only execute tools that are explicitly bound to them. This is both a security boundary and a way to communicate to the LLM what capabilities it has.

### Binding Built-In Tools

```typescript
import { AgentBuilder } from '@aios/core';

const agent = new AgentBuilder('analyst')
  .withName('Analyst')
  .withTools(['calculator', 'dateTime', 'webSearch'])
  .withModel('gpt-4o-mini')
  .build();
```

### Creating and Binding a Custom Tool

```typescript
import { Tool, ToolRegistry } from '@aios/core';

const stockPriceTool: Tool = {
  name: 'get_stock_price',
  description: 'Returns the current stock price for a given ticker symbol',
  schema: {
    type: 'object',
    properties: {
      ticker: { type: 'string', description: 'Stock ticker, e.g. AAPL' },
    },
    required: ['ticker'],
  },
  async execute(args) {
    const ticker = args['ticker'] as string;
    const data = await fetchStockPrice(ticker); // your implementation
    return { success: true, output: { ticker, price: data.price, currency: 'USD' } };
  },
};

const registry = new ToolRegistry();
registry.register(stockPriceTool);

const tradingAgent = new AgentBuilder('trading-analyst')
  .withName('Trading Analyst')
  .withTools(['get_stock_price', 'calculator'])
  .withModel('gpt-4o-mini')
  .build();
```

---

## Memory Access

Agents can read and write both short-term and long-term memory via `MemoryManager`:

### Short-Term Memory

Short-term memory is the conversation buffer for the current session:

```typescript
import { MemoryManager } from '@aios/core';

const memory = new MemoryManager();

// Add a message for an agent
memory.addMessage('agent-1', { role: 'user', content: 'Hello!' });
memory.addMessage('agent-1', { role: 'assistant', content: 'Hi there!' });

// Retrieve recent messages (returns Message[])
const messages = memory.getContext('agent-1');
console.log(messages); // [{ role: 'user', content: 'Hello!', timestamp: '...' }, ...]

// Clear short-term memory
memory.clearShortTerm('agent-1');
```

### Long-Term Memory

Long-term memory persists entries and supports similarity search:

```typescript
import { LongTermMemory } from '@aios/core';

const ltm = new LongTermMemory();

// Store a memory
const id = ltm.store('User prefers concise responses', { type: 'user_preference' });

// Search for relevant memories (Jaccard similarity)
const results = ltm.search('user preferences', 5);
console.log(results.map(r => r.entry.content));

// Delete a specific entry
ltm.delete(id);
```

---

## Event Subscriptions

Agents can subscribe to platform events to react to system-wide changes, or emit events for other agents or services to consume.

### Subscribing to Events

```typescript
import { EventBus, EventTypes } from '@aios/core';

const bus = new EventBus();

// Subscribe to tool executions
const sub = bus.on(EventTypes.TOOL_EXECUTED, (event) => {
  console.log(`Tool executed:`, event.payload);
});

// Subscribe to agent lifecycle events
bus.on(EventTypes.AGENT_STOPPED, (event) => {
  console.log(`Agent ${event.source} stopped`);
});

// Unsubscribe when done
sub.unsubscribe();
```

### Emitting Custom Events

```typescript
import { EventBus, withCorrelationId, generateCorrelationId } from '@aios/core';

const bus = new EventBus();
const correlationId = generateCorrelationId();

await withCorrelationId(correlationId, async () => {
  bus.emit({
    type: 'agent:output',
    payload: { summary: '...', confidence: 0.87 },
    source: 'my-agent',
  });
  // The emitted event automatically carries `correlationId`
});
```

### One-Time Subscriptions

```typescript
// Fire once, then auto-unsubscribe
bus.once(EventTypes.AGENT_STARTED, (event) => {
  console.log('First agent started:', event.source);
});
```

---

## Deployment

### Registering with AgentRegistry

Before an agent can be discovered, it must be registered with an `AgentRegistry` instance:

```typescript
import { AgentRegistry, AgentExecutor, createCodingAgent } from '@aios/core';

const registry = new AgentRegistry();
const executor = new AgentExecutor();

// Register a built-in template
const codingAgent = createCodingAgent();
registry.register(codingAgent);

// Look up later
const agent = registry.get(codingAgent.id);
if (agent) {
  const result = await executor.execute(agent, 'Write a fizzbuzz in Python', {
    correlationId: 'req-789',
  });
  console.log(result.output);
}

// List all registered agents
const all = registry.list();
console.log(all.map(a => a.name));
```

### Registering via the API

For dynamic agent registration via REST:

```bash
curl -X POST http://localhost:4000/agents \
  -H "Authorization: Bearer $AIOS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-custom-agent",
    "description": "Does something useful",
    "model": "gpt-4o",
    "systemPrompt": "You are a helpful assistant."
  }'
```

### Environment Variables for LLM Providers

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Conditional | Required when routing to OpenAI models |
| `ANTHROPIC_API_KEY` | Conditional | Required when routing to Anthropic models |
| `GROQ_API_KEY` | Conditional | Required when routing to Groq models |
| `OLLAMA_BASE_URL` | No | Base URL for local Ollama server (default: `http://localhost:11434`) |
| `SEARCH_API_KEY` | No | API key for the web search tool |
