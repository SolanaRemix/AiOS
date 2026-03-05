import {
  ToolRegistry,
  ToolNotFoundError,
  ToolValidationError,
  calculatorTool,
  dateTimeTool,
  webSearchTool,
  codeExecutionTool,
  createDefaultRegistry,
} from '../tools';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('registers and retrieves a tool', () => {
    registry.register(calculatorTool);
    expect(registry.get('calculator')).toBe(calculatorTool);
  });

  it('throws when registering a duplicate tool', () => {
    registry.register(calculatorTool);
    expect(() => registry.register(calculatorTool)).toThrow('already registered');
  });

  it('returns undefined for unknown tool', () => {
    expect(registry.get('missing')).toBeUndefined();
  });

  it('lists all registered tools', () => {
    registry.register(calculatorTool);
    registry.register(dateTimeTool);
    const tools = registry.list();
    expect(tools).toHaveLength(2);
    expect(tools.map((t) => t.name)).toContain('calculator');
    expect(tools.map((t) => t.name)).toContain('dateTime');
  });

  it('throws ToolNotFoundError for execute on unknown tool', async () => {
    await expect(registry.execute('ghost', {})).rejects.toThrow(ToolNotFoundError);
  });

  it('throws ToolNotFoundError for validate on unknown tool', () => {
    expect(() => registry.validate('ghost', {})).toThrow(ToolNotFoundError);
  });

  it('throws ToolValidationError for missing required field', () => {
    registry.register(calculatorTool);
    expect(() => registry.validate('calculator', {})).toThrow(ToolValidationError);
  });

  it('throws ToolValidationError for wrong type', () => {
    registry.register(calculatorTool);
    expect(() => registry.validate('calculator', { expression: 42 as unknown as string })).toThrow(
      ToolValidationError,
    );
  });
});

describe('calculatorTool', () => {
  it('evaluates a simple arithmetic expression', async () => {
    const result = await calculatorTool.execute({ expression: '2 + 2' });
    expect(result.success).toBe(true);
    expect(result.output).toBe(4);
  });

  it('evaluates a complex expression', async () => {
    const result = await calculatorTool.execute({ expression: '(10 + 5) * 2 / 3' });
    expect(result.success).toBe(true);
    expect(result.output).toBeCloseTo(10);
  });

  it('rejects unsafe input', async () => {
    const result = await calculatorTool.execute({ expression: 'process.exit(1)' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Invalid expression/);
  });

  it('handles division by zero gracefully', async () => {
    const result = await calculatorTool.execute({ expression: '1/0' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/non-finite/);
  });

  it('rejects empty expression', async () => {
    const result = await calculatorTool.execute({ expression: '' });
    expect(result.success).toBe(false);
  });
});

describe('dateTimeTool', () => {
  it('returns iso format by default', async () => {
    const result = await dateTimeTool.execute({});
    expect(result.success).toBe(true);
    const output = result.output as Record<string, unknown>;
    expect(output['iso']).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(typeof output['unix']).toBe('number');
  });

  it('returns unix timestamp when requested', async () => {
    const before = Math.floor(Date.now() / 1000);
    const result = await dateTimeTool.execute({ format: 'unix' });
    const after = Math.floor(Date.now() / 1000);
    expect(result.success).toBe(true);
    const ts = result.output as Record<string, unknown>;
    expect(ts['formatted']).toBeGreaterThanOrEqual(before);
    expect(ts['formatted']).toBeLessThanOrEqual(after);
  });

  it('returns locale formatted date', async () => {
    const result = await dateTimeTool.execute({ format: 'locale', timezone: 'UTC' });
    expect(result.success).toBe(true);
    expect(typeof (result.output as Record<string, unknown>)['formatted']).toBe('string');
  });

  it('includes dayOfWeek in output', async () => {
    const result = await dateTimeTool.execute({});
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    expect(days).toContain((result.output as Record<string, unknown>)['dayOfWeek']);
  });
});

describe('webSearchTool', () => {
  it('returns not-configured error when no API key', async () => {
    const saved = process.env['SEARCH_API_KEY'];
    delete process.env['SEARCH_API_KEY'];
    const result = await webSearchTool.execute({ query: 'test' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not configured/);
    if (saved) process.env['SEARCH_API_KEY'] = saved;
  });
});

describe('codeExecutionTool', () => {
  it('returns sandbox not configured error', async () => {
    const result = await codeExecutionTool.execute({ language: 'python', code: 'print("hi")' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/sandbox not configured/);
  });
});

describe('createDefaultRegistry', () => {
  it('creates a registry with all built-in tools', () => {
    const registry = createDefaultRegistry();
    const names = registry.list().map((t) => t.name);
    expect(names).toContain('calculator');
    expect(names).toContain('dateTime');
    expect(names).toContain('fileRead');
    expect(names).toContain('fileWrite');
    expect(names).toContain('webSearch');
    expect(names).toContain('codeExecution');
  });

  it('executes calculator through default registry', async () => {
    const registry = createDefaultRegistry();
    const result = await registry.execute('calculator', { expression: '7 * 6' });
    expect(result.success).toBe(true);
    expect(result.output).toBe(42);
  });
});
