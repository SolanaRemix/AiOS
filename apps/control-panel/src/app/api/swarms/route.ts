import { NextResponse } from 'next/server';
import { mockSwarms } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json({ swarms: mockSwarms, total: mockSwarms.length });
}
