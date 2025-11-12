import { NextResponse } from 'next/server';
import { mockAdminStats } from '../mock-data';

export function GET() {
  return NextResponse.json({ stats: mockAdminStats });
}
