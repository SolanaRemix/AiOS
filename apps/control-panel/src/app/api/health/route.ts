import { NextResponse } from 'next/server';
import { mockSystemMetrics } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json({ ...mockSystemMetrics, status: 'healthy' });
}
