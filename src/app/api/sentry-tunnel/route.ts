/**
 * Sentry Tunnel API Route
 *
 * ad-blocker를 우회하여 Sentry 이벤트를 프록시
 * Next.js App Router 수동 tunnel 구현
 */

import { NextResponse } from 'next/server';

// Sentry DSN 파싱
const SENTRY_DSN =
  process.env.SENTRY_DSN ||
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  'https://c4cfe13cdda790d1d9a6c3f92c593f39@o4509732473667584.ingest.de.sentry.io/4510731369119824';

// DSN에서 Sentry ingest URL 추출
function getSentryIngestUrl(): string {
  try {
    const url = new URL(SENTRY_DSN);
    const projectId = url.pathname.replace('/', '');
    return `https://${url.host}/api/${projectId}/envelope/`;
  } catch {
    // Fallback EU ingest URL
    return 'https://o4509732473667584.ingest.de.sentry.io/api/4510731369119824/envelope/';
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();

    if (!body) {
      return NextResponse.json({ error: 'Empty body' }, { status: 400 });
    }

    const sentryUrl = getSentryIngestUrl();

    // Sentry로 이벤트 전달
    const response = await fetch(sentryUrl, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
    });

    // Sentry 응답 전달
    const responseText = await response.text();

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('[Sentry Tunnel] Error:', error);
    return NextResponse.json({ error: 'Tunnel error' }, { status: 500 });
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
