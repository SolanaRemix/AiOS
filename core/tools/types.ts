/**
 * Tool system types.
 */

/** JSON Schema subset used to describe tool input parameters. */
export type ToolSchema = {
  type: 'object';
  properties: Record<
    string,
    {
      type: string;
      description?: string;
      enum?: unknown[];
      default?: unknown;
      minimum?: number;
      maximum?: number;
      pattern?: string;
    }
  >;
  required?: string[];
  additionalProperties?: boolean;
};

/** The result returned from a tool execution. */
export interface ToolResult {
  /** Whether the tool completed without error. */
  success: boolean;
  /** Human-readable or machine-parseable output. */
  output: unknown;
  /** Error message if `success` is false. */
  error?: string;
  /** Optional extra metadata (e.g. duration, cost). */
  metadata?: Record<string, unknown>;
}

/** A registered tool definition. */
export interface Tool {
  /** Unique tool name (used as the registry key). */
  name: string;
  /** Description shown to the LLM / user. */
  description: string;
  /** JSON Schema for the tool's input arguments. */
  schema: ToolSchema;
  /**
   * Execute the tool.
   * @param args - Validated arguments conforming to `schema`.
   * @returns A promise resolving to a {@link ToolResult}.
   */
  execute(args: Record<string, unknown>): Promise<ToolResult>;
}
