import { NextResponse } from 'next/server';
import { mockModelRoutes } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json({ models: mockModelRoutes, total: mockModelRoutes.length });
}
