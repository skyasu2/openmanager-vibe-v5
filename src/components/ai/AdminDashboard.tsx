'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Brain, 
  Download, 
  Eye, 
  Filter,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  Zap,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Database,
  FileText,
  Lock
} from 'lucide-react';

interface AdminStats {
  totalInteractions: number;
  totalErrors: number;
  uptime: number;
  recent24h: {
    interactions: number;
    errors: number;
    averageResponseTime: number;
    successRate: number;
  };
  modeStats: {
    basic: { count: number; avgResponseTime: number; successRate: number };
    enterprise: { count: number; avgResponseTime: number; successRate: number };
  };
  errorStats: {
    byType: Record<string, number>;
    byHour: number[];
    topErrors: Array<{ message: string; count: number }>;
  };
  performanceStats: {
    averageResponseTime: number;
    p95ResponseTime: number;
    cacheHitRate: number;
    memoryUsage: number;
  };
}

interface InteractionLog {
  id: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  query: string;
  mode: 'basic' | 'enterprise';
  powerMode: 'active' | 'idle' | 'sleep';
  success: boolean;
  responseTime: number;
  error?: string;
  intent: {
    name: string;
    confidence: number;
  };
}

interface ErrorLog {
  id: string;
  timestamp: number;
  sessionId: string;
  errorType: string;
  errorMessage: string;
  recovered: boolean;
  query?: string;
  mode?: 'basic' | 'enterprise';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [interactionLogs, setInteractionLogs] = useState<InteractionLog[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 30000); // 30초마다 새로고침
    return () => clearInterval(interval);
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // API 호출 시뮬레이션
      const [statsResponse, logsResponse, errorsResponse] = await Promise.all([
        fetch('/api/ai-agent/admin/stats'),
        fetch('/api/ai-agent/admin/logs?limit=50'),
        fetch('/api/ai-agent/admin/errors?limit=50')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setInteractionLogs(logsData.logs || []);
      }

      if (errorsResponse.ok) {
        const errorsData = await errorsResponse.json();
        setErrorLogs(errorsData.logs || []);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async (type: 'interactions' | 'errors', format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/ai-agent/admin/export?type=${type}&format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-agent-${type}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}일 ${hours % 24}시간`;
    if (hours > 0) return `${hours}시간 ${minutes % 60}분`;
    return `${minutes}분`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">관리자 데이터 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI 에이전트 관리자</h1>
          <p className="text-gray-600 mt-1">AI 에이전트 성능 및 로그 모니터링</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={loadAdminData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Button onClick={() => exportLogs('interactions', 'csv')} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            로그 내보내기
          </Button>
        </div>
      </div>

      {/* 전체 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 상호작용</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInteractions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                24시간: {stats.recent24h.interactions.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">성공률</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recent24h.successRate}%</div>
              <p className="text-xs text-muted-foreground">
                최근 24시간 기준
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 응답시간</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.performanceStats.averageResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">
                P95: {stats.performanceStats.p95ResponseTime}ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">시스템 가동시간</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUptime(stats.uptime)}</div>
              <p className="text-xs text-muted-foreground">
                메모리: {stats.performanceStats.memoryUsage.toFixed(1)}MB
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 탭 컨텐츠 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="interactions">상호작용 로그</TabsTrigger>
          <TabsTrigger value="errors">에러 로그</TabsTrigger>
          <TabsTrigger value="performance">성능 분석</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 모드별 통계 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="w-5 h-5 mr-2" />
                    모드별 사용 통계
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>베이직 모드</span>
                    <div className="text-right">
                      <div className="font-semibold">{stats.modeStats.basic.count.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">
                        {stats.modeStats.basic.avgResponseTime}ms 평균
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>엔터프라이즈 모드</span>
                    <div className="text-right">
                      <div className="font-semibold">{stats.modeStats.enterprise.count.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">
                        {stats.modeStats.enterprise.avgResponseTime}ms 평균
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 에러 통계 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    에러 통계
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.errorStats.byType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="capitalize">{type}</span>
                        <Badge variant="destructive">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                최근 상호작용 로그
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {interactionLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium truncate">{log.query}</div>
                        <div className="text-sm text-gray-500">
                          세션: {log.sessionId.slice(-8)} | 
                          의도: {log.intent.name} ({(log.intent.confidence * 100).toFixed(1)}%)
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={log.mode === 'enterprise' ? 'default' : 'secondary'}>
                          {log.mode}
                        </Badge>
                        <Badge variant={log.success ? 'default' : 'destructive'}>
                          {log.success ? '성공' : '실패'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatTimestamp(log.timestamp)}</span>
                      <span>{log.responseTime}ms</span>
                    </div>
                    {log.error && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {log.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                에러 로그
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {errorLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-red-600">{log.errorMessage}</div>
                        <div className="text-sm text-gray-500">
                          타입: {log.errorType} | 세션: {log.sessionId.slice(-8)}
                        </div>
                      </div>
                      <Badge variant={log.recovered ? 'default' : 'destructive'}>
                        {log.recovered ? '복구됨' : '미복구'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimestamp(log.timestamp)}
                    </div>
                    {log.query && (
                      <div className="text-sm bg-gray-50 p-2 rounded">
                        질문: {log.query}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    성능 메트릭
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>평균 응답시간</span>
                    <span className="font-semibold">{stats.performanceStats.averageResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>P95 응답시간</span>
                    <span className="font-semibold">{stats.performanceStats.p95ResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>캐시 적중률</span>
                    <span className="font-semibold">{stats.performanceStats.cacheHitRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>메모리 사용량</span>
                    <span className="font-semibold">{stats.performanceStats.memoryUsage.toFixed(1)}MB</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>상위 에러</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.errorStats.topErrors.slice(0, 5).map((error, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm truncate flex-1 mr-2">{error.message}</span>
                        <Badge variant="outline">{error.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 