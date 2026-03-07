import { NextResponse } from 'next/server';
import { mockSwarms } from '@/lib/mock-data';

// In-memory mutable state for swarms, initialized from mock data.
let swarmsState = [...mockSwarms];

export async function GET() {
  return NextResponse.json({ swarms: swarmsState, total: swarmsState.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Assign a simple string ID if none is provided.
    const id =
      typeof body.id === 'string' && body.id.length > 0
        ? body.id
        : Date.now().toString();

    const newSwarm = { id, ...body };
    swarmsState.push(newSwarm);

    return NextResponse.json(newSwarm, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }
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

  const index = swarmsState.findIndex((swarm: any) => swarm.id === id);

  if (index === -1) {
    return NextResponse.json(
      { error: `Swarm with id "${id}" not found` },
      { status: 404 },
    );
  }

  const [removed] = swarmsState.splice(index, 1);
  return NextResponse.json(removed, { status: 200 });
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

  let updates: any;
  try {
    updates = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const index = swarmsState.findIndex((swarm: any) => swarm.id === id);

  if (index === -1) {
    return NextResponse.json(
      { error: `Swarm with id "${id}" not found` },
      { status: 404 },
    );
  }

  const existing = swarmsState[index];
  const updated = { ...existing, ...updates, id: existing.id };
  swarmsState[index] = updated;

  return NextResponse.json(updated, { status: 200 });
}
