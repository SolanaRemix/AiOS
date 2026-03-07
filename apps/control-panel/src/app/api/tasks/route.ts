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

  return NextResponse.json(
    {
      action: 'run',
      status: 'mocked',
      requestBody: body,
    },
    { status: 200 }
  );
}

export async function PATCH(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    // Ignore body parsing errors for mocked handler
  }

  return NextResponse.json(
    {
      action: 'retry',
      status: 'mocked',
      requestBody: body,
    },
    { status: 200 }
  );
}

export async function DELETE(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    // Ignore body parsing errors for mocked handler
  }

  return NextResponse.json(
    {
      action: 'cancel',
      status: 'mocked',
      requestBody: body,
    },
    { status: 200 }
  );
}
