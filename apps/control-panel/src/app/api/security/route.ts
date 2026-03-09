import { NextResponse } from 'next/server';
import { mockSecurityEvents } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json({
    events: mockSecurityEvents,
    total: mockSecurityEvents.length,
    unresolved: mockSecurityEvents.filter(e => !e.resolved).length,
  });
}
