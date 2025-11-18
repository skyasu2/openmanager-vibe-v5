/**
 * 🌐 네트워크 모니터링 카드 컴포넌트
 * 실시간 네트워크 메트릭을 그래프로 시각화
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Globe,
  Signal,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useEffect, useState, ReactNode } from 'react';
// 🎯 Bundle-Safe Inline 매크로 - getSafe 함수들 (압축 방지)
const getSafeArrayLength = (arr: unknown): number => {
  try {
    if (arr === null || arr === undefined) return 0;
    const arrType = typeof arr;
    if (arrType !== 'object') return 0;
    if (arr === null || arr === undefined) return 0;
    const isArrayResult = Array.isArray(arr);
    if (!isArrayResult) return 0;
    if (!arr || !Array.isArray(arr)) return 0;
    if (!Object.prototype.hasOwnProperty.call(arr, 'length')) return 0;

    const lengthValue = (() => {
      try {
        const tempArr = arr as unknown[];
        if (!tempArr || !Array.isArray(tempArr)) return 0;
        const tempLength = tempArr.length;
        if (typeof tempLength !== 'number') return 0;
        return tempLength;
      } catch {
        return 0;
      }
    })();

    if (isNaN(lengthValue) || lengthValue < 0) return 0;
    return Math.floor(lengthValue);
  } catch (error) {
    console.error('🛡️ getSafeArrayLength Bundle-Safe error:', error);
    return 0;
  }
};

const getSafeLastArrayItem = <T,>(arr: unknown, fallback: T): T => {
  try {
    if (!arr || !Array.isArray(arr) || arr.length === 0) {
      return fallback;
    }
    const lastItem = arr[arr.length - 1];
    return lastItem !== undefined && lastItem !== null ? lastItem : fallback;
  } catch (error) {
    console.error('🛡️ getSafeLastArrayItem Bundle-Safe error:', error);
    return fallback;
  }
};

// 네트워크 메트릭 타입 정의
interface NetworkMetrics {
  timestamp: Date;
  bandwidthIn: number; // MB/s
  bandwidthOut: number; // MB/s
  latency: number; // ms
  packetLoss: number; // %
  activeConnections: number;
  status: 'online' | 'degraded' | 'offline';
}

// 가짜 데이터 생성 함수
const generateNetworkData = (previous?: NetworkMetrics): NetworkMetrics => {
  const now = new Date();

  if (!previous) {
    return {
      timestamp: now,
      bandwidthIn: Math.random() * 10 + 5,
      bandwidthOut: Math.random() * 8 + 2,
      latency: Math.random() * 30 + 10,
      packetLoss: Math.random() * 0.5,
      activeConnections: Math.floor(Math.random() * 100) + 50,
      status: 'online',
    };
  }

  // 이전 값 기반으로 현실적인 변화 적용
  const bandwidthIn = Math.max(
    0,
    previous.bandwidthIn + (Math.random() - 0.5) * 2
  );
  const bandwidthOut = Math.max(
    0,
    previous.bandwidthOut + (Math.random() - 0.5) * 1.5
  );
  const latency = Math.max(5, previous.latency + (Math.random() - 0.5) * 5);
  const packetLoss = Math.max(
    0,
    Math.min(5, previous.packetLoss + (Math.random() - 0.5) * 0.2)
  );
  const activeConnections = Math.max(
    10,
    previous.activeConnections + Math.floor((Math.random() - 0.5) * 10)
  );

  // 상태 결정
  let status: NetworkMetrics['status'] = 'online';
  if (packetLoss > 2 || latency > 50) {
    status = 'degraded';
  }
  if (packetLoss > 5 || latency > 100) {
    status = 'offline';
  }

  return {
    timestamp: now,
    bandwidthIn,
    bandwidthOut,
    latency,
    packetLoss,
    activeConnections,
    status,
  };
};

export const NetworkMonitoringCard = () => {
  const [history, setHistory] = useState<NetworkMetrics[]>([]);
  const [currentData, setCurrentData] = useState<NetworkMetrics | null>(null);

  useEffect(() => {
    // 초기 데이터 생성
    const initialData = Array.from({ length: 20 }, (_, i) => {
      const data = generateNetworkData(i > 0 ? history[i - 1] : undefined);
      return { ...data, timestamp: new Date(Date.now() - (20 - i) * 5000) };
    });
    setHistory(initialData);
    setCurrentData(getSafeLastArrayItem(initialData, null) ?? null);

    // 5초마다 데이터 업데이트
    const interval = setInterval(() => {
      setHistory((prev) => {
        const newData = generateNetworkData(getSafeLastArrayItem(prev, undefined));
        setCurrentData(newData);
        return [...prev.slice(-19), newData];
      });
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!currentData) {
    return (
      <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">
            네트워크 모니터링
          </CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-32 rounded bg-gray-200" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusColor = {
    online: 'text-green-500',
    degraded: 'text-yellow-500',
    offline: 'text-red-500',
  };

  const statusIcon = {
    online: <Wifi className="h-4 w-4" />,
    degraded: <Signal className="h-4 w-4" />,
    offline: <WifiOff className="h-4 w-4" />,
  };

  // 메트릭 컴포넌트
  const MetricChart = ({
    data,
    label,
    unit,
    color,
    icon,
  }: {
    data: number[];
    label: string;
    unit: string;
    color: string;
    icon: ReactNode;
  }) => {
    // 🛡️ 베르셀 환경 안전 배열 처리
    if (!data || !Array.isArray(data) || getSafeArrayLength(data) === 0) {
      return <div className="h-16 flex items-center justify-center text-gray-400 text-xs">데이터 없음</div>;
    }

    const safeDataLength = getSafeArrayLength(data);
    const points = data
      .map((value, _index) => {
        const x = safeDataLength > 1 ? (index / (safeDataLength - 1)) * 100 : 50;
        const safeValidData = data.filter(v => typeof v === 'number' && !isNaN(v));
        const maxValue = getSafeArrayLength(safeValidData) > 0 ? Math.max(...safeValidData) || 1 : 1;
        const y = 100 - Math.max(0, Math.min(100, (value / maxValue) * 100));
        return `${x},${y}`;
      })
      .join(' ');

    const currentValue = getSafeLastArrayItem(data, 0) || 0;
    const gradientId = `network-gradient-${label}-${Math.random()}`;

    return (
      <div className="rounded-lg bg-white/60 p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-gray-600">{icon}</div>
            <span className="text-xs font-medium text-gray-700">{label}</span>
          </div>
          <span className="text-sm font-bold text-gray-900">
            {currentValue.toFixed(1)} {unit}
          </span>
        </div>
        <div className="relative h-16">
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={color} stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              points={points}
            />
            <polygon
              fill={`url(#${gradientId})`}
              points={`0,100 ${points} 100,100`}
            />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-blue-200/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Globe className="h-4 w-4 text-blue-600" />
            네트워크 모니터링
          </CardTitle>
          <div
            className={`flex items-center gap-1 ${statusColor[currentData.status]}`}
          >
            {statusIcon[currentData.status]}
            <span className="text-xs font-medium uppercase">
              {currentData.status}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 대역폭 차트 */}
        <div className="grid grid-cols-2 gap-2">
          <MetricChart
            data={history.map((h) => h.bandwidthIn)}
            label="다운로드"
            unit="MB/s"
            color="#3B82F6"
            icon={<ArrowDown className="h-3 w-3" />}
          />
          <MetricChart
            data={history.map((h) => h.bandwidthOut)}
            label="업로드"
            unit="MB/s"
            color="#10B981"
            icon={<ArrowUp className="h-3 w-3" />}
          />
        </div>

        {/* 성능 지표 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-white/60 p-2 text-center">
            <p className="text-xs text-gray-600">레이턴시</p>
            <p className="text-sm font-bold text-gray-900">
              {currentData.latency.toFixed(0)} ms
            </p>
          </div>
          <div className="rounded-lg bg-white/60 p-2 text-center">
            <p className="text-xs text-gray-600">패킷 손실</p>
            <p className="text-sm font-bold text-gray-900">
              {currentData.packetLoss.toFixed(2)}%
            </p>
          </div>
          <div className="rounded-lg bg-white/60 p-2 text-center">
            <p className="text-xs text-gray-600">연결수</p>
            <p className="text-sm font-bold text-gray-900">
              {currentData.activeConnections}
            </p>
          </div>
        </div>

        {/* 활성 표시 */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Activity className="h-3 w-3 animate-pulse" />
            <span>실시간 업데이트 중</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
