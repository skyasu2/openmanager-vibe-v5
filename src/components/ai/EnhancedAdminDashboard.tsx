'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import ThinkingDisplay from './ThinkingDisplay';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  RefreshCw,
  Download,
  Brain,
  Shield,
  CheckCircle,
  Clock,
  Star,
  Database,
  Lock
} from 'lucide-react';

interface AdminDashboardData {
  overview: {
    totalInteractions: number;
    totalErrors: number;
    last24hInteractions: number;
    last7dInteractions: number;
    successRate: number;
    avgUserRating: number;
  };
  recentInteractions: any[];
  recentErrors: any[];
  bestPatterns: any[];
  worstPatterns: any[];
  trainingData: any[];
  metrics: any[];
}

interface AuthStats {
  activeSessions: number;
  adminSessions: number;
  demoSessions: number;
  last24h: {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    successRate: number;
  };
  blockedIPs: any[];
  recentFailures: any[];
}

export default function EnhancedAdminDashboard() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [authStats, setAuthStats] = useState<AuthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [sessionId, setSessionId] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [currentThinkingSession] = useState(null);
  
  // 필터 상태
  const [filters] = useState({
    dateRange: '24h',
    category: 'all',
    success: 'all',
    severity: 'all'
  });

  // 복사 방지 기능
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [copyProtectionEnabled, setCopyProtectionEnabled] = useState(true);

  useEffect(() => {
    // 인증 확인
    checkAuthentication();
  }, []);

  // 데이터 로드 함수들을 먼저 정의

  // 복사 방지 기능
  useEffect(() => {
    if (!copyProtectionEnabled) return;

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleSelectStart = (e: Event) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C, Ctrl+A, Ctrl+S, F12 등 차단
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'a' || e.key === 's')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J')
      ) {
        e.preventDefault();
        showSecurityAlert();
      }
    };

    const container = dashboardRef.current;
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu);
      container.addEventListener('selectstart', handleSelectStart);
      document.addEventListener('copy', handleCopy);
      document.addEventListener('keydown', handleKeyDown);

      // CSS로 추가 보호
      container.style.userSelect = 'none';
      (container.style as any).webkitUserSelect = 'none';
      (container.style as any).msUserSelect = 'none';
      (container.style as any).mozUserSelect = 'none';

      return () => {
        container.removeEventListener('contextmenu', handleContextMenu);
        container.removeEventListener('selectstart', handleSelectStart);
        document.removeEventListener('copy', handleCopy);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [copyProtectionEnabled]);

  const checkAuthentication = () => {
    // 관리자 인증 시스템 확인
    const adminSessionId = localStorage.getItem('admin_session_id');
    const adminAuthToken = localStorage.getItem('admin_auth_token');
    const adminSessionAuth = sessionStorage.getItem('admin_authorized');
    
    if (adminSessionId && adminAuthToken && adminSessionAuth) {
      setSessionId(adminSessionId);
      setIsAuthenticated(true);
    } else {
      setError('관리자 인증이 필요합니다.');
      setLoading(false);
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      const response = await fetch(`/api/ai-agent/admin/logs?action=dashboard&sessionId=${sessionId}`);
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
        setError(null);
      } else {
        setError(result.error || '데이터 로드 실패');
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const loadAuthStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/auth/stats?sessionId=${sessionId}`);
      if (response.ok) {
        const result = await response.json();
        setAuthStats(result.data);
      }
    } catch {
      // Auth stats load failed - silent fail
    }
  }, [sessionId]);

  // 인증 후 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
      loadAuthStats();
      
      // 5초마다 데이터 새로고침
      const interval = setInterval(() => {
        loadDashboardData();
        loadAuthStats();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, filters, loadDashboardData, loadAuthStats]);

  const handleExportData = async (type: string, format: string = 'json') => {
    try {
      const response = await fetch(
        `/api/ai-agent/admin/logs?action=export&type=${type}&format=${format}&sessionId=${sessionId}`
      );
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-agent-logs-${type}-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const result = await response.json();
        if (result.success) {
          const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ai-agent-logs-${type}-${Date.now()}.json`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      }
    } catch {
      setError('데이터 내보내기 실패');
    }
  };

  const handleAdminVerification = async (interactionId: string, isCorrect: boolean, adminNotes?: string) => {
    try {
      const response = await fetch('/api/ai-agent/admin/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin-verification',
          data: { interactionId, isCorrect, adminNotes },
          sessionId
        })
      });
      
      const result = await response.json();
      if (result.success) {
        loadDashboardData(); // 데이터 새로고침
      } else {
        setError(result.error);
      }
    } catch {
      setError('관리자 검증 실패');
    }
  };

  const handleGenerateDemoData = async () => {
    try {
      const response = await fetch('/api/ai-agent/admin/demo-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-all',
          count: 100,
          sessionId
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert('데모 데이터가 성공적으로 생성되었습니다!');
        loadDashboardData(); // 데이터 새로고침
      } else {
        setError(result.error);
      }
    } catch {
      setError('데모 데이터 생성 실패');
    }
  };

  const showSecurityAlert = () => {
    alert('🔒 보안 경고: 이 페이지의 내용은 복사가 제한되어 있습니다.');
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>관리자 대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={dashboardRef}
      className="min-h-screen bg-gray-50 p-6"
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        KhtmlUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI 에이전트 관리자 대시보드</h1>
              <p className="text-gray-600">실시간 모니터링 및 로그 분석</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {copyProtectionEnabled && (
              <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                <Lock className="w-3 h-3" />
                <span>복사 보호됨</span>
              </div>
            )}
            
            <Button
              onClick={() => setCopyProtectionEnabled(!copyProtectionEnabled)}
              variant="outline"
              size="sm"
            >
              <Lock className="w-4 h-4 mr-2" />
              보안 {copyProtectionEnabled ? 'ON' : 'OFF'}
            </Button>
            
            <Button onClick={loadDashboardData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
            
            <Button onClick={handleGenerateDemoData} variant="outline" size="sm">
              <Database className="w-4 h-4 mr-2" />
              데모 데이터 생성
            </Button>
          </div>
        </div>
      </div>

      {/* 개요 카드 */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 상호작용</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.overview.totalInteractions.toLocaleString()}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                24시간: {dashboardData.overview.last24hInteractions}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">성공률</p>
                  <p className={`text-2xl font-bold ${getSuccessRateColor(dashboardData.overview.successRate)}`}>
                    {dashboardData.overview.successRate.toFixed(1)}%
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                평균 평점: {dashboardData.overview.avgUserRating.toFixed(1)}/5
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 에러</p>
                  <p className="text-2xl font-bold text-red-600">
                    {dashboardData.overview.totalErrors}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                학습 데이터: {dashboardData.trainingData.length}개
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">활성 세션</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {authStats?.activeSessions || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                관리자: {authStats?.adminSessions || 0} | 데모: {authStats?.demoSessions || 0}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="interactions">상호작용</TabsTrigger>
          <TabsTrigger value="errors">에러</TabsTrigger>
          <TabsTrigger value="patterns">패턴</TabsTrigger>
          <TabsTrigger value="training">학습 데이터</TabsTrigger>
          <TabsTrigger value="security">보안</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-6">
          {dashboardData && (
            <>
              {/* 최근 상호작용 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>최근 상호작용</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentInteractions.slice(0, 5).map((interaction) => (
                      <div key={interaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 truncate">
                            {interaction.query}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatTimestamp(interaction.timestamp)} | {interaction.detectedMode} 모드
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {interaction.userRating && (
                            <div className="flex items-center space-x-1">
                              {getRatingStars(interaction.userRating)}
                            </div>
                          )}
                          
                          <Badge variant={interaction.success ? "default" : "destructive"}>
                            {interaction.success ? '성공' : '실패'}
                          </Badge>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowThinking(true)}
                          >
                            <Brain className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 성능 패턴 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-green-600">
                      <TrendingUp className="w-5 h-5" />
                      <span>우수 패턴</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.bestPatterns.slice(0, 5).map((pattern) => (
                        <div key={pattern.id} className="p-3 bg-green-50 rounded-lg">
                          <p className="font-medium text-gray-900 truncate">
                            {pattern.pattern}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-600">
                              성공률: {(pattern.successRate * 100).toFixed(1)}%
                            </span>
                            <span className="text-sm text-gray-600">
                              {pattern.totalQueries}회 사용
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      <span>개선 필요 패턴</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.worstPatterns.slice(0, 5).map((pattern) => (
                        <div key={pattern.id} className="p-3 bg-red-50 rounded-lg">
                          <p className="font-medium text-gray-900 truncate">
                            {pattern.pattern}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-600">
                              성공률: {(pattern.successRate * 100).toFixed(1)}%
                            </span>
                            <span className="text-sm text-gray-600">
                              {pattern.totalQueries}회 사용
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* 상호작용 탭 */}
        <TabsContent value="interactions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>상호작용 로그</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleExportData('interactions', 'csv')}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    CSV 내보내기
                  </Button>
                  <Button
                    onClick={() => handleExportData('interactions', 'json')}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    JSON 내보내기
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dashboardData && (
                <div className="space-y-4">
                  {dashboardData.recentInteractions.map((interaction) => (
                    <div key={interaction.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {interaction.query}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            응답: {interaction.response.substring(0, 100)}...
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{formatTimestamp(interaction.timestamp)}</span>
                            <span>{interaction.detectedMode} 모드</span>
                            <span>{interaction.responseTime}ms</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {interaction.userRating && (
                            <div className="flex items-center space-x-1">
                              {getRatingStars(interaction.userRating)}
                            </div>
                          )}
                          
                          <Badge variant={interaction.success ? "default" : "destructive"}>
                            {interaction.success ? '성공' : '실패'}
                          </Badge>
                          
                          {!interaction.isCorrect && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdminVerification(interaction.id, true)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 보안 탭 */}
        <TabsContent value="security" className="space-y-6">
          {authStats && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>인증 통계</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">24시간 로그인 시도</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {authStats.last24h.totalAttempts}
                      </p>
                      <p className="text-xs text-gray-500">
                        성공률: {authStats.last24h.successRate.toFixed(1)}%
                      </p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">성공한 로그인</p>
                      <p className="text-2xl font-bold text-green-600">
                        {authStats.last24h.successfulAttempts}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">실패한 로그인</p>
                      <p className="text-2xl font-bold text-red-600">
                        {authStats.last24h.failedAttempts}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {authStats.blockedIPs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      <span>차단된 IP</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {authStats.blockedIPs.map((blocked, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <span className="font-mono text-sm">{blocked.ip}</span>
                          <span className="text-sm text-gray-600">
                            {Math.ceil(blocked.remainingTime / 60000)}분 남음
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* 다른 탭들... */}
        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>에러 로그</CardTitle>
            </CardHeader>
            <CardContent>
              <p>에러 로그 내용이 여기에 표시됩니다.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>학습 패턴</CardTitle>
            </CardHeader>
            <CardContent>
              <p>학습 패턴 분석이 여기에 표시됩니다.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training">
          <Card>
            <CardHeader>
              <CardTitle>학습 데이터</CardTitle>
            </CardHeader>
            <CardContent>
              <p>학습 데이터가 여기에 표시됩니다.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 사고 과정 표시 모달 */}
      <ThinkingDisplay
        session={currentThinkingSession}
        isVisible={showThinking}
        onClose={() => setShowThinking(false)}
        enableCopyProtection={copyProtectionEnabled}
      />
    </div>
  );
} 