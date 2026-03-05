/**
 * AiOS Tool Registry and built-in tools.
 *
 * No external dependencies – uses only Node.js built-ins.
 */

import { Tool, ToolResult, ToolSchema } from './types';

export { Tool, ToolResult, ToolSchema } from './types';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ToolNotFoundError extends Error {
  constructor(name: string) {
    super(`Tool not found: "${name}"`);
    this.name = 'ToolNotFoundError';
  }
}

export class ToolValidationError extends Error {
  constructor(toolName: string, message: string) {
    super(`Tool "${toolName}" validation failed: ${message}`);
    this.name = 'ToolValidationError';
  }
}

// ---------------------------------------------------------------------------
// ToolRegistry
// ---------------------------------------------------------------------------

/**
 * Central registry for all tools available to agents.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  /**
   * Register a tool.
   * @param tool - The tool definition.
   * @throws if a tool with the same name is already registered.
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Retrieve a tool by name.
   * @param name - Tool name.
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /** List all registered tools. */
  list(): Tool[] {
    return [...this.tools.values()];
  }

  /**
   * Validate `args` against a tool's JSON Schema.
   * @param name - Tool name.
   * @param args - Arguments to validate.
   * @throws {@link ToolNotFoundError} or {@link ToolValidationError}.
   */
  validate(name: string, args: Record<string, unknown>): void {
    const tool = this.tools.get(name);
    if (!tool) throw new ToolNotFoundError(name);

    const { schema } = tool;
    for (const required of schema.required ?? []) {
      if (!(required in args)) {
        throw new ToolValidationError(name, `Missing required field: "${required}"`);
      }
    }

    for (const [key, value] of Object.entries(args)) {
      const propSchema = schema.properties[key];
      if (!propSchema) {
        if (schema.additionalProperties === false) {
          throw new ToolValidationError(name, `Unknown field: "${key}"`);
        }
        continue;
      }
      if (propSchema.type === 'number' || propSchema.type === 'integer') {
        if (typeof value !== 'number') {
          throw new ToolValidationError(name, `Field "${key}" must be a number`);
        }
        if (propSchema.minimum !== undefined && value < propSchema.minimum) {
          throw new ToolValidationError(name, `Field "${key}" must be >= ${propSchema.minimum}`);
        }
        if (propSchema.maximum !== undefined && value > propSchema.maximum) {
          throw new ToolValidationError(name, `Field "${key}" must be <= ${propSchema.maximum}`);
        }
      } else if (propSchema.type === 'string' && typeof value !== 'string') {
        throw new ToolValidationError(name, `Field "${key}" must be a string`);
      } else if (propSchema.type === 'boolean' && typeof value !== 'boolean') {
        throw new ToolValidationError(name, `Field "${key}" must be a boolean`);
      }
      if (propSchema.enum && !propSchema.enum.includes(value)) {
        throw new ToolValidationError(
          name,
          `Field "${key}" must be one of: ${propSchema.enum.join(', ')}`,
        );
      }
    }
  }

  /**
   * Execute a tool by name.
   * @param name - Tool name.
   * @param args - Arguments to pass to the tool.
   * @returns A {@link ToolResult}.
   * @throws {@link ToolNotFoundError} if the tool is not registered.
   */
  async execute(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) throw new ToolNotFoundError(name);

    try {
      this.validate(name, args);
      return await tool.execute(args);
    } catch (err) {
      if (err instanceof ToolValidationError || err instanceof ToolNotFoundError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, output: null, error: message };
    }
  }
}

// ---------------------------------------------------------------------------
// Built-in tools
// ---------------------------------------------------------------------------

/**
 * Recursive-descent arithmetic parser.
 * Supports: +, -, *, /, %, ^, unary minus, parentheses, integers and decimals.
 * No dynamic code evaluation — fully safe against injection.
 */
function evalArithmetic(expr: string): number {
  let pos = 0;
  const len = expr.length;

  function skipWs(): void {
    while (pos < len && /\s/.test(expr[pos])) pos++;
  }

  function parseExpr(): number { return parseAddSub(); }

  function parseAddSub(): number {
    let left = parseMulDiv();
    skipWs();
    while (pos < len && (expr[pos] === '+' || expr[pos] === '-')) {
      const op = expr[pos++];
      const right = parseMulDiv();
      left = op === '+' ? left + right : left - right;
      skipWs();
    }
    return left;
  }

  function parseMulDiv(): number {
    let left = parsePower();
    skipWs();
    while (pos < len && (expr[pos] === '*' || expr[pos] === '/' || expr[pos] === '%')) {
      const op = expr[pos++];
      const right = parsePower();
      if (op === '*') left *= right;
      else if (op === '/') left /= right;
      else left %= right;
      skipWs();
    }
    return left;
  }

  function parsePower(): number {
    const base = parseUnary();
    skipWs();
    if (pos < len && expr[pos] === '^') {
      pos++;
      const exp = parseUnary();
      return Math.pow(base, exp);
    }
    return base;
  }

  function parseUnary(): number {
    skipWs();
    if (pos < len && expr[pos] === '-') { pos++; return -parseAtom(); }
    if (pos < len && expr[pos] === '+') { pos++; return parseAtom(); }
    return parseAtom();
  }

  function parseAtom(): number {
    skipWs();
    if (pos < len && expr[pos] === '(') {
      pos++; // consume '('
      const val = parseExpr();
      skipWs();
      if (pos >= len || expr[pos] !== ')') throw new Error('Missing closing parenthesis');
      pos++; // consume ')'
      return val;
    }
    // Parse number
    const start = pos;
    if (pos < len && /\d/.test(expr[pos])) {
      while (pos < len && /[\d.]/.test(expr[pos])) pos++;
      const num = parseFloat(expr.slice(start, pos));
      if (isNaN(num)) throw new Error(`Invalid number near position ${start}`);
      return num;
    }
    throw new Error(`Unexpected character '${expr[pos]}' at position ${pos}`);
  }

  skipWs();
  const result = parseExpr();
  skipWs();
  if (pos < len) throw new Error(`Unexpected token '${expr[pos]}' at position ${pos}`);
  return result;
}

/**
 * Safely evaluates simple arithmetic expressions using a recursive descent parser.
 * Supports +, -, *, /, %, ^ and parentheses.
 */
export const calculatorTool: Tool = {
  name: 'calculator',
  description: 'Evaluates a mathematical expression and returns the numeric result.',
  schema: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'A mathematical expression to evaluate (e.g. "2 + 2 * 3").',
      },
    },
    required: ['expression'],
  },
  async execute(args) {
    const expression = args['expression'] as string;

    // Allowlist: only digits, operators, parens, whitespace, and decimal points.
    if (!/^[\d\s+\-*/().%^]+$/.test(expression)) {
      return {
        success: false,
        output: null,
        error: `Invalid expression: "${expression}". Only basic arithmetic is supported.`,
      };
    }

    try {
      const result = evalArithmetic(expression);
      if (!isFinite(result)) {
        return { success: false, output: null, error: 'Expression produced a non-finite result.' };
      }
      return { success: true, output: result, metadata: { expression } };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, output: null, error: `Evaluation error: ${message}` };
    }
  },
};

/** Returns current date, time, and timezone information. */
export const dateTimeTool: Tool = {
  name: 'dateTime',
  description: 'Returns the current date, time, and related information.',
  schema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        description: 'Output format: "iso" (default), "locale", or "unix".',
        enum: ['iso', 'locale', 'unix'],
        default: 'iso',
      },
      timezone: {
        type: 'string',
        description: 'IANA timezone string, e.g. "America/New_York". Defaults to UTC.',
      },
    },
    required: [],
  },
  async execute(args) {
    const format = (args['format'] as string | undefined) ?? 'iso';
    const timezone = (args['timezone'] as string | undefined) ?? 'UTC';
    const now = new Date();

    let formatted: string | number;
    try {
      switch (format) {
        case 'unix':
          formatted = Math.floor(now.getTime() / 1000);
          break;
        case 'locale':
          formatted = now.toLocaleString('en-US', { timeZone: timezone });
          break;
        default:
          formatted = now.toISOString();
      }
    } catch {
      formatted = now.toISOString();
    }

    return {
      success: true,
      output: {
        formatted,
        iso: now.toISOString(),
        unix: Math.floor(now.getTime() / 1000),
        timezone,
        dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone }),
      },
    };
  },
};

/** Reads a file from the local filesystem (safety-checked). */
export const fileReadTool: Tool = {
  name: 'fileRead',
  description: 'Reads the contents of a file at the given path.',
  schema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Absolute or relative path to the file.' },
      encoding: {
        type: 'string',
        description: 'File encoding. Defaults to "utf-8".',
        default: 'utf-8',
      },
    },
    required: ['path'],
  },
  async execute(args) {
    const filePath = args['path'] as string;

    // Safety: block path traversal attempts.
    if (filePath.includes('..')) {
      return {
        success: false,
        output: null,
        error: 'Path traversal ("..") is not allowed.',
      };
    }

    try {
      const { readFile } = await import('fs/promises');
      const encoding = (args['encoding'] as BufferEncoding | undefined) ?? 'utf-8';
      const content = await readFile(filePath, { encoding });
      return { success: true, output: content, metadata: { path: filePath } };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, output: null, error: message };
    }
  },
};

/** Writes content to a file (safety-checked). */
export const fileWriteTool: Tool = {
  name: 'fileWrite',
  description: 'Writes content to a file at the given path.',
  schema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to write to.' },
      content: { type: 'string', description: 'Content to write.' },
      append: { type: 'boolean', description: 'Append instead of overwrite. Defaults to false.' },
    },
    required: ['path', 'content'],
  },
  async execute(args) {
    const filePath = args['path'] as string;
    const content = args['content'] as string;
    const append = (args['append'] as boolean | undefined) ?? false;

    if (filePath.includes('..')) {
      return { success: false, output: null, error: 'Path traversal ("..") is not allowed.' };
    }

    try {
      const { writeFile, appendFile } = await import('fs/promises');
      if (append) {
        await appendFile(filePath, content, 'utf-8');
      } else {
        await writeFile(filePath, content, 'utf-8');
      }
      return { success: true, output: `File written: ${filePath}`, metadata: { path: filePath } };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, output: null, error: message };
    }
  },
};

/** Stub: web search – requires an external API key to be fully implemented. */
export const webSearchTool: Tool = {
  name: 'webSearch',
  description: 'Searches the web for information. Requires SEARCH_API_KEY to be configured.',
  schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The search query.' },
      maxResults: { type: 'number', description: 'Maximum number of results (1–10).', minimum: 1, maximum: 10 },
    },
    required: ['query'],
  },
  async execute(args) {
    const query = args['query'] as string;
    if (!process.env['SEARCH_API_KEY']) {
      return {
        success: false,
        output: 'Web search not configured. Set the SEARCH_API_KEY environment variable.',
        error: 'Web search not configured',
        metadata: { query },
      };
    }
    // Placeholder for real implementation.
    return { success: true, output: `Search results for: "${query}" (not yet implemented)`, metadata: { query } };
  },
};

/** Stub: code execution sandbox. */
export const codeExecutionTool: Tool = {
  name: 'codeExecution',
  description: 'Executes code in a sandboxed environment. Requires sandbox configuration.',
  schema: {
    type: 'object',
    properties: {
      language: {
        type: 'string',
        description: 'Programming language: "python", "javascript", "bash".',
        enum: ['python', 'javascript', 'bash'],
      },
      code: { type: 'string', description: 'The code to execute.' },
      timeoutMs: { type: 'number', description: 'Execution timeout in ms (default 5000).', minimum: 100, maximum: 30000 },
    },
    required: ['language', 'code'],
  },
  async execute(args) {
    return {
      success: false,
      output: 'Code execution sandbox not configured. Deploy a sandboxed runtime to enable this tool.',
      error: 'Code execution sandbox not configured',
      metadata: { language: args['language'], codeLength: (args['code'] as string).length },
    };
  },
};

// ---------------------------------------------------------------------------
// Default registry factory
// ---------------------------------------------------------------------------

/**
 * Create a {@link ToolRegistry} pre-populated with all built-in tools.
 */
export function createDefaultRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  for (const tool of [
    calculatorTool,
    dateTimeTool,
    fileReadTool,
    fileWriteTool,
    webSearchTool,
    codeExecutionTool,
  ]) {
    registry.register(tool);
  }
  return registry;
}
