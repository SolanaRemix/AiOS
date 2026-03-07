import { NextResponse } from 'next/server';
import { MemoryEntry } from '@/types';
import { mockMemory } from '@/lib/mock-data';

// In-memory mutable state for memory entries, initialized from mock data.
// Note: state is per-process and will reset on server restart.
let memoryState: MemoryEntry[] = [...mockMemory];

export async function GET() {
  return NextResponse.json({ entries: memoryState, total: memoryState.length });
}

export async function POST(request: Request) {
  let body: Partial<MemoryEntry> = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.type || !body.content) {
    return NextResponse.json(
      { error: 'Missing required fields: type, content' },
      { status: 400 },
    );
  }

  const entry: MemoryEntry = {
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: body.type,
    content: body.content,
    agent_id: body.agent_id,
    embedding: body.embedding,
    metadata: body.metadata ?? {},
    created_at: new Date().toISOString(),
    importance: body.importance ?? 0.5,
  };

  memoryState.push(entry);
  return NextResponse.json({ entry }, { status: 201 });
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Missing required "id" query parameter' },
      { status: 400 },
    );
  }

  let updates: Partial<MemoryEntry> = {};
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const index = memoryState.findIndex(e => e.id === id);
  if (index === -1) {
    return NextResponse.json(
      { error: `Memory entry with id "${id}" not found` },
      { status: 404 },
    );
  }

  // Exclude id from body spread so the query param is the authoritative identifier.
  const { id: _id, ...safeUpdates } = updates;
  const updated: MemoryEntry = { ...memoryState[index], ...safeUpdates, id };
  memoryState[index] = updated;
  return NextResponse.json({ entry: updated }, { status: 200 });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Missing required "id" query parameter' },
      { status: 400 },
    );
  }

  const index = memoryState.findIndex(e => e.id === id);
  if (index === -1) {
    return NextResponse.json(
      { error: `Memory entry with id "${id}" not found` },
      { status: 404 },
    );
  }

  const [removed] = memoryState.splice(index, 1);
  return NextResponse.json({ entry: removed }, { status: 200 });
}
