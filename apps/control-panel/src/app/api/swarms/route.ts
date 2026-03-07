import { NextResponse } from 'next/server';
import { Swarm } from '@/types';
import { mockSwarms } from '@/lib/mock-data';

// In-memory mutable state for swarms, initialized from mock data.
let swarmsState: Swarm[] = [...mockSwarms];

export async function GET() {
  return NextResponse.json({ swarms: swarmsState, total: swarmsState.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Use body.swarm_id if provided, otherwise generate one.
    const swarm_id =
      typeof body.swarm_id === 'string' && body.swarm_id.length > 0
        ? body.swarm_id
        : `swarm-${Date.now()}`;

    const newSwarm: Swarm = {
      swarm_id,
      name: body.name ?? 'New Swarm',
      type: body.type ?? 'sequential',
      agent_ids: body.agent_ids ?? [],
      status: body.status ?? 'idle',
      created_at: new Date().toISOString(),
      task_count: body.task_count ?? 0,
    };
    swarmsState.push(newSwarm);

    return NextResponse.json({ swarm: newSwarm }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  // Accept both swarm_id and id for CLI compatibility.
  const swarm_id = url.searchParams.get('swarm_id') ?? url.searchParams.get('id');

  if (!swarm_id) {
    return NextResponse.json(
      { error: 'Missing required "swarm_id" query parameter' },
      { status: 400 },
    );
  }

  const index = swarmsState.findIndex(swarm => swarm.swarm_id === swarm_id);

  if (index === -1) {
    return NextResponse.json(
      { error: `Swarm with swarm_id "${swarm_id}" not found` },
      { status: 404 },
    );
  }

  const [removed] = swarmsState.splice(index, 1);
  return NextResponse.json(removed, { status: 200 });
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const swarm_id = url.searchParams.get('swarm_id') ?? url.searchParams.get('id');

  if (!swarm_id) {
    return NextResponse.json(
      { error: 'Missing required "swarm_id" query parameter' },
      { status: 400 },
    );
  }

  let updates: Partial<Swarm>;
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const index = swarmsState.findIndex(swarm => swarm.swarm_id === swarm_id);

  if (index === -1) {
    return NextResponse.json(
      { error: `Swarm with swarm_id "${swarm_id}" not found` },
      { status: 404 },
    );
  }

  const existing = swarmsState[index];
  const updated: Swarm = { ...existing, ...updates, swarm_id: existing.swarm_id };
  swarmsState[index] = updated;

  return NextResponse.json(updated, { status: 200 });
}
