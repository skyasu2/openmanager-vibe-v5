/**
 * 환경 표시 배지 컴포넌트
 *
 * 현재 실행 환경을 시각적으로 표시 (개발/테스트/프로덕션)
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { useEnvironment } from '@/hooks/useApiConfig';

export function EnvironmentBadge() {
  const env = useEnvironment();

  // 프로덕션에서는 표시하지 않음
  if (env.isProduction) {
    return null;
  }

  // 환경별 스타일 설정
  const variant = env.when(
    {
      development: 'default',
      test: 'secondary',
      production: 'destructive',
    },
    'default'
  ) as 'default' | 'secondary' | 'destructive' | 'outline';

  const label = env.when(
    {
      development: '🔧 개발',
      test: '🧪 테스트',
      production: '🚀 프로덕션',
    },
    env.current
  );

  const description = env.when(
    {
      development: 'localhost:3000',
      test: 'test.vercel.app',
      production: 'vibe-v5.vercel.app',
    },
    ''
  );

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      <Badge variant={variant} className="shadow-lg">
        <span className="mr-1">{label}</span>
        <span className="text-xs opacity-75">({description})</span>
      </Badge>
    </div>
  );
}

/**
 * 환경별 디버그 정보 표시 컴포넌트
 */
export function EnvironmentDebugInfo() {
  const env = useEnvironment();

  // 개발 환경에서만 표시
  if (!env.isDevelopment) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-xs rounded-lg bg-black/80 p-3 font-mono text-xs text-white">
      <div className="space-y-1">
        <div>ENV: {env.current}</div>
        <div>NODE_ENV: {process.env.NODE_ENV}</div>
        <div>VERCEL: {process.env.VERCEL ? 'true' : 'false'}</div>
        <div>SITE: {process.env.NEXT_PUBLIC_SITE_URL}</div>
      </div>
    </div>
  );
}
