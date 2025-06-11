import { NextRequest, NextResponse } from 'next/server';
import { detectAnomalies, MetricPoint } from '@/lib/ml/lightweight-ml-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { history, threshold = 2.5 } = await req.json();
    if (!Array.isArray(history) || history.length === 0) {
      return NextResponse.json(
        { error: 'history is required' },
        { status: 400 }
      );
    }
    const anomalies = detectAnomalies(history as MetricPoint[], threshold);
    return NextResponse.json({ anomalies, count: anomalies.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
