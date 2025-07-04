import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, mode } = await request.json();

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query required' },
        { status: 400 }
      );
    }

    const response = `Hybrid AI Agent Response: ${query}`;

    return NextResponse.json({
      success: true,
      response,
      mode: mode || 'hybrid',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Hybrid AI Agent Error:', error);
    return NextResponse.json(
      { success: false, error: 'Processing error' },
      { status: 500 }
    );
  }
}
