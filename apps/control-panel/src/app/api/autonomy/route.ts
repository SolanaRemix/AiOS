import { NextResponse } from 'next/server';

// In-memory autonomy state.
// Note: state is per-process and will reset on server restart.
let autonomyState = {
  mode: 'assisted' as string,
  kill_switch: false,
  human_in_loop: true,
  require_tool_approval: true,
  require_financial_approval: true,
  require_system_approval: true,
  auto_pause_on_security: true,
};

export async function GET() {
  return NextResponse.json(autonomyState);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON in request body' },
      { status: 400 },
    );
  }

  const mode = (body as { mode?: unknown })?.mode;

  if (typeof mode !== 'string' || mode.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid "mode" in request body' },
      { status: 400 },
    );
  }

  autonomyState = { ...autonomyState, mode };
  return NextResponse.json({ success: true, mode });
}

export async function PATCH(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON in request body' },
      { status: 400 },
    );
  }

  // Whitelist updatable boolean flag fields and mode.
  const boolFields = ['kill_switch', 'human_in_loop', 'require_tool_approval', 'require_financial_approval', 'require_system_approval', 'auto_pause_on_security'] as const;
  type AutonomyBoolKey = typeof boolFields[number];
  const updates: Partial<typeof autonomyState> = {};

  const typed = body as Record<string, unknown>;
  if (typeof typed.mode === 'string' && typed.mode.length > 0) {
    updates.mode = typed.mode;
  }
  for (const key of boolFields) {
    if (typeof typed[key] === 'boolean') {
      (updates as Record<AutonomyBoolKey, boolean>)[key] = typed[key] as boolean;
    }
  }

  autonomyState = { ...autonomyState, ...updates };
  return NextResponse.json({ success: true, autonomy: autonomyState }, { status: 200 });
}

export async function DELETE() {
  // Reset autonomy state to safe defaults.
  autonomyState = {
    mode: 'manual',
    kill_switch: true,
    human_in_loop: true,
    require_tool_approval: true,
    require_financial_approval: true,
    require_system_approval: true,
    auto_pause_on_security: true,
  };
  return NextResponse.json({ success: true, autonomy: autonomyState }, { status: 200 });
}
