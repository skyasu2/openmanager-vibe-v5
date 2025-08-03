'use client';

/**
 * 🎭 Mock 시나리오 테스트 페이지
 * 
 * 개발 환경에서 다양한 Mock 시나리오를 테스트하고 시각화
 */

import { useState, useEffect } from 'react';
import { startMockScenario, getActiveScenarios, getMockStats } from '@/lib/ai/google-ai-client';
import { getSupabaseMockStats } from '@/lib/supabase/supabase-client';
import { getGCPFunctionsMockStats } from '@/lib/gcp/gcp-functions-client';

// 타입 정의
interface MockScenario {
  id: string;
  type: 'cascading-failure' | 'peak-load' | 'memory-leak' | 'network-partition' | 'random';
  status: 'active' | 'completed' | 'failed';
  startTime: string;
  duration?: number;
}

interface MockStats {
  totalCalls: number;
  successRate: number;
  avgResponseTime: number;
  tokensGenerated: number;
  errors: number;
}

interface SupabaseMockStats {
  queries: number;
  inserts: number;
  authCalls: number;
  totalCalls: number;
  errors: number;
}

interface GCPMockStats {
  koreanNLPCalls: number;
  mlAnalyticsCalls: number;
  totalCalls: number;
  errors: number;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  Cloud, 
  Database, 
  Zap,
  TrendingUp,
  Users,
  Server,
  Globe
} from 'lucide-react';

export default function MockScenariosPage() {
  const [activeScenarios, setActiveScenarios] = useState<Record<string, any> | null>(null);
  const [googleAIStats, setGoogleAIStats] = useState<Record<string, any> | null>(null);
  const [supabaseStats, setSupabaseStats] = useState<Record<string, any> | null>(null);
  const [gcpStats, setGCPStats] = useState<Record<string, any> | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // 통계 업데이트
  useEffect(() => {
    const updateStats = () => {
      const scenarios = getActiveScenarios();
      setActiveScenarios(scenarios);
      setGoogleAIStats(getMockStats());
      setSupabaseStats(getSupabaseMockStats());
      setGCPStats(getGCPFunctionsMockStats() as Record<string, any> | null);
    };

    updateStats();
    const interval = setInterval(updateStats, 2000); // 2초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  // 시나리오 시작
  const handleStartScenario = (scenarioType: "cascading-failure" | "peak-load" | "memory-leak" | "network-partition" | "random") => {
    startMockScenario(scenarioType);
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 1000);
  };

  // 환경 확인
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!isDevelopment) {
    return (
      <div className="container mx-auto p-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            이 페이지는 개발 환경에서만 사용할 수 있습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold mb-2">🎭 Mock 시나리오 테스트</h1>
        <p className="text-muted-foreground">
          실제 운영 환경에서 발생 가능한 다양한 시나리오를 테스트합니다.
        </p>
      </div>

      {/* 시나리오 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            서버 모니터링 시나리오
          </CardTitle>
          <CardDescription>
            복잡한 서버 상황을 시뮬레이션합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            onClick={() => handleStartScenario('cascading-failure')}
            disabled={isRunning}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <span>캐스케이딩 장애</span>
            <span className="text-xs text-muted-foreground">연쇄 장애 발생</span>
          </Button>

          <Button
            onClick={() => handleStartScenario('peak-load')}
            disabled={isRunning}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <TrendingUp className="h-8 w-8 text-orange-500" />
            <span>피크 부하</span>
            <span className="text-xs text-muted-foreground">트래픽 급증</span>
          </Button>

          <Button
            onClick={() => handleStartScenario('memory-leak')}
            disabled={isRunning}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <Database className="h-8 w-8 text-purple-500" />
            <span>메모리 누수</span>
            <span className="text-xs text-muted-foreground">점진적 성능 저하</span>
          </Button>

          <Button
            onClick={() => handleStartScenario('network-partition')}
            disabled={isRunning}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <Globe className="h-8 w-8 text-blue-500" />
            <span>네트워크 분할</span>
            <span className="text-xs text-muted-foreground">통신 장애</span>
          </Button>
        </CardContent>
      </Card>

      {/* 활성 시나리오 */}
      {activeScenarios && Object.keys(activeScenarios).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              활성 시나리오 ({Object.keys(activeScenarios).length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(activeScenarios).map(([key, scenario]) => (
                <div key={key} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{scenario.name || key}</h3>
                    <Badge variant="secondary">{scenario.status || 'active'}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    타입: {key}
                  </p>
                  {scenario.currentState && (
                    <div className="space-y-2">
                      <div className="text-sm">
                        현재 상태: {JSON.stringify(scenario.currentState.phase || scenario.currentState)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mock 통계 */}
      <Tabs defaultValue="googleai" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="googleai">Google AI</TabsTrigger>
          <TabsTrigger value="supabase">Supabase</TabsTrigger>
          <TabsTrigger value="gcp">GCP Functions</TabsTrigger>
        </TabsList>

        <TabsContent value="googleai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Google AI Mock 통계
              </CardTitle>
            </CardHeader>
            <CardContent>
              {googleAIStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{googleAIStats.totalCalls || 0}</div>
                    <div className="text-sm text-muted-foreground">총 호출</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{googleAIStats.tokensGenerated || 0}</div>
                    <div className="text-sm text-muted-foreground">생성 토큰</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{googleAIStats.successRate || 0}%</div>
                    <div className="text-sm text-muted-foreground">성공률</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{googleAIStats.avgResponseTime || 0}ms</div>
                    <div className="text-sm text-muted-foreground">평균 응답 시간</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">통계 없음</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supabase">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Supabase Mock 통계
              </CardTitle>
            </CardHeader>
            <CardContent>
              {supabaseStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{supabaseStats.queries || 0}</div>
                    <div className="text-sm text-muted-foreground">쿼리</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{supabaseStats.inserts || 0}</div>
                    <div className="text-sm text-muted-foreground">삽입</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{supabaseStats.authCalls || 0}</div>
                    <div className="text-sm text-muted-foreground">인증</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{supabaseStats.totalCalls || 0}</div>
                    <div className="text-sm text-muted-foreground">총 호출</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">통계 없음</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gcp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                GCP Functions Mock 통계
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gcpStats ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{gcpStats.koreanNLPCalls || 0}</div>
                    <div className="text-sm text-muted-foreground">Korean NLP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{gcpStats.mlAnalyticsCalls || 0}</div>
                    <div className="text-sm text-muted-foreground">ML Analytics</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{gcpStats.totalCalls || 0}</div>
                    <div className="text-sm text-muted-foreground">총 호출</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">통계 없음</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 사용 가이드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            사용 가이드
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">시나리오 실행 방법</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>원하는 시나리오 버튼을 클릭합니다.</li>
              <li>시나리오가 시작되면 서버 상태가 자동으로 변경됩니다.</li>
              <li>활성 시나리오 섹션에서 실시간 상태를 확인할 수 있습니다.</li>
              <li>Mock 통계 탭에서 API 호출 현황을 모니터링합니다.</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold mb-2">주의사항</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>이 페이지는 개발 환경에서만 작동합니다.</li>
              <li>시나리오는 Mock 데이터를 사용하므로 실제 API는 호출되지 않습니다.</li>
              <li>시나리오 실행 중에는 다른 시나리오를 시작할 수 없습니다.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}