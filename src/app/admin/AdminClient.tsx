/**
 * 🛠️ 관리자 대시보드 v6.0 - 완전 재설계
 *
 * 핵심 기능:
 * - AI 대화 히스토리 뷰어
 * - 시스템 로그 관리
 * - 무료 티어 최적화 도구
 * - 관리자 전용 모니터링
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import UnifiedProfileHeader from '@/components/shared/UnifiedProfileHeader';
import { useRouter } from 'next/navigation';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { isGuestFullAccessEnabled } from '@/config/guestMode';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Shield,
  MessageSquare,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  Clock,
  User,
  Settings,
  Database,
  Trash2,
  Download,
  Eye,
} from 'lucide-react';

// 대화 히스토리 타입
interface ConversationEntry {
  id: string;
  userId: string;
  query: string;
  response: string;
  aiMode: 'LOCAL' | 'GOOGLE_AI';
  timestamp: Date;
  responseTime: number;
  status: 'success' | 'error';
}

// 시스템 로그 타입
interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// 관리자 통계 타입
interface AdminStats {
  totalQueries: number;
  activeUsers: number;
  errorRate: number;
  avgResponseTime: number;
  lastUpdated: Date;
}

export default function AdminClient() {
  const router = useRouter();
  const permissions = useUserPermissions();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('conversations');

  // 상태 관리
  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [logLevelFilter, setLogLevelFilter] = useState('all');

  // 대화 히스토리 로드
  const loadConversations = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch('/api/admin/conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else {
        // Fallback: Mock 데이터
        const mockConversations: ConversationEntry[] = [
          {
            id: '1',
            userId: 'guest_1234',
            query: '서버 상태가 어떻게 되나요?',
            response: '현재 모든 서버가 정상 작동 중입니다...',
            aiMode: 'LOCAL',
            timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10분 전
            responseTime: 850,
            status: 'success',
          },
          {
            id: '2',
            userId: 'guest_5678',
            query: 'CPU 사용률이 높은 이유가 뭔가요?',
            response: 'CPU 사용률 증가의 주요 원인을 분석해보겠습니다...',
            aiMode: 'GOOGLE_AI',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
            responseTime: 1200,
            status: 'success',
          },
          {
            id: '3',
            userId: 'github_user123',
            query: '에러가 발생했는데 해결 방법이 있나요?',
            response: '오류가 발생했습니다. 관리자에게 문의하세요.',
            aiMode: 'LOCAL',
            timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1시간 전
            responseTime: 500,
            status: 'error',
          },
        ];
        setConversations(mockConversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // 시스템 로그 로드
  const loadSystemLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/logs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSystemLogs(data.logs || []);
      } else {
        // Fallback: Mock 데이터
        const mockLogs: SystemLog[] = [
          {
            id: '1',
            level: 'info',
            message: '사용자 로그인 성공',
            source: 'auth',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            metadata: { userId: 'guest_1234' },
          },
          {
            id: '2',
            level: 'warn',
            message: 'AI API 응답 시간 지연',
            source: 'ai-engine',
            timestamp: new Date(Date.now() - 1000 * 60 * 15),
            metadata: { responseTime: 3500, threshold: 3000 },
          },
          {
            id: '3',
            level: 'error',
            message: 'Database 연결 재시도',
            source: 'database',
            timestamp: new Date(Date.now() - 1000 * 60 * 45),
            metadata: { retryCount: 3, maxRetries: 5 },
          },
        ];
        setSystemLogs(mockLogs);
      }
    } catch (error) {
      console.error('Failed to load system logs:', error);
    }
  }, []);

  // 관리자 통계 로드
  const loadAdminStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        const stats = (data?.stats || data) as AdminStats & {
          lastUpdated?: Date | string;
        };
        setAdminStats({
          totalQueries: stats.totalQueries ?? 0,
          activeUsers: stats.activeUsers ?? 0,
          errorRate: stats.errorRate ?? 0,
          avgResponseTime: stats.avgResponseTime ?? 0,
          lastUpdated: stats.lastUpdated
            ? new Date(stats.lastUpdated)
            : new Date(),
        });
      } else {
        // Fallback: Mock 데이터
        setAdminStats({
          totalQueries: 247,
          activeUsers: 12,
          errorRate: 2.3,
          avgResponseTime: 890,
          lastUpdated: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    }
  }, []);

  // 초기 데이터 로드
  const loadInitialData = useCallback(async () => {
    await Promise.all([
      loadConversations(),
      loadSystemLogs(),
      loadAdminStats(),
    ]);
  }, [loadConversations, loadSystemLogs, loadAdminStats]);

  // 인증 체크
  useEffect(() => {
    // 🎛️ 환경 변수 기반 게스트 모드 체크
    const isGuestFullAccess = isGuestFullAccessEnabled();

    if (isGuestFullAccess) {
      // 🟢 게스트 전체 접근 모드: 즉시 허용
      console.log(
        '✅ AdminClient: 게스트 전체 접근 모드 - 즉시 허용 (NEXT_PUBLIC_GUEST_MODE=full_access)'
      );
      setIsAuthorized(true);
      void loadInitialData();
    } else {
      // 🔐 프로덕션 모드: 권한 체크
      if (permissions.canAccessAdminPage) {
        setIsAuthorized(true);
        void loadInitialData();
      } else {
        setIsAuthorized(false);
        router.push('/main');
      }
    }

    setIsLoading(false);
  }, [permissions.canAccessAdminPage, router, loadInitialData]);

  // 새로고침
  const handleRefresh = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // 로그 레벨 색상
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      case 'info':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  // 로그 레벨 아이콘
  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warn':
        return <Activity className="h-4 w-4" />;
      case 'info':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // 필터된 대화 목록
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.response.toLowerCase().includes(searchQuery.toLowerCase());

    const now = new Date();
    const convDate = new Date(conv.timestamp);
    let matchesDate = true;

    if (dateFilter === 'today') {
      matchesDate = convDate.toDateString() === now.toDateString();
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = convDate >= weekAgo;
    }

    return matchesSearch && matchesDate;
  });

  // 필터된 로그 목록
  const filteredLogs = systemLogs.filter((log) => {
    const matchesSearch = log.message
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesLevel =
      logLevelFilter === 'all' || log.level === logLevelFilter;

    return matchesSearch && matchesLevel;
  });

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-400" />
          <p className="mt-2 text-gray-400">관리자 대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 권한 없음
  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <Card className="w-96 border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <Shield className="h-5 w-5" />
              접근 거부됨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-400">
              관리자 대시보드에 접근할 권한이 없습니다.
            </p>
            <Button onClick={() => router.push('/main')} className="w-full">
              메인으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <UnifiedProfileHeader />

      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
                <Settings className="h-8 w-8 text-blue-400" />
                관리자 대시보드
              </h1>
              <p className="mt-2 text-gray-400">
                AI 대화 히스토리, 시스템 로그 및 관리 도구
              </p>
            </div>
            <div className="flex items-center gap-4">
              {adminStats && (
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="outline" className="text-green-400">
                    활성 사용자: {adminStats.activeUsers}
                  </Badge>
                  <Badge variant="outline" className="text-blue-400">
                    총 쿼리: {adminStats.totalQueries}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      adminStats.errorRate > 5
                        ? 'text-red-400'
                        : 'text-green-400'
                    }
                  >
                    오류율: {adminStats.errorRate}%
                  </Badge>
                </div>
              )}
              <Button
                onClick={handleRefresh}
                size="sm"
                disabled={isLoadingData}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`}
                />
                새로고침
              </Button>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative min-w-80 flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="대화 내용이나 로그 메시지 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-gray-700 bg-gray-900 pl-10 text-white"
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white"
          >
            <option value="today">오늘</option>
            <option value="week">지난 7일</option>
            <option value="all">전체</option>
          </select>
        </div>

        {/* 메인 탭 */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="border-gray-700 bg-gray-900">
            <TabsTrigger
              value="conversations"
              className="data-[state=active]:bg-blue-600"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              AI 대화 히스토리
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="data-[state=active]:bg-blue-600"
            >
              <Activity className="mr-2 h-4 w-4" />
              시스템 로그
            </TabsTrigger>
            <TabsTrigger
              value="management"
              className="data-[state=active]:bg-blue-600"
            >
              <Database className="mr-2 h-4 w-4" />
              데이터 관리
            </TabsTrigger>
          </TabsList>

          {/* AI 대화 히스토리 탭 */}
          <TabsContent value="conversations" className="space-y-4">
            <Card className="border-gray-700 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  AI 대화 히스토리 ({filteredConversations.length}개)
                </CardTitle>
                <CardDescription>
                  사용자와 AI 간의 모든 대화를 실시간으로 모니터링합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 space-y-4 overflow-y-auto">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="rounded-lg border border-gray-700 bg-gray-800 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-400">
                              {conv.userId}
                            </span>
                            <Badge
                              variant={
                                conv.aiMode === 'GOOGLE_AI'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="text-xs"
                            >
                              {conv.aiMode}
                            </Badge>
                            <Badge
                              variant={
                                conv.status === 'success'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                              className="text-xs"
                            >
                              {conv.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            {new Date(conv.timestamp).toLocaleString('ko-KR')}
                            <span>({conv.responseTime}ms)</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-blue-400">
                              질문:
                            </span>
                            <p className="mt-1 text-sm text-gray-200">
                              {conv.query}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-green-400">
                              답변:
                            </span>
                            <p className="mt-1 text-sm text-gray-300">
                              {conv.response.length > 200
                                ? `${conv.response.substring(0, 200)}...`
                                : conv.response}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-400">
                      검색 조건에 맞는 대화가 없습니다.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 시스템 로그 탭 */}
          <TabsContent value="logs" className="space-y-4">
            <div className="mb-4 flex items-center gap-4">
              <select
                value={logLevelFilter}
                onChange={(e) => setLogLevelFilter(e.target.value)}
                className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white"
              >
                <option value="all">모든 레벨</option>
                <option value="info">정보</option>
                <option value="warn">경고</option>
                <option value="error">오류</option>
              </select>
            </div>

            <Card className="border-gray-700 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-400" />
                  시스템 로그 ({filteredLogs.length}개)
                </CardTitle>
                <CardDescription>
                  시스템 전체의 로그를 실시간으로 모니터링합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-lg border border-gray-700 bg-gray-800 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={getLogLevelColor(log.level)}>
                              {getLogLevelIcon(log.level)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.source}
                            </Badge>
                            <span
                              className={`text-sm font-medium ${getLogLevelColor(log.level)}`}
                            >
                              {log.level.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            {new Date(log.timestamp).toLocaleString('ko-KR')}
                          </div>
                        </div>
                        <p className="mb-2 text-sm text-gray-200">
                          {log.message}
                        </p>
                        {log.metadata && (
                          <details className="text-xs text-gray-400">
                            <summary className="cursor-pointer">
                              메타데이터
                            </summary>
                            <pre className="mt-1 overflow-x-auto rounded bg-gray-700 p-2 text-xs">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-400">
                      검색 조건에 맞는 로그가 없습니다.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 데이터 관리 탭 */}
          <TabsContent value="management" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card className="border-gray-700 bg-gray-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-blue-400" />
                    데이터 내보내기
                  </CardTitle>
                  <CardDescription>
                    대화 히스토리와 로그를 내보냅니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    대화 히스토리 내보내기 (CSV)
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    시스템 로그 내보내기 (JSON)
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-gray-700 bg-gray-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-red-400" />
                    데이터 정리
                  </CardTitle>
                  <CardDescription>오래된 데이터를 정리합니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    30일 이전 대화 삭제
                  </Button>
                  <Button className="w-full" variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    30일 이전 로그 삭제
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-gray-700 bg-gray-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-green-400" />
                    실시간 모니터링
                  </CardTitle>
                  <CardDescription>
                    시스템 상태를 실시간으로 모니터링합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {adminStats && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>평균 응답시간:</span>
                        <span className="text-blue-400">
                          {adminStats.avgResponseTime}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>총 쿼리 수:</span>
                        <span className="text-green-400">
                          {adminStats.totalQueries}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>오류율:</span>
                        <span
                          className={
                            adminStats.errorRate > 5
                              ? 'text-red-400'
                              : 'text-green-400'
                          }
                        >
                          {adminStats.errorRate}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>마지막 업데이트:</span>
                        <span className="text-gray-400">
                          {adminStats.lastUpdated.toLocaleTimeString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-gray-700 bg-gray-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-yellow-400" />
                    시스템 설정
                  </CardTitle>
                  <CardDescription>
                    관리자 도구 설정을 관리합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" variant="outline">
                    로그 보관 기간 설정
                  </Button>
                  <Button className="w-full" variant="outline">
                    알림 설정 관리
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Alert className="border-blue-800 bg-blue-900/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                모든 데이터는 무료 티어 범위 내에서 관리됩니다. 대화 히스토리는
                Supabase에, 시스템 로그는 GCP Functions에 저장됩니다.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
