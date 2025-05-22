'use client'

import { Suspense } from 'react'
import RedisUsageCard from '@/components/monitoring/RedisUsageCard'
import SupabaseStorageCard from '@/components/monitoring/SupabaseStorageCard'
import PerformanceCard from '@/components/monitoring/PerformanceCard'
import LogsTable from '@/components/monitoring/LogsTable'
import { RefreshCw } from 'lucide-react'

export default function MonitoringPage() {
  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">시스템 모니터링</h1>
        <p className="text-gray-600">
          OpenManager Vibe V5의 성능 및 리소스 사용량을 실시간으로 모니터링합니다.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Suspense fallback={<CardSkeleton />}>
          <RedisUsageCard />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
          <SupabaseStorageCard />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
          <PerformanceCard />
        </Suspense>
      </div>

      <div className="mb-8">
        <Suspense fallback={<CardSkeleton height="h-[500px]" />}>
          <LogsTable />
        </Suspense>
      </div>
    </div>
  )
}

function CardSkeleton({ height = 'h-[300px]' }: { height?: string }) {
  return (
    <div className={`rounded-lg border bg-card shadow-sm ${height} flex items-center justify-center`}>
      <RefreshCw className="w-8 h-8 text-gray-300 animate-spin" />
    </div>
  )
} 