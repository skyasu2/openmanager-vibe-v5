import { NextRequest, NextResponse } from 'next/server';
import { EngineOrchestrator } from '@/services/ai/orchestrator/EngineOrchestrator';

const orchestrator = new EngineOrchestrator();

export async function POST(request: NextRequest) {
  try {
    const { question, context } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid question' },
        { status: 400 }
      );
    }

    const result = await orchestrator.query(question, context);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 