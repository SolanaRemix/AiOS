import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ mode: 'assisted', kill_switch: false, human_in_loop: true });
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

  return NextResponse.json({ success: true, mode });
}
