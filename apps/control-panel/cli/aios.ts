#!/usr/bin/env node
/**
 * AiOS CLI — Command-line interface for the SWARM GOD CONTROL PANEL
 *
 * Usage:
 *   node dist/apps/control-panel/cli/aios.js <command> [options]
 *
 * Commands:
 *   swarm list              List all active swarms
 *   swarm spawn <name>      Spawn a new swarm
 *   swarm terminate <id>    Terminate a swarm
 *   agent list              List all agents
 *   agent spawn <role>      Spawn a new agent
 *   agent pause <id>        Pause an agent
 *   agent terminate <id>    Terminate an agent
 *   task list               List all tasks
 *   task run <name>         Create and run a new task
 *   task retry <id>         Retry a failed task
 *   task cancel <id>        Cancel a pending task
 *   monitor                 Show live system metrics
 *   health                  Show system health status
 *   security                Show recent security events
 */

const BASE_URL = process.env.CONTROL_PANEL_URL ?? "http://localhost:3001";

type CLIArgs = {
  command: string;
  subcommand?: string;
  arg?: string;
};

function parseArgs(argv: string[]): CLIArgs {
  const [, , command = "help", subcommand, arg] = argv;
  return { command, subcommand, arg };
}

async function fetchAPI(path: string, options?: RequestInit): Promise<unknown> {
  const url = `${BASE_URL}/api${path}`;
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  } catch (err) {
    console.error(`\x1b[31m✗ API error (${url}):\x1b[0m`, (err as Error).message);
    process.exit(1);
  }
}

function colorize(text: string, color: string): string {
  const colors: Record<string, string> = {
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    reset: "\x1b[0m",
  };
  return `${colors[color] ?? ""}${text}${colors.reset}`;
}

function printHeader(title: string): void {
  const line = "─".repeat(60);
  console.log(colorize(line, "cyan"));
  console.log(colorize(`  SWARM GOD — ${title}`, "bold"));
  console.log(colorize(line, "cyan"));
}

function printTable(headers: string[], rows: string[][]): void {
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length))
  );

  const formatRow = (cells: string[]) =>
    cells.map((c, i) => c.padEnd(colWidths[i] ?? 0)).join("  │  ");

  console.log(colorize(formatRow(headers), "dim"));
  console.log(colorize("─".repeat(colWidths.reduce((a, b) => a + b, 0) + headers.length * 5), "dim"));
  rows.forEach((row) => console.log(formatRow(row)));
}

// ─── Command handlers ─────────────────────────────────────────────────────────

async function handleSwarm(subcommand?: string, arg?: string): Promise<void> {
  if (subcommand === "list" || !subcommand) {
    printHeader("SWARM LIST");
    const data = (await fetchAPI("/swarms")) as { swarms: Array<{ swarm_id: string; name: string; type: string; status: string; agent_ids: string[]; task_count: number }> };
    printTable(
      ["ID", "Name", "Type", "Status", "Agents", "Tasks"],
      data.swarms.map((s) => [
        s.swarm_id,
        s.name,
        s.type,
        s.status === "active" ? colorize(s.status, "green") : colorize(s.status, "yellow"),
        String(s.agent_ids.length),
        String(s.task_count),
      ])
    );
    console.log(`\n  Total: ${colorize(String(data.swarms.length), "cyan")} swarms`);
  } else if (subcommand === "spawn") {
    const name = arg ?? "New Swarm";
    const data = (await fetchAPI("/swarms", {
      method: "POST",
      body: JSON.stringify({ name }),
    })) as { swarm: { swarm_id: string; name: string } };
    console.log(colorize(`✓ Swarm spawned: ${data.swarm.name} (${data.swarm.swarm_id})`, "green"));
  } else if (subcommand === "terminate") {
    if (!arg) {
      console.error(colorize("✗ Usage: aios swarm terminate <id>", "red"));
      process.exit(1);
    }
    await fetchAPI(`/swarms?id=${arg}`, { method: "DELETE" });
    console.log(colorize(`✓ Swarm ${arg} terminated`, "green"));
  } else {
    console.error(colorize(`✗ Unknown swarm subcommand: ${subcommand}`, "red"));
    process.exit(1);
  }
}

async function handleAgent(subcommand?: string, arg?: string): Promise<void> {
  if (subcommand === "list" || !subcommand) {
    printHeader("AGENT LIST");
    const data = (await fetchAPI("/agents")) as { agents: Array<{ agent_id: string; name: string; role: string; status: string; model: string; token_usage: number }> };
    printTable(
      ["ID", "Name", "Role", "Status", "Model", "Tokens"],
      data.agents.map((a) => {
        const statusColor = a.status === "active" ? "green" : a.status === "error" ? "red" : "yellow";
        return [
          a.agent_id,
          a.name,
          a.role,
          colorize(a.status, statusColor),
          a.model,
          String(a.token_usage),
        ];
      })
    );
    console.log(`\n  Total: ${colorize(String(data.agents.length), "cyan")} agents`);
  } else if (subcommand === "spawn") {
    const role = arg ?? "Assistant";
    const data = (await fetchAPI("/agents", {
      method: "POST",
      body: JSON.stringify({ role }),
    })) as { agent: { agent_id: string; name: string; role: string } };
    console.log(colorize(`✓ Agent spawned: ${data.agent.name} (${data.agent.agent_id}) — Role: ${data.agent.role}`, "green"));
  } else if (subcommand === "pause") {
    if (!arg) {
      console.error(colorize("✗ Usage: aios agent pause <id>", "red"));
      process.exit(1);
    }
    await fetchAPI(`/agents?id=${arg}`, { method: "PATCH" });
    console.log(colorize(`✓ Agent ${arg} paused`, "yellow"));
  } else if (subcommand === "terminate") {
    if (!arg) {
      console.error(colorize("✗ Usage: aios agent terminate <id>", "red"));
      process.exit(1);
    }
    await fetchAPI(`/agents?id=${arg}`, { method: "DELETE" });
    console.log(colorize(`✓ Agent ${arg} terminated`, "green"));
  } else {
    console.error(colorize(`✗ Unknown agent subcommand: ${subcommand}`, "red"));
    process.exit(1);
  }
}

async function handleTask(subcommand?: string, arg?: string): Promise<void> {
  if (subcommand === "list" || !subcommand) {
    printHeader("TASK LIST");
    const data = (await fetchAPI("/tasks")) as { tasks: Array<{ task_id: string; name: string; status: string; agent_id?: string; dependencies: string[] }> };
    printTable(
      ["ID", "Name", "Status", "Agent", "Dependencies"],
      data.tasks.map((t) => {
        const statusColor =
          t.status === "completed" ? "green" :
          t.status === "running" ? "cyan" :
          t.status === "failed" ? "red" : "yellow";
        return [
          t.task_id,
          t.name.substring(0, 30),
          colorize(t.status, statusColor),
          t.agent_id ?? "-",
          t.dependencies.join(", ") || "none",
        ];
      })
    );
    console.log(`\n  Total: ${colorize(String(data.tasks.length), "cyan")} tasks`);
  } else if (subcommand === "run") {
    const name = arg ?? "New task";
    const data = (await fetchAPI("/tasks", {
      method: "POST",
      body: JSON.stringify({ name }),
    })) as { task: { task_id: string; name: string; status: string } };
    console.log(colorize(`✓ Task created and queued: ${data.task.name} (${data.task.task_id})`, "green"));
  } else if (subcommand === "retry") {
    if (!arg) {
      console.error(colorize("✗ Usage: aios task retry <id>", "red"));
      process.exit(1);
    }
    await fetchAPI(`/tasks?id=${arg}`, { method: "PATCH" });
    console.log(colorize(`✓ Task ${arg} queued for retry`, "yellow"));
  } else if (subcommand === "cancel") {
    if (!arg) {
      console.error(colorize("✗ Usage: aios task cancel <id>", "red"));
      process.exit(1);
    }
    await fetchAPI(`/tasks?id=${arg}`, { method: "DELETE" });
    console.log(colorize(`✓ Task ${arg} cancelled`, "yellow"));
  } else {
    console.error(colorize(`✗ Unknown task subcommand: ${subcommand}`, "red"));
    process.exit(1);
  }
}

async function handleMonitor(): Promise<void> {
  printHeader("LIVE SYSTEM MONITOR");
  const data = (await fetchAPI("/health")) as {
    status: string;
    cpu_usage: number;
    memory_usage: number;
    gpu_usage: number;
    agent_count: number;
    active_swarms: number;
    task_throughput: number;
    token_usage_per_min: number;
    uptime_seconds: number;
  };
  const m = data;

  const bar = (pct: number, width = 20) => {
    const filled = Math.round((pct / 100) * width);
    const color = pct > 80 ? "red" : pct > 60 ? "yellow" : "green";
    return colorize("█".repeat(filled) + "░".repeat(width - filled), color) + ` ${pct}%`;
  };

  const days = Math.floor(m.uptime_seconds / 86400);
  const hours = Math.floor((m.uptime_seconds % 86400) / 3600);

  console.log(`\n  ${colorize("CPU", "dim")}     ${bar(m.cpu_usage)}`);
  console.log(`  ${colorize("Memory", "dim")}  ${bar(m.memory_usage)}`);
  console.log(`  ${colorize("GPU", "dim")}     ${bar(m.gpu_usage)}`);
  console.log(`\n  ${colorize("Agents", "cyan")}        ${colorize(String(m.agent_count), "bold")}`);
  console.log(`  ${colorize("Swarms", "cyan")}        ${colorize(String(m.active_swarms), "bold")}`);
  console.log(`  ${colorize("Task/min", "cyan")}      ${colorize(String(m.task_throughput), "bold")}`);
  console.log(`  ${colorize("Tokens/min", "cyan")}    ${colorize(String(m.token_usage_per_min), "bold")}`);
  console.log(`  ${colorize("Uptime", "cyan")}        ${colorize(`${days}d ${hours}h`, "bold")}`);
}

async function handleHealth(): Promise<void> {
  printHeader("SYSTEM HEALTH");
  const data = (await fetchAPI("/health")) as { status: string; cpu_usage: number; memory_usage: number; gpu_usage: number };
  const statusColor = data.status === "healthy" ? "green" : data.status === "degraded" ? "yellow" : "red";
  console.log(`\n  Status: ${colorize(data.status.toUpperCase(), statusColor)}`);
  console.log(`  CPU:    ${data.cpu_usage}%`);
  console.log(`  Memory: ${data.memory_usage}%`);
  console.log(`  GPU:    ${data.gpu_usage}%`);
}

async function handleSecurity(): Promise<void> {
  printHeader("SECURITY EVENTS");
  const data = (await fetchAPI("/security")) as { events: Array<{ event_id: string; type: string; severity: string; description: string; resolved: boolean; timestamp: string }> };
  printTable(
    ["ID", "Type", "Severity", "Description", "Resolved"],
    data.events.slice(0, 10).map((e) => {
      const sevColor = e.severity === "critical" ? "red" : e.severity === "high" ? "red" : e.severity === "medium" ? "yellow" : "dim";
      return [
        e.event_id,
        e.type,
        colorize(e.severity, sevColor),
        e.description.substring(0, 40),
        e.resolved ? colorize("yes", "green") : colorize("no", "red"),
      ];
    })
  );
  const open = data.events.filter((e) => !e.resolved).length;
  if (open > 0) {
    console.log(`\n  ${colorize(`⚠ ${open} unresolved security events`, "red")}`);
  }
}

function printHelp(): void {
  printHeader("CLI HELP");
  console.log(`
  ${colorize("SWARM COMMANDS", "cyan")}
    aios swarm list                   List all swarms
    aios swarm spawn [name]           Spawn a new swarm
    aios swarm terminate <id>         Terminate a swarm

  ${colorize("AGENT COMMANDS", "cyan")}
    aios agent list                   List all agents
    aios agent spawn [role]           Spawn a new agent
    aios agent pause <id>             Pause an agent
    aios agent terminate <id>         Terminate an agent

  ${colorize("TASK COMMANDS", "cyan")}
    aios task list                    List all tasks
    aios task run [name]              Create and run a task
    aios task retry <id>              Retry a failed task
    aios task cancel <id>             Cancel a pending task

  ${colorize("MONITORING", "cyan")}
    aios monitor                      Live system metrics
    aios health                       System health status
    aios security                     Recent security events

  ${colorize("ENVIRONMENT", "dim")}
    CONTROL_PANEL_URL   Control panel URL (default: http://localhost:3001)
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { command, subcommand, arg } = parseArgs(process.argv);

  try {
    switch (command) {
      case "swarm":
        await handleSwarm(subcommand, arg);
        break;
      case "agent":
        await handleAgent(subcommand, arg);
        break;
      case "task":
        await handleTask(subcommand, arg);
        break;
      case "monitor":
        await handleMonitor();
        break;
      case "health":
        await handleHealth();
        break;
      case "security":
        await handleSecurity();
        break;
      case "help":
      default:
        printHelp();
    }
  } catch (err) {
    console.error(colorize(`\n✗ Error: ${(err as Error).message}`, "red"));
    process.exit(1);
  }
}

main();
