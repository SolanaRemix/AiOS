import { NextResponse } from 'next/server';
import { mockSystemMetrics } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json({ ...mockSystemMetrics, status: 'healthy' });
}

// Health is a read-only resource; explicitly reject mutation attempts.
export async function POST() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
