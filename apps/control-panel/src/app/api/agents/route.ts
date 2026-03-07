import { NextRequest, NextResponse } from 'next/server';
import { mockAgents } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json({ agents: mockAgents, total: mockAgents.length });
}

export async function POST(request: NextRequest) {
  // Mock implementation: echo the requested payload and assign a fake ID.
  const body = await request.json().catch(() => ({}));
  const createdAgent = {
    id: 'mock-created-id',
    ...body,
  };

  return NextResponse.json({ agent: createdAgent }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  // Mock implementation: apply the requested updates to a mock agent.
  const body = await request.json().catch(() => ({}));
  const updatedAgent = {
    id: body.id ?? 'mock-updated-id',
    ...body,
  };

  return NextResponse.json({ agent: updatedAgent }, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  // Mock implementation: accept an ID via JSON body or query params and return a confirmation.
  let id: string | undefined;

  // Try to read ID from query string first.
  const searchParams = request.nextUrl?.searchParams;
  if (searchParams) {
    id = searchParams.get('id') ?? undefined;
  }

  // Fallback: try to read ID from JSON body.
  if (!id) {
    const body = await request.json().catch(() => ({} as { id?: string }));
    id = (body as { id?: string }).id;
  }

  return NextResponse.json(
    { success: true, id: id ?? 'mock-deleted-id' },
    { status: 200 },
  );
}
