import { NextResponse } from 'next/server';
import { mockMemory } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json({ entries: mockMemory, total: mockMemory.length });
}
