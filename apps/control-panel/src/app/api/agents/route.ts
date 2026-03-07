import { NextResponse } from 'next/server';
import { mockAgents } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json({ agents: mockAgents, total: mockAgents.length });
}
