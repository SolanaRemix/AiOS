import { NextResponse } from 'next/server';
import { ModelRoute } from '@/types';
import { mockModelRoutes } from '@/lib/mock-data';

// In-memory mutable state for model routes, initialized from mock data.
// Note: state is per-process and will reset on server restart.
let modelsState: ModelRoute[] = [...mockModelRoutes];

export async function GET() {
  return NextResponse.json({ models: modelsState, total: modelsState.length });
}

export async function POST(request: Request) {
  let body: Partial<ModelRoute> = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.provider || !body.model) {
    return NextResponse.json(
      { error: 'Missing required fields: provider, model' },
      { status: 400 },
    );
  }

  const exists = modelsState.some(m => m.provider === body.provider && m.model === body.model);
  if (exists) {
    return NextResponse.json(
      { error: `Model "${body.provider}/${body.model}" already exists` },
      { status: 409 },
    );
  }

  const model: ModelRoute = {
    provider: body.provider,
    model: body.model,
    requests_today: body.requests_today ?? 0,
    tokens_used: body.tokens_used ?? 0,
    cost_today: body.cost_today ?? 0,
    avg_latency_ms: body.avg_latency_ms ?? 0,
    error_rate: body.error_rate ?? 0,
    status: body.status ?? 'active',
  };

  modelsState.push(model);
  return NextResponse.json({ model }, { status: 201 });
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider');
  const model = url.searchParams.get('model');

  if (!provider || !model) {
    return NextResponse.json(
      { error: 'Missing required query parameters: provider, model' },
      { status: 400 },
    );
  }

  let updates: Partial<ModelRoute> = {};
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const index = modelsState.findIndex(m => m.provider === provider && m.model === model);
  if (index === -1) {
    return NextResponse.json(
      { error: `Model "${provider}/${model}" not found` },
      { status: 404 },
    );
  }

  // Exclude provider and model from body spread so query params are the authoritative identifiers.
  const { provider: _p, model: _m, ...safeUpdates } = updates;
  const updated: ModelRoute = { ...modelsState[index], ...safeUpdates, provider, model };
  modelsState[index] = updated;
  return NextResponse.json({ model: updated }, { status: 200 });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider');
  const model = url.searchParams.get('model');

  if (!provider || !model) {
    return NextResponse.json(
      { error: 'Missing required query parameters: provider, model' },
      { status: 400 },
    );
  }

  const index = modelsState.findIndex(m => m.provider === provider && m.model === model);
  if (index === -1) {
    return NextResponse.json(
      { error: `Model "${provider}/${model}" not found` },
      { status: 404 },
    );
  }

  const [removed] = modelsState.splice(index, 1);
  return NextResponse.json({ model: removed }, { status: 200 });
}
