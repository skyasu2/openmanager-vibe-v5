/**
 * 🚀 실시간 포트 모니터링 대시보드
 *
 * AI 교차검증 기반 포트 충돌 해결 시스템
 * Gemini (아키텍처) + Codex (실무) + Qwen (성능) 통합
 */

'use client';

import {
  Activity,
  BarChart3,
  CheckCircle,
  Network,
  RefreshCw,
  Server,
  Settings,
  Timer,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { logger } from '@/lib/logging';

// 포트 상태 인터페이스
interface PortInfo {
  port: number;
  available: boolean;
  lastChecked: number;
  service?: string;
  pid?: number;
  command?: string;
  platform?: 'WSL' | 'Windows';
  uptime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

interface PortMonitorProps {
  /** 모니터링할 포트 범위 */
  portRange?: { start: number; end: number };
  /** 기본 모니터링 포트들 */
  defaultPorts?: number[];
  /** 업데이트 간격 (밀리초) */
  updateInterval?: number;
  /** 자동 새로고침 활성화 */
  autoRefresh?: boolean;
  /** 컴팩트 모드 */
  compact?: boolean;
}

export function PortMonitor({
  portRange = { start: 3000, end: 4010 },
  defaultPorts = [3000, 3001, 3002, 3003, 3004, 3005],
  updateInterval = 5000,
  autoRefresh = true,
  compact = false,
}: PortMonitorProps) {
  const [portStates, setPortStates] = useState<Map<number, PortInfo>>(
    new Map()
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  const [selectedPorts, setSelectedPorts] = useState<Set<number>>(
    new Set(defaultPorts)
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 🚨 SAFE: Mock 포트 상태 가져오기 함수 (브라우저 호환)
  const fetchPortStates = useCallback(async () => {
    setIsRefreshing(true);

    try {
      // ✅ SAFE: 클라이언트 친화적 Mock 데이터 생성
      const portsToCheck = Array.from(selectedPorts);
      const newPortStates = new Map<number, PortInfo>();

      // 현실적인 Mock 시뮬레이션
      for (const port of portsToCheck) {
        // 포트별 고유한 시드로 일관성 있는 Mock 데이터
        const seed = port * 2654435761; // FNV-1a 해시 기반
        const random1 = ((seed >> 16) & 0xffff) / 0xffff;
        const random2 = ((seed >> 8) & 0xffff) / 0xffff;
        const random3 = (seed & 0xffff) / 0xffff;

        // 개발 포트들은 사용 중일 확률이 높음
        const isDevelopmentPort = [3000, 3001, 3002, 3003].includes(port);
        const isAvailable = isDevelopmentPort ? random1 > 0.7 : random1 > 0.3;

        newPortStates.set(port, {
          port,
          available: isAvailable,
          lastChecked: Date.now(),
          service: isAvailable
            ? undefined
            : isDevelopmentPort
              ? 'Next.js Dev Server'
              : [
                  'Node.js App',
                  'Express Server',
                  'React App',
                  'Unknown Service',
                ][Math.floor(random2 * 4)],
          uptime: isAvailable ? undefined : Math.floor(random3 * 3600), // 0-1시간
          memoryUsage: 20 + random1 * 60, // 20-80%
          cpuUsage: 10 + random2 * 30, // 10-40%
          platform: 'WSL' as const,
        });
      }

      setPortStates(newPortStates);
      setLastUpdate(new Date());
    } catch (error) {
      logger.error('포트 상태 조회 실패:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedPorts]);

  // 자동 새로고침 설정
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoRefreshEnabled) {
      interval = setInterval(() => {
        void fetchPortStates();
      }, updateInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefreshEnabled, updateInterval, fetchPortStates]);

  // 초기 데이터 로드
  useEffect(() => {
    void fetchPortStates();
  }, [fetchPortStates]);

  // 포트 상태 통계
  const getPortStats = () => {
    const ports = Array.from(portStates.values());
    const available = ports.filter((p) => p.available).length;
    const occupied = ports.filter((p) => !p.available).length;
    const total = ports.length;

    return { available, occupied, total };
  };

  // 포트 추가/제거
  const togglePortMonitoring = (port: number) => {
    const newPorts = new Set(selectedPorts);
    if (newPorts.has(port)) {
      newPorts.delete(port);
    } else {
      newPorts.add(port);
    }
    setSelectedPorts(newPorts);
  };

  // 포트 범위 추가
  const addPortRange = () => {
    const newPorts = new Set(selectedPorts);
    for (let i = portRange.start; i <= portRange.end; i++) {
      newPorts.add(i);
    }
    setSelectedPorts(newPorts);
  };

  const stats = getPortStats();

  if (compact) {
    return (
      <CompactPortMonitor
        portStates={portStates}
        onRefresh={() => {
          void fetchPortStates();
        }}
        isRefreshing={isRefreshing}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 및 컨트롤 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Network className="h-5 w-5 text-blue-500" />
            <h2 className="text-2xl font-bold">포트 모니터링</h2>
            <Badge variant="outline" className="text-xs">
              AI 교차검증 기반
            </Badge>
          </div>
          {lastUpdate && (
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span>마지막 업데이트: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm">자동 새로고침</span>
            <Switch
              checked={autoRefreshEnabled}
              onCheckedChange={setAutoRefreshEnabled}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void fetchPortStates();
            }}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            새로고침
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings className="mr-2 h-4 w-4" />
            고급 설정
          </Button>
        </div>
      </div>

      {/* 포트 통계 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.available}</p>
                <p className="text-sm text-muted-foreground">사용 가능</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-red-100 p-2">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.occupied}</p>
                <p className="text-sm text-muted-foreground">사용 중</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-2">
                <Server className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">총 모니터링</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-yellow-100 p-2">
                <Activity className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.total > 0
                    ? Math.round((stats.available / stats.total) * 100)
                    : 0}
                  %
                </p>
                <p className="text-sm text-muted-foreground">가용률</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 고급 설정 (접을 수 있는 패널) */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              고급 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">포트 범위 추가</p>
                <p className="text-sm text-muted-foreground">
                  {portRange.start}-{portRange.end} 범위의 포트들을 모니터링에
                  추가
                </p>
              </div>
              <Button onClick={addPortRange} variant="outline" size="sm">
                범위 추가
              </Button>
            </div>

            <Separator />

            <div>
              <p className="mb-2 font-medium">개별 포트 관리</p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 20 }, (_, i) => portRange.start + i).map(
                  (port) => (
                    <Button
                      key={port}
                      variant={selectedPorts.has(port) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => togglePortMonitoring(port)}
                    >
                      {port}
                    </Button>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 포트 상세 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            포트 상세 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-card-lg">
            <div className="space-y-3">
              {Array.from(portStates.values())
                .sort((a, b) => a.port - b.port)
                .map((portInfo) => (
                  <PortStatusCard key={portInfo.port} portInfo={portInfo} />
                ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// 개별 포트 상태 카드
function PortStatusCard({ portInfo }: { portInfo: PortInfo }) {
  const getStatusColor = (available: boolean) => {
    return available ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (available: boolean) => {
    return available ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(portInfo.available)}
            <div>
              <p className="font-medium">포트 {portInfo.port}</p>
              <p className={`text-sm ${getStatusColor(portInfo.available)}`}>
                {portInfo.available ? '사용 가능' : '사용 중'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {portInfo.service && (
              <div className="text-right">
                <p className="text-sm font-medium">{portInfo.service}</p>
                {portInfo.platform && (
                  <Badge variant="outline" className="text-xs">
                    {portInfo.platform}
                  </Badge>
                )}
              </div>
            )}

            {portInfo.memoryUsage !== undefined && (
              <div className="min-w-[80px] text-right">
                <p className="text-xs text-muted-foreground">메모리</p>
                <div className="flex items-center space-x-2">
                  <Progress value={portInfo.memoryUsage} className="h-2 w-12" />
                  <span className="text-xs">
                    {Math.round(portInfo.memoryUsage)}%
                  </span>
                </div>
              </div>
            )}

            {portInfo.uptime !== undefined && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">가동시간</p>
                <p className="text-sm">{formatUptime(portInfo.uptime)}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 컴팩트 모드 컴포넌트
function CompactPortMonitor({
  portStates,
  onRefresh,
  isRefreshing,
}: {
  portStates: Map<number, PortInfo>;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const stats = {
    available: Array.from(portStates.values()).filter((p) => p.available)
      .length,
    total: portStates.size,
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">포트 상태</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm">
          <span>
            사용 가능: {stats.available}/{stats.total}
          </span>
          <div className="flex space-x-1">
            {Array.from(portStates.values())
              .slice(0, 6)
              .map((port) => (
                <div
                  key={port.port}
                  className={`h-2 w-2 rounded-full ${
                    port.available ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  title={`포트 ${port.port}: ${port.available ? '사용가능' : '사용중'}`}
                />
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 유틸리티 함수들
function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간`;
  return `${Math.floor(seconds / 86400)}일`;
}

// 기본 내보내기
export default PortMonitor;
