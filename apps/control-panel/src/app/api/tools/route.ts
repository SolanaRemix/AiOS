import { NextResponse } from 'next/server';
import { ToolExecution } from '@/types';
import { mockToolExecutions } from '@/lib/mock-data';

// In-memory mutable state for tool executions, initialized from mock data.
// Note: state is per-process and will reset on server restart.
let toolsState: ToolExecution[] = [...mockToolExecutions];

export async function GET() {
  return NextResponse.json({ executions: toolsState, total: toolsState.length });
}

export async function POST(request: Request) {
  let body: Partial<ToolExecution> = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const execution: ToolExecution = {
    execution_id: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tool_name: body.tool_name ?? 'unknown',
    tool_type: body.tool_type ?? 'system',
    status: body.status ?? 'pending',
    agent_id: body.agent_id ?? 'unknown',
    command: body.command,
    result: body.result,
    started_at: new Date().toISOString(),
    requires_approval: body.requires_approval ?? false,
  };

  toolsState.push(execution);
  return NextResponse.json({ execution }, { status: 201 });
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const execution_id = url.searchParams.get('execution_id') ?? url.searchParams.get('id');

  if (!execution_id) {
    return NextResponse.json(
      { error: 'Missing required "execution_id" query parameter' },
      { status: 400 },
    );
  }

  let updates: Partial<ToolExecution> = {};
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const index = toolsState.findIndex(e => e.execution_id === execution_id);

  if (index === -1) {
    return NextResponse.json(
      { error: `Execution with id "${execution_id}" not found` },
      { status: 404 },
    );
  }

  // Only allow safe status/result fields to be updated (whitelist).
  const allowedUpdates: Partial<Pick<ToolExecution, 'status' | 'result' | 'requires_approval'>> = {};
  if (updates.status !== undefined) allowedUpdates.status = updates.status;
  if (updates.result !== undefined) allowedUpdates.result = updates.result;
  if (updates.requires_approval !== undefined) allowedUpdates.requires_approval = updates.requires_approval;

  const updated: ToolExecution = {
    ...toolsState[index],
    ...allowedUpdates,
    execution_id: toolsState[index].execution_id,
  };
  toolsState[index] = updated;

  return NextResponse.json({ execution: updated }, { status: 200 });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const execution_id = url.searchParams.get('execution_id') ?? url.searchParams.get('id');

  if (!execution_id) {
    return NextResponse.json(
      { error: 'Missing required "execution_id" query parameter' },
      { status: 400 },
    );
  }

  const index = toolsState.findIndex(e => e.execution_id === execution_id);

  if (index === -1) {
    return NextResponse.json(
      { error: `Execution with id "${execution_id}" not found` },
      { status: 404 },
    );
  }

  const [removed] = toolsState.splice(index, 1);
  return NextResponse.json({ execution: removed }, { status: 200 });
}
