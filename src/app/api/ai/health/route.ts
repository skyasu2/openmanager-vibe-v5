import { NextResponse } from 'next/server';
import { checkCloudRunHealth } from '@/lib/cloud-run/proxy';

export const runtime = 'edge';

export async function GET() {
  const result = await checkCloudRunHealth();

  if (result.healthy) {
    return NextResponse.json({
      status: 'ok',
      backend: 'cloud-run',
      latency: result.latency,
    });
  }

  return NextResponse.json(
    {
      status: 'error',
      backend: 'cloud-run',
      error: result.error,
    },
    { status: 503 }
  );
}
