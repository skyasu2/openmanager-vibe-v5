import { NextResponse } from 'next/server';
import { mockConversations } from '../mock-data';

export function GET() {
  return NextResponse.json({ conversations: mockConversations });
}
