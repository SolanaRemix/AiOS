import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ mode: 'assisted', kill_switch: false, human_in_loop: true });
}

export async function POST(request: Request) {
  const body = await request.json() as { mode: string };
  return NextResponse.json({ success: true, mode: body.mode });
}
