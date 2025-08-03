/**
 * 🎯 하이브리드 AI 데모 페이지
 * 
 * 무료 티어 최적화된 AI 시스템 데모
 * /demo/hybrid-ai
 */

import { Suspense } from 'react';
import { HybridAIDemo } from '@/components/demo/HybridAIDemo';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: '하이브리드 AI 데모 | OpenManager VIBE',
  description: '무료 티어에 최적화된 분산 AI 시스템 데모',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function HybridAIDemoPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Suspense fallback={<LoadingSkeleton />}>
        <HybridAIDemo />
      </Suspense>
    </div>
  );
}