import { NextResponse } from 'next/server';
import { mockTasks } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json({ tasks: mockTasks, total: mockTasks.length });
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    // Ignore body parsing errors for mocked handler
  }

  const task =
    body && typeof body === 'object'
      ? {
          task_id: 'mocked-task-id',
          status: 'pending',
          ...(body as Record<string, unknown>),
        }
      : {
          task_id: 'mocked-task-id',
          status: 'pending',
        };

  return NextResponse.json(
    {
      task,
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    // Ignore body parsing errors for mocked handler
  }

  const url = new URL(request.url);
  const taskId =
    url.searchParams.get('task_id') ?? url.searchParams.get('id');

  const responsePayload: Record<string, unknown> = {
    action: 'retry',
    status: 'running',
    requestBody: body,
  };

  if (taskId !== null) {
    responsePayload.task_id = taskId;
  }

  return NextResponse.json(responsePayload, { status: 200 });
}

export async function DELETE(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    // Ignore body parsing errors for mocked handler
  }

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const queryTaskId = searchParams.get('task_id') ?? searchParams.get('id');

  // Attempt to resolve a task identifier from query params or body
  const bodyTaskId =
    typeof body === 'object' && body !== null
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((body as any).task_id ?? (body as any).id ?? null)
      : null;

  const taskId = queryTaskId ?? bodyTaskId ?? null;

  return NextResponse.json(
    {
      action: 'cancel',
      status: 'mocked',
      requestBody: body,
      success: true,
      task_id: taskId,
    },
    { status: 200 }
  );
}
