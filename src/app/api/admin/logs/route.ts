import { NextResponse } from 'next/server';
import { mockSystemLogs } from '../mock-data';

export function GET() {
  return NextResponse.json({ logs: mockSystemLogs });
}
