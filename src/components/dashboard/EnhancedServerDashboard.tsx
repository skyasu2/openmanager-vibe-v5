'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, XCircle, Activity, Server } from 'lucide-react';
import { ServerMetadata } from '@/types/ai-agent-input-schema';

interface EnhancedServerDashboardProps {
  servers?: ServerMetadata[];
  className?: string;
}

interface RealtimeMetrics {
  [serverId: string]: {
    cpu: number;
    memory: number;
    status: 'healthy' | 'warning' | 'critical';
    timestamp: string;
  };
}

interface AnalysisResult {
  status: string;
  anomalies: Array<{
    serverId: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  predictions: Array<{
    serverId: string;
    metric: string;
    currentValue: number;
    predictedValue: number;
    timeHorizon: string;
    confidence: number;
  }>;
  insights: string[];
}

export function EnhancedServerDashboard({ servers = [], className }: EnhancedServerDashboardProps) {
  const [realtimeData, setRealtimeData] = useState<RealtimeMetrics>({});
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  // 실시간 데이터 폴링
  useEffect(() => {
    const fetchRealtimeData = async () => {
      try {
        const response = await fetch('/api/metrics/hybrid-bridge');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.status === 'success') {
            setAnalysisResult(data.data);
            
            // 실시간 메트릭 시뮬레이션 (실제로는 Redis에서 가져옴)
            const mockRealtime: RealtimeMetrics = {};
            servers.forEach(server => {
              mockRealtime[server.id] = {
                cpu: Math.random() * 100,
                memory: Math.random() * 100,
                status: Math.random() > 0.8 ? 'warning' : 'healthy',
                timestamp: new Date().toISOString()
              };
            });
            setRealtimeData(mockRealtime);
          }
        }
      } catch (error) {
        console.error('실시간 데이터 조회 오류:', error);
      }
    };

    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 5000); // 5초마다 폴링

    return () => clearInterval(interval);
  }, [servers]);

  // 데이터 생성 시작/중지
  const toggleDataGeneration = async () => {
    try {
      setIsGenerating(!isGenerating);
      // 실제 구현에서는 데이터 생성기 API 호출
      const response = await fetch('/api/data-generator/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isGenerating ? 'stop' : 'start' })
      });
    } catch (error) {
      console.error('데이터 생성 제어 오류:', error);
    }
  };

  // 서버 상태별 카운트
  const getServerStatusCounts = () => {
    const counts = { healthy: 0, warning: 0, critical: 0 };
    Object.values(realtimeData).forEach(data => {
      if (data.status === 'healthy') counts.healthy++;
      else if (data.status === 'warning') counts.warning++;
      else counts.critical++;
    });
    return counts;
  };

  const statusCounts = getServerStatusCounts();
  const totalServers = servers.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">OpenManager 7.0 Dashboard</h2>
          <p className="text-muted-foreground">
            고급 AI 기반 서버 모니터링 및 분석
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={toggleDataGeneration}
            variant={isGenerating ? "destructive" : "default"}
          >
            {isGenerating ? '데이터 생성 중지' : '데이터 생성 시작'}
          </Button>
        </div>
      </div>

      {/* 상태 개요 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 서버</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServers}</div>
            <p className="text-xs text-muted-foreground">
              활성 서버 {Object.keys(realtimeData).length}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">정상</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.healthy}</div>
            <p className="text-xs text-muted-foreground">
              {totalServers > 0 ? ((statusCounts.healthy / totalServers) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">경고</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.warning}</div>
            <p className="text-xs text-muted-foreground">
              {totalServers > 0 ? ((statusCounts.warning / totalServers) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">위험</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.critical}</div>
            <p className="text-xs text-muted-foreground">
              {totalServers > 0 ? ((statusCounts.critical / totalServers) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 컨테이너 */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="servers">서버 목록</TabsTrigger>
          <TabsTrigger value="anomalies">이상 현상</TabsTrigger>
          <TabsTrigger value="predictions">예측</TabsTrigger>
          <TabsTrigger value="insights">인사이트</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>AI 분석 상태</CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResult ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={analysisResult.status === 'success' ? 'default' : 'destructive'}>
                        {analysisResult.status === 'success' ? '정상' : '오류'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>이상 현상: {analysisResult.anomalies.length}개</div>
                      <div>예측: {analysisResult.predictions.length}개</div>
                      <div>인사이트: {analysisResult.insights.length}개</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">분석 데이터를 로드 중...</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>평균 리소스 사용률</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(realtimeData).length > 0 ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU</span>
                        <span>
                          {(Object.values(realtimeData).reduce((sum, data) => sum + data.cpu, 0) / Object.values(realtimeData).length).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Object.values(realtimeData).reduce((sum, data) => sum + data.cpu, 0) / Object.values(realtimeData).length}%`
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>메모리</span>
                        <span>
                          {(Object.values(realtimeData).reduce((sum, data) => sum + data.memory, 0) / Object.values(realtimeData).length).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${Object.values(realtimeData).reduce((sum, data) => sum + data.memory, 0) / Object.values(realtimeData).length}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">데이터 로드 중...</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 서버 목록 탭 */}
        <TabsContent value="servers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servers.map((server) => {
              const metrics = realtimeData[server.id];
              return (
                <Card key={server.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{server.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{server.id}</p>
                      </div>
                      <Badge
                        variant={
                          metrics?.status === 'healthy' ? 'default' :
                          metrics?.status === 'warning' ? 'secondary' : 'destructive'
                        }
                      >
                        {metrics?.status || 'offline'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>타입:</span>
                        <span>{server.serverType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>용도:</span>
                        <span>{server.usageProfile.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>위치:</span>
                        <span>{server.location.region}</span>
                      </div>
                      {metrics && (
                        <>
                          <div className="flex justify-between">
                            <span>CPU:</span>
                            <span>{metrics.cpu.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>메모리:</span>
                            <span>{metrics.memory.toFixed(1)}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* 이상 현상 탭 */}
        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>감지된 이상 현상</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisResult?.anomalies && analysisResult.anomalies.length > 0 ? (
                <div className="space-y-3">
                  {analysisResult.anomalies.map((anomaly, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">{anomaly.type}</div>
                        <Badge
                          variant={
                            anomaly.severity === 'critical' ? 'destructive' :
                            anomaly.severity === 'high' ? 'secondary' : 'outline'
                          }
                        >
                          {anomaly.severity}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        서버: {anomaly.serverId}
                      </div>
                      <div className="text-sm">{anomaly.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  현재 감지된 이상 현상이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 예측 탭 */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI 예측 분석</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisResult?.predictions && analysisResult.predictions.length > 0 ? (
                <div className="space-y-3">
                  {analysisResult.predictions.map((prediction, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">{prediction.metric.toUpperCase()} 예측</div>
                        <Badge variant="outline">{prediction.timeHorizon}</Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>서버: {prediction.serverId}</div>
                        <div>현재값: {prediction.currentValue.toFixed(1)}%</div>
                        <div>예측값: {prediction.predictedValue.toFixed(1)}%</div>
                        <div>신뢰도: {(prediction.confidence * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  예측 데이터가 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 인사이트 탭 */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI 인사이트</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisResult?.insights && analysisResult.insights.length > 0 ? (
                <div className="space-y-3">
                  {analysisResult.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded">
                      <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="text-sm">{insight}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  인사이트 데이터가 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 