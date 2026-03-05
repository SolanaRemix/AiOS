# AiOS Tooling Guide

Guide for the AiOS tool system — built-in tools, tool schema, creating custom tools, and safety considerations.

---

## Built-In Tools Overview

AiOS ships with the following tools registered by default. They are available to any agent that lists them in its tool configuration.

| Tool Name | Category | Description |
|---|---|---|
| `calculator` | Computation | Evaluate arithmetic and mathematical expressions |
| `date_time` | Utility | Get current date/time in various formats and timezones |
| `file_read` | File I/O | Read files from the agent's working directory |
| `file_write` | File I/O | Write or append files in the agent's working directory |
| `web_search` | Network | Search the web and return ranked results |
| `url_fetch` | Network | Fetch and extract text content from a URL |
| `code_interpreter` | Execution | Execute Python or JavaScript code in an isolated sandbox |
| `shell_exec` | Execution | Run shell commands in a sandboxed environment |
| `http_request` | Network | Make arbitrary HTTP requests to external APIs |
| `text_summarizer` | NLP | Summarize long text using an LLM |
| `json_transform` | Utility | Apply JSONPath or jq-like transformations to JSON data |

---

## Tool Schema Format

Every tool is described by a JSON Schema definition. This schema is passed directly to the LLM so it knows what arguments to provide.

### Full Tool Definition

```typescript
interface ToolDefinition {
  name: string;                  // Unique identifier, snake_case
  description: string;           // Shown to the LLM — be precise
  inputSchema: JSONSchema;       // Defines accepted input structure
  outputSchema?: JSONSchema;     // Optional — defines expected output
  handler: ToolHandler;          // The actual implementation function
  permissions?: string[];        // Required permissions (e.g., 'network:read')
  timeout?: number;              // Max execution time in ms (default: 30000)
  retries?: number;              // Auto-retry on transient failure (default: 0)
  cacheTtl?: number;             // Cache result TTL in seconds (default: 0 = no cache)
}
```

### Example: Calculator Tool Schema

```json
{
  "name": "calculator",
  "description": "Evaluate a mathematical expression and return the numeric result. Supports +, -, *, /, ^, sqrt(), sin(), cos(), log(), and parentheses.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "expression": {
        "type": "string",
        "description": "The mathematical expression to evaluate, e.g. '(3 + 4) * 2'"
      }
    },
    "required": ["expression"],
    "additionalProperties": false
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "result": { "type": "number" },
      "expression": { "type": "string" }
    }
  }
}
```

### Example: Web Search Tool Schema

```json
{
  "name": "web_search",
  "description": "Search the web for current information. Returns up to 10 ranked results with title, URL, and snippet.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The search query"
      },
      "maxResults": {
        "type": "integer",
        "description": "Number of results to return (1–10)",
        "minimum": 1,
        "maximum": 10,
        "default": 5
      }
    },
    "required": ["query"],
    "additionalProperties": false
  }
}
```

---

## Creating Custom Tools

### Step 1: Define the Tool

```typescript
// tools/weather/index.ts
import { defineTool } from '@aios/sdk';

export const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get the current weather for a city. Returns temperature, conditions, humidity, and wind speed.',
  inputSchema: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: 'City name, e.g. "San Francisco" or "Tokyo"',
      },
      units: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius',
        description: 'Temperature units',
      },
    },
    required: ['city'],
    additionalProperties: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      city: { type: 'string' },
      temperature: { type: 'number' },
      units: { type: 'string' },
      conditions: { type: 'string' },
      humidity: { type: 'number' },
      windSpeedKph: { type: 'number' },
    },
  },
  permissions: ['network:read'],
  timeout: 10000,
  async handler({ city, units = 'celsius' }) {
    const apiKey = process.env.WEATHER_API_KEY;
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}`
    );
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    const data = await response.json();
    return {
      city: data.location.name,
      temperature: units === 'celsius' ? data.current.temp_c : data.current.temp_f,
      units,
      conditions: data.current.condition.text,
      humidity: data.current.humidity,
      windSpeedKph: data.current.wind_kph,
    };
  },
});
```

### Step 2: Register the Tool

Register your tool once at application startup, before any agents are spawned:

```typescript
// core/tools/registry.ts  (or your app's entry point)
import { ToolRegistry } from '@aios/sdk';
import { weatherTool } from './weather';

ToolRegistry.register(weatherTool);
```

### Step 3: Bind to an Agent

```typescript
const weatherAgent = AgentBuilder.create('weather-assistant')
  .model('gpt-4o-mini')
  .tools(['get_weather', 'date_time'])
  .systemPrompt('You are a weather assistant. Always provide temperatures in both Celsius and Fahrenheit.')
  .build();
```

---

## Tool Registry

The `ToolRegistry` is a singleton that manages all available tools at runtime.

### Registration

```typescript
import { ToolRegistry } from '@aios/sdk';

// Register a single tool
ToolRegistry.register(myTool);

// Register multiple tools at once
ToolRegistry.registerAll([tool1, tool2, tool3]);

// Check if a tool is registered
ToolRegistry.has('get_weather'); // true | false
```

### Discovery

```typescript
// Get all registered tools
const allTools = ToolRegistry.list();

// Get a specific tool definition
const tool = ToolRegistry.get('web_search');

// Get tools by permission category
const networkTools = ToolRegistry.listByPermission('network:read');
```

### Dynamic Registration via API

Tools can also be registered at runtime via the management API (useful for plugin systems):

```bash
curl -X POST http://localhost:4000/tools/register \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "crm_lookup",
    "description": "Look up a customer record by email address",
    "inputSchema": { ... },
    "endpointUrl": "https://my-crm.internal/aios-tool-adapter"
  }'
```

Remote tools are invoked by the platform via HTTP POST to `endpointUrl`.

---

## Safety and Sandboxing

Tool safety is enforced through schema validation and input allowlisting in the current implementation:

### Input Validation

Every tool call's input is validated against the tool's `schema` (JSON Schema format) before the handler is invoked. The `ToolRegistry.validate()` method checks required fields and types. Invalid input is returned as an error, which can be surfaced to the caller before the handler runs.

```
Tool call received with args
      ↓
ToolRegistry.validate(name, args)
  ✗ Invalid → ToolValidationError returned (no handler invoked)
  ✓ Valid   → execute() handler invoked
```

### Execution Model

| Tool Category | Current Isolation |
|---|---|
| Pure computation (calculator, date/time) | In-process, no I/O, deterministic |
| File I/O (fileRead, fileWrite) | Path validation — blocks traversal outside working directory |
| Network (webSearch) | Stub — returns error unless `SEARCH_API_KEY` is set; no actual network calls in the current release |
| Code execution | Stub — returns configuration error; sandboxed execution is a planned future feature |

> **Note:** gVisor/chroot/container-level sandboxing are planned for a future release. The current implementation provides input-level safety for computation tools and path-level safety for file tools.

### Timeout Enforcement

Every tool call is wrapped in a `Promise.race` against a configurable timeout:

```typescript
const result = await Promise.race([
  tool.execute(args),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Tool execution timed out')), timeoutMs)
  ),
]);
```

Timed-out tool calls return a structured error to the LLM and are logged for monitoring.

### Permission Model

Tools declare required permissions in their definition. Agents are only allowed to use tools whose permissions are granted in the agent's security context:

```
Tool requires: ['network:read', 'file:write']
Agent security context grants: ['network:read']
Result: Tool call blocked — missing 'file:write' permission
```

Permissions are configured per-agent in the agent registry or at spawn time.

---

## Tool Configuration

Global tool configuration is managed through environment variables and the `config/` directory.

### Environment Variables

| Variable | Description |
|---|---|
| `TOOL_DEFAULT_TIMEOUT_MS` | Default timeout for all tools (default: `30000`) |
| `SEARCH_API_KEY` | API key for the web search provider (required by `webSearchTool`) |
| `WEB_SEARCH_PROVIDER` | Search provider: `serper`, `brave`, `serpapi` (default: `serper`) |
| `FILE_WORKSPACE_ROOT` | Root directory for agent file operations (default: `/tmp/aios-workspaces`) |

### Per-Tool Runtime Configuration

Individual tool behavior can be overridden when registering:

```typescript
ToolRegistry.register(webSearchTool, {
  timeout: 15000,          // override default timeout
  retries: 2,              // retry twice on network errors
  cacheTtl: 300,           // cache results for 5 minutes
  rateLimit: {
    requests: 100,
    windowMs: 60000,       // 100 requests per minute
  },
});
```
