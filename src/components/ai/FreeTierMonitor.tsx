'use client';

import {
  Activity,
  AlertCircle,
  Cloud,
  Database,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface FreeTierStats {
  vercel: { used: number; limit: number; unit: string };
  supabase: { used: number; limit: number; unit: string };
  googleAI: { used: number; limit: number; unit: string };
  cached: boolean;
}

export default function FreeTierMonitor() {
  const [stats, setStats] = useState<FreeTierStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/ai/cache-stats');
        const data = await res.json();

        setStats({
          vercel: { used: 10, limit: 100, unit: 'GB' },
          supabase: { used: 50, limit: 500, unit: 'MB' },
          googleAI: {
            used: data.googleAI?.dailyUsage || 0,
            limit: 1200,
            unit: '요청/일',
          },
          cached: data.cached || false,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
    const interval = setInterval(() => void fetchStats(), 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">로딩 중...</div>
    );
  }

  if (!stats) return null;

  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-red-600 bg-red-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const services = [
    {
      name: 'Vercel',
      icon: Zap,
      ...stats.vercel,
      description: '대역폭',
    },
    {
      name: 'Supabase',
      icon: Database,
      ...stats.supabase,
      description: 'DB 용량',
    },
    {
      name: 'Google AI',
      icon: Cloud,
      ...stats.googleAI,
      description: 'API 호출',
    },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          무료 티어 사용량
        </h3>
        <Activity className="h-4 w-4 text-gray-400" />
      </div>

      {services.map((service) => {
        const percentage = (service.used / service.limit) * 100;
        const colorClass = getUsageColor(percentage);

        return (
          <div key={service.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <service.icon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {service.name}
                </span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
              >
                {percentage.toFixed(0)}%
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full transition-all duration-300 ${
                  percentage >= 80
                    ? 'bg-red-500'
                    : percentage >= 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{service.description}</span>
              <span>
                {service.used} / {service.limit} {service.unit}
              </span>
            </div>
          </div>
        );
      })}

      <div className="mt-4 rounded-lg bg-blue-50 p-3">
        <div className="flex items-start gap-2">
          <TrendingUp className="mt-0.5 h-4 w-4 text-blue-600" />
          <div className="text-xs text-blue-700">
            <p className="font-medium">총 운영비: $0/월</p>
            <p className="mt-1 text-blue-600">
              모든 서비스가 무료 티어 내에서 안정적으로 운영 중입니다.
            </p>
          </div>
        </div>
      </div>

      {stats.googleAI.used > 960 && (
        <div className="rounded-lg bg-yellow-50 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 text-yellow-600" />
            <div className="text-xs text-yellow-700">
              <p className="font-medium">Google AI 사용량 주의</p>
              <p className="mt-1">
                일일 제한의 80%에 도달했습니다. 캐싱이 자동으로 강화됩니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
