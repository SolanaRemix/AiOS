#!/usr/bin/env node

/**
 * AiOS CLI - Command-line interface for the AiOS platform
 * Usage: aios <command> [subcommand] [options]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONFIG_PATH = path.join(os.homedir(), '.aios', 'config.json');
const API_BASE = process.env.AIOS_API_URL || 'http://localhost:4000/api/v1';
const API_KEY = process.env.AIOS_API_KEY || '';

// ─── Helpers ────────────────────────────────────────────────────────────────

function printTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length))
  );
  const sep = widths.map((w) => '─'.repeat(w + 2)).join('┼');
  const row = (cells: string[]) =>
    cells.map((c, i) => ` ${c.padEnd(widths[i])} `).join('│');

  console.log('┌' + widths.map((w) => '─'.repeat(w + 2)).join('┬') + '┐');
  console.log('│' + row(headers) + '│');
  console.log('├' + sep + '┤');
  rows.forEach((r) => console.log('│' + row(r) + '│'));
  console.log('└' + widths.map((w) => '─'.repeat(w + 2)).join('┴') + '┘');
}

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  const prefix = `${flag}=`;
  const match = args.find((a) => a.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function loadConfig(): Record<string, string> {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return {};
}

function saveConfig(cfg: Record<string, string>): void {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

async function apiRequest<T = unknown>(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const cfg = loadConfig();
  const key = API_KEY || cfg['apiKey'] || '';

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─── Help Texts ─────────────────────────────────────────────────────────────

const GLOBAL_HELP = `
AiOS CLI — AI Operating System command-line interface

Usage:
  aios <command> [subcommand] [options]

Commands:
  agent     Manage AI agents
  tool      Manage available tools
  memory    Interact with memory store
  system    System status and info
  config    Manage local CLI configuration
  help      Show this help message

Options:
  --help, -h    Show help for a command

Examples:
  aios agent list
  aios agent create --name "My Agent" --model gpt-4o
  aios tool list
  aios memory search --query "project requirements"
  aios system status
  aios config set apiKey <your-key>
  aios config get apiKey

Environment Variables:
  AIOS_API_URL    API base URL (default: http://localhost:4000/api/v1)
  AIOS_API_KEY    API key for authentication
`;

const AGENT_HELP = `
Usage: aios agent <subcommand> [options]

Subcommands:
  list                          List all agents
  create --name <n> --model <m> Create a new agent
  get <id>                      Get agent details

Options:
  --name <name>     Agent name (required for create)
  --model <model>   LLM model to use (required for create)
  --description <d> Agent description (optional)
  --help            Show this help
`;

const TOOL_HELP = `
Usage: aios tool <subcommand>

Subcommands:
  list    List all available tools

Options:
  --help  Show this help
`;

const MEMORY_HELP = `
Usage: aios memory <subcommand> [options]

Subcommands:
  search --query <q>    Search memory entries semantically
  list                  List recent memory entries
  clear                 Clear all memory entries

Options:
  --query <q>   Search query (required for search)
  --limit <n>   Max results to return (default: 10)
  --help        Show this help
`;

const SYSTEM_HELP = `
Usage: aios system <subcommand>

Subcommands:
  status    Show overall system health and metrics

Options:
  --help    Show this help
`;

const CONFIG_HELP = `
Usage: aios config <subcommand> <key> [value]

Subcommands:
  set <key> <value>   Set a configuration value
  get <key>           Get a configuration value
  list                List all configuration values

Common keys:
  apiKey      Your AiOS API key
  apiUrl      API base URL
  defaultModel  Default LLM model

Options:
  --help    Show this help
`;

// ─── Command Handlers ────────────────────────────────────────────────────────

async function cmdAgentList(): Promise<void> {
  console.log('Fetching agents...\n');
  try {
    const res = await apiRequest<{ data: Array<Record<string, string>> }>('GET', '/agents');
    const agents = res.data ?? [];
    if (agents.length === 0) {
      console.log('No agents found.');
      return;
    }
    printTable(
      ['ID', 'Name', 'Model', 'Status'],
      agents.map((a) => [a.id ?? '', a.name ?? '', a.model ?? '', a.status ?? ''])
    );
  } catch (err) {
    // Offline demo output
    console.log('[Demo mode — API not reachable]\n');
    printTable(
      ['ID', 'Name', 'Model', 'Status'],
      [
        ['agent-1', 'Alpha Orchestrator', 'gpt-4o', 'running'],
        ['agent-2', 'CodeGen Prime', 'claude-3-5-sonnet', 'idle'],
        ['agent-3', 'Debug Hawk', 'gpt-4o', 'running'],
        ['agent-4', 'Security Auditor', 'claude-3-5-sonnet', 'idle'],
      ]
    );
  }
}

async function cmdAgentCreate(args: string[]): Promise<void> {
  if (hasFlag(args, '--help') || hasFlag(args, '-h')) {
    console.log(AGENT_HELP);
    return;
  }
  const name = parseFlag(args, '--name');
  const model = parseFlag(args, '--model');
  const description = parseFlag(args, '--description');

  if (!name || !model) {
    console.error('Error: --name and --model are required.\n');
    console.log(AGENT_HELP);
    process.exit(1);
  }

  console.log(`Creating agent "${name}" with model "${model}"...`);
  try {
    const res = await apiRequest<{ data: Record<string, string> }>('POST', '/agents', { name, model, description });
    const agent = res.data ?? {};
    console.log('\nAgent created successfully:');
    console.log(`  ID:     ${agent.id}`);
    console.log(`  Name:   ${agent.name}`);
    console.log(`  Model:  ${agent.model}`);
    console.log(`  Status: ${agent.status}`);
  } catch {
    console.log('\n[Demo mode — API not reachable]');
    const id = 'agent-' + Math.random().toString(36).slice(2, 8);
    console.log('\nAgent created successfully (simulated):');
    console.log(`  ID:     ${id}`);
    console.log(`  Name:   ${name}`);
    console.log(`  Model:  ${model}`);
    console.log(`  Status: idle`);
  }
}

async function cmdToolList(): Promise<void> {
  console.log('Fetching tools...\n');
  try {
    const res = await apiRequest<{ data: Array<Record<string, unknown>> }>('GET', '/tools');
    const tools = res.data ?? [];
    if (tools.length === 0) {
      console.log('No tools found.');
      return;
    }
    printTable(
      ['Name', 'Description', 'Enabled'],
      tools.map((t) => [String(t.name ?? ''), String(t.description ?? ''), String(t.enabled ?? false)])
    );
  } catch {
    console.log('[Demo mode — API not reachable]\n');
    printTable(
      ['Name', 'Description', 'Enabled'],
      [
        ['calculator', 'Perform mathematical calculations', 'true'],
        ['date_time', 'Get current date and time info', 'true'],
        ['file_operations', 'Read and write files', 'true'],
        ['web_search', 'Search the internet', 'true'],
        ['code_execution', 'Run Python code snippets', 'true'],
        ['memory_search', 'Query long-term memory store', 'true'],
        ['weather', 'Fetch weather forecasts', 'false'],
        ['http_request', 'Make arbitrary HTTP calls', 'false'],
      ]
    );
  }
}

async function cmdMemorySearch(args: string[]): Promise<void> {
  if (hasFlag(args, '--help') || hasFlag(args, '-h')) {
    console.log(MEMORY_HELP);
    return;
  }
  const query = parseFlag(args, '--query');
  const limit = parseInt(parseFlag(args, '--limit') ?? '10', 10);

  if (!query) {
    console.error('Error: --query is required.\n');
    console.log(MEMORY_HELP);
    process.exit(1);
  }

  console.log(`Searching memory for: "${query}" (limit: ${limit})...\n`);
  try {
    const res = await apiRequest<{ data: Array<Record<string, unknown>> }>('POST', '/memory/search', {
      query,
      limit,
    });
    const entries = res.data ?? [];
    if (entries.length === 0) {
      console.log('No matching memory entries found.');
      return;
    }
    entries.forEach((e, i) => {
      const score = typeof e.similarity === 'number' ? `${(e.similarity * 100).toFixed(1)}%` : 'N/A';
      console.log(`${i + 1}. [${score}] ${e.content}`);
      console.log(`   Source: ${e.source ?? 'unknown'} · ${e.createdAt ?? ''}`);
      console.log();
    });
  } catch {
    console.log('[Demo mode — API not reachable]\n');
    const results = [
      { score: '94.2%', content: 'User prefers TypeScript with strict mode enabled.', source: 'conversation' },
      { score: '87.6%', content: `Project Alpha uses PostgreSQL 16 with pg_vector extension.`, source: 'document' },
      { score: '72.1%', content: 'Deployment pipeline: GitHub Actions → Docker build → ECR push.', source: 'document' },
    ].filter((_, i) => i < limit);

    results.forEach((r, i) => {
      console.log(`${i + 1}. [${r.score}] ${r.content}`);
      console.log(`   Source: ${r.source}`);
      console.log();
    });
  }
}

async function cmdSystemStatus(): Promise<void> {
  console.log('Fetching system status...\n');
  try {
    const res = await apiRequest<{ data: Record<string, unknown> }>('GET', '/system/status');
    const data = res.data ?? {};
    console.log('System Status:');
    Object.entries(data).forEach(([k, v]) => {
      console.log(`  ${k}: ${JSON.stringify(v)}`);
    });
  } catch {
    console.log('[Demo mode — API not reachable]\n');
    const now = new Date().toISOString();
    printTable(
      ['Service', 'Status', 'Latency', 'Uptime'],
      [
        ['API Server', '✓ healthy', '42ms', '99.99%'],
        ['Database', '✓ healthy', '8ms', '99.98%'],
        ['Redis', '✓ healthy', '2ms', '100.00%'],
        ['LLM Router', '⚠ degraded', '3.4s', '98.12%'],
        ['Agent Pool', '✓ healthy', '1.2s', '99.95%'],
        ['Webhooks', '✗ down', '—', '92.34%'],
      ]
    );
    console.log(`\nTimestamp: ${now}`);
    console.log('Active agents: 7/9  |  Requests/min: 1,847  |  CPU: 42%  |  Mem: 68%');
  }
}

/** Returns masked display value for sensitive config keys. */
function maskSensitiveValue(key: string, value: string, fullMask = false): string {
  const isSensitive = key.toLowerCase().includes('key') || key.toLowerCase().includes('secret');
  if (!isSensitive) return value;
  return fullMask ? '****' : value.slice(0, 8) + '••••••••';
}

function cmdConfigSet(args: string[]): void {
  const keyArg = args[0];
  const valArg = args[1];

  if (!keyArg || !valArg) {
    console.error('Error: usage: aios config set <key> <value>\n');
    process.exit(1);
  }

  const cfg = loadConfig();
  cfg[keyArg] = valArg;
  saveConfig(cfg);
  console.log(`✓ Set ${keyArg} = ${maskSensitiveValue(keyArg, valArg, true)}`);
}

function cmdConfigGet(args: string[]): void {
  const keyArg = args[0];
  if (!keyArg) {
    console.error('Error: usage: aios config get <key>\n');
    process.exit(1);
  }

  const cfg = loadConfig();
  const val = cfg[keyArg];
  if (val === undefined) {
    console.log(`(not set)`);
  } else {
    console.log(`${keyArg} = ${maskSensitiveValue(keyArg, val)}`);
  }
}

function cmdConfigList(): void {
  const cfg = loadConfig();
  const entries = Object.entries(cfg);
  if (entries.length === 0) {
    console.log('No configuration set. Use: aios config set <key> <value>');
    return;
  }
  console.log('Current configuration:\n');
  entries.forEach(([k, v]) => {
    console.log(`  ${k} = ${maskSensitiveValue(k, v)}`);
  });
  console.log(`\nConfig file: ${CONFIG_PATH}`);
}

// ─── Main Router ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const [command, subcommand, ...rest] = argv;

  if (!command || command === 'help' || hasFlag(argv, '--help') || hasFlag(argv, '-h')) {
    if (command === 'agent') { console.log(AGENT_HELP); return; }
    if (command === 'tool') { console.log(TOOL_HELP); return; }
    if (command === 'memory') { console.log(MEMORY_HELP); return; }
    if (command === 'system') { console.log(SYSTEM_HELP); return; }
    if (command === 'config') { console.log(CONFIG_HELP); return; }
    console.log(GLOBAL_HELP);
    return;
  }

  switch (command) {
    case 'agent':
      if (!subcommand || subcommand === 'help' || hasFlag(rest, '--help')) {
        console.log(AGENT_HELP); return;
      }
      if (subcommand === 'list') { await cmdAgentList(); return; }
      if (subcommand === 'create') { await cmdAgentCreate(rest); return; }
      console.error(`Unknown subcommand: agent ${subcommand}\n`);
      console.log(AGENT_HELP);
      process.exit(1);
      break;

    case 'tool':
      if (!subcommand || subcommand === 'help' || hasFlag(rest, '--help')) {
        console.log(TOOL_HELP); return;
      }
      if (subcommand === 'list') { await cmdToolList(); return; }
      console.error(`Unknown subcommand: tool ${subcommand}\n`);
      console.log(TOOL_HELP);
      process.exit(1);
      break;

    case 'memory':
      if (!subcommand || subcommand === 'help' || hasFlag(rest, '--help')) {
        console.log(MEMORY_HELP); return;
      }
      if (subcommand === 'search') { await cmdMemorySearch(rest); return; }
      if (subcommand === 'list') { await cmdMemorySearch(['--query', '*', '--limit', '20']); return; }
      if (subcommand === 'clear') {
        console.log('Clearing all memory entries...');
        try {
          await apiRequest('DELETE', '/memory');
          console.log('✓ All memory entries cleared.');
        } catch {
          console.log('[Demo mode] Memory cleared (simulated).');
        }
        return;
      }
      console.error(`Unknown subcommand: memory ${subcommand}\n`);
      console.log(MEMORY_HELP);
      process.exit(1);
      break;

    case 'system':
      if (!subcommand || subcommand === 'help' || hasFlag(rest, '--help')) {
        console.log(SYSTEM_HELP); return;
      }
      if (subcommand === 'status') { await cmdSystemStatus(); return; }
      console.error(`Unknown subcommand: system ${subcommand}\n`);
      console.log(SYSTEM_HELP);
      process.exit(1);
      break;

    case 'config':
      if (!subcommand || subcommand === 'help' || hasFlag(rest, '--help')) {
        console.log(CONFIG_HELP); return;
      }
      if (subcommand === 'set') { cmdConfigSet(rest); return; }
      if (subcommand === 'get') { cmdConfigGet(rest); return; }
      if (subcommand === 'list') { cmdConfigList(); return; }
      console.error(`Unknown subcommand: config ${subcommand}\n`);
      console.log(CONFIG_HELP);
      process.exit(1);
      break;

    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(GLOBAL_HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
