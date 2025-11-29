import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: Request) {
  return NextResponse.json(
    {
      error: 'This endpoint is deprecated. Use /api/ai/unified-stream instead.',
    },
    { status: 410 }
  );
}

export function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
