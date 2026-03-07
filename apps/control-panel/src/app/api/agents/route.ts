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
  // Prefer ID from query params (for CLI compatibility), then JSON body (id or agent_id),
  // and finally fall back to a mock ID.
  const searchParams = request.nextUrl?.searchParams;
  const idFromQuery = searchParams ? searchParams.get('id') ?? undefined : undefined;

  const body = await request.json().catch(() => ({} as { id?: string; agent_id?: string }));
  const idFromBody = (body as { id?: string }).id;
  const agentIdFromBody = (body as { agent_id?: string }).agent_id;

  const resolvedId = idFromQuery ?? idFromBody ?? agentIdFromBody ?? 'mock-updated-id';

  const updatedAgent = {
    ...body,
    id: resolvedId,
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
