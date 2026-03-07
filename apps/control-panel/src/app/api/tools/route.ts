import { NextResponse } from 'next/server';
import { mockToolExecutions } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json({ executions: mockToolExecutions, total: mockToolExecutions.length });
}
