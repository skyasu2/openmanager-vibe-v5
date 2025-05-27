'use client';

/**
 * Python Analysis Engine Admin Dashboard
 * 
 * 🐍 Python 분석 엔진 관리자 대시보드
 * - 엔진 상태 모니터링
 * - 실시간 분석 실행
 * - 성능 메트릭 시각화
 * - 분석 결과 히스토리
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Progress } from '@/components/ui/progress';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  BarChart3, 
  Zap,
  RefreshCw,
  Play,
  Settings,
  Database,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface PythonEngineStatus {
  enabled: boolean;
  status: {
    isInitialized: boolean;
    processPool: any[];
    activeProcesses: number;
    totalTasks: number;
    successRate: number;
    averageResponseTime: number;
    cacheHitRate: number;
  };
  performance: {
    responseTime: {
      min: number;
      max: number;
      avg: number;
      p95: number;
      p99: number;
    };
    throughput: {
      requestsPerSecond: number;
      requestsPerMinute: number;
    };
    errorRate: {
      total: number;
      percentage: number;
    };
  };
  cache: {
    totalEntries: number;
    hitRate: number;
    totalSize: number;
  };
}

interface AnalysisResult {
  id: string;
  timestamp: string;
  type: string;
  success: boolean;
  processingTime: number;
  confidence?: number;
  summary?: string;
}

export default function PythonAnalysisAdminPage() {
  const [engineStatus, setEngineStatus] = useState<PythonEngineStatus | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 엔진 상태 조회
  const fetchEngineStatus = async () => {
    try {
      const response = await fetch('/api/ai-agent/python-analysis');
      const data = await response.json();
      
      if (data.success) {
        setEngineStatus(data.data.python);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('엔진 상태 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 테스트 분석 실행
  const runTestAnalysis = async () => {
    setIsRunningAnalysis(true);
    
    try {
      // 더미 서버 데이터로 테스트
      const testServerData = {
        metrics: {
          cpu: {
            current: 65,
            history: Array.from({ length: 20 }, (_, i) => ({
              timestamp: new Date(Date.now() - (19 - i) * 60000).toISOString(),
              value: 50 + Math.random() * 30
            }))
          },
          memory: {
            current: 78,
            history: Array.from({ length: 20 }, (_, i) => ({
              timestamp: new Date(Date.now() - (19 - i) * 60000).toISOString(),
              value: 60 + Math.random() * 25
            }))
          },
          disk: {
            current: 45,
            history: Array.from({ length: 20 }, (_, i) => ({
              timestamp: new Date(Date.now() - (19 - i) * 60000).toISOString(),
              value: 30 + Math.random() * 30
            }))
          }
        }
      };

      const response = await fetch('/api/ai-agent/python-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          serverData: testServerData
        })
      });

      const result = await response.json();
      
      // 분석 결과를 히스토리에 추가
      const newResult: AnalysisResult = {
        id: `test_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'integrated_analysis',
        success: result.success,
        processingTime: result.metadata.processingTime,
        confidence: result.data?.analysis?.summary?.confidence_score,
        summary: result.success ? 
          `${result.data.analysis.summary.successful_analyses.length}개 분석 성공` :
          result.error
      };

      setAnalysisHistory(prev => [newResult, ...prev.slice(0, 9)]);
      
    } catch (error) {
      console.error('테스트 분석 실패:', error);
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  useEffect(() => {
    fetchEngineStatus();
    
    // 30초마다 상태 업데이트
    const interval = setInterval(fetchEngineStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Python 분석 엔진 상태 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            Python 분석 엔진 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            AI 기반 서버 메트릭 분석 및 예측 시스템
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchEngineStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          
          <Button 
            onClick={runTestAnalysis}
            disabled={isRunningAnalysis || !engineStatus?.enabled}
          >
            <Play className={`h-4 w-4 mr-2 ${isRunningAnalysis ? 'animate-spin' : ''}`} />
            테스트 분석
          </Button>
        </div>
      </div>

      {/* 엔진 상태 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">엔진 상태</p>
                <p className="text-2xl font-bold">
                  {engineStatus?.enabled ? '활성' : '비활성'}
                </p>
              </div>
              {engineStatus?.enabled ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">활성 프로세스</p>
                <p className="text-2xl font-bold">
                  {engineStatus?.status?.activeProcesses || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">성공률</p>
                <p className="text-2xl font-bold">
                  {engineStatus?.status?.successRate?.toFixed(1) || 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">평균 응답시간</p>
                <p className="text-2xl font-bold">
                  {engineStatus?.status?.averageResponseTime?.toFixed(0) || 0}ms
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 정보 탭 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="performance">성능</TabsTrigger>
          <TabsTrigger value="processes">프로세스</TabsTrigger>
          <TabsTrigger value="history">분석 히스토리</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 엔진 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  엔진 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>초기화 상태:</span>
                  <Badge variant={engineStatus?.status?.isInitialized ? "default" : "destructive"}>
                    {engineStatus?.status?.isInitialized ? '완료' : '미완료'}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span>총 작업 수:</span>
                  <span className="font-mono">{engineStatus?.status?.totalTasks || 0}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>캐시 적중률:</span>
                  <span className="font-mono">{engineStatus?.status?.cacheHitRate?.toFixed(1) || 0}%</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>캐시 적중률</span>
                    <span>{engineStatus?.status?.cacheHitRate?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${engineStatus?.status?.cacheHitRate || 0}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 분석 기능 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  지원 분석 기능
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">시계열 예측</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">이상 탐지</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">분류 분석</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">클러스터링</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">상관관계 분석</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 상태 알림 */}
          {!engineStatus?.enabled && (
            <div className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <p className="text-yellow-800">
                  Python 분석 엔진이 비활성화되어 있습니다. 시스템 관리자에게 문의하세요.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* 성능 탭 */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>응답 시간 분석</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>최소:</span>
                    <span className="font-mono">{engineStatus?.performance?.responseTime?.min || 0}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>평균:</span>
                    <span className="font-mono">{engineStatus?.performance?.responseTime?.avg?.toFixed(0) || 0}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>최대:</span>
                    <span className="font-mono">{engineStatus?.performance?.responseTime?.max || 0}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>P95:</span>
                    <span className="font-mono">{engineStatus?.performance?.responseTime?.p95?.toFixed(0) || 0}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>P99:</span>
                    <span className="font-mono">{engineStatus?.performance?.responseTime?.p99?.toFixed(0) || 0}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>처리량 및 오류율</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>초당 요청:</span>
                    <span className="font-mono">{engineStatus?.performance?.throughput?.requestsPerSecond?.toFixed(2) || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>분당 요청:</span>
                    <span className="font-mono">{engineStatus?.performance?.throughput?.requestsPerMinute?.toFixed(0) || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>총 오류:</span>
                    <span className="font-mono">{engineStatus?.performance?.errorRate?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>오류율:</span>
                    <span className="font-mono">{engineStatus?.performance?.errorRate?.percentage?.toFixed(2) || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 프로세스 탭 */}
        <TabsContent value="processes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Python 프로세스 풀</CardTitle>
              <CardDescription>
                현재 실행 중인 Python 분석 프로세스들의 상태
              </CardDescription>
            </CardHeader>
            <CardContent>
              {engineStatus?.status?.processPool && engineStatus.status.processPool.length > 0 ? (
                <div className="space-y-3">
                  {engineStatus.status.processPool.map((process, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={process.status === 'idle' ? 'default' : 'secondary'}>
                          프로세스 {process.pid}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          상태: {process.status}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        작업 수: {process.taskCount}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>실행 중인 프로세스가 없습니다.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 분석 히스토리 탭 */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>최근 분석 결과</CardTitle>
              <CardDescription>
                최근 실행된 Python 분석 작업들의 결과
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysisHistory.length > 0 ? (
                <div className="space-y-3">
                  {analysisHistory.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{result.type}</p>
                          <p className="text-sm text-muted-foreground">{result.summary}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{new Date(result.timestamp).toLocaleTimeString()}</p>
                        <p>{result.processingTime}ms</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>분석 히스토리가 없습니다.</p>
                  <p className="text-sm">테스트 분석을 실행해보세요.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 마지막 업데이트 시간 */}
      <div className="text-center text-sm text-muted-foreground">
        마지막 업데이트: {lastUpdate.toLocaleString()}
      </div>
    </div>
  );
} 