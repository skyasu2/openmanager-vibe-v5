'use client';

/**
 * 🚀 OpenManager Vibe v5 - 통합 AI 엔진 관리 대시보드
 *
 * 기존 AI 에이전트 + 새로운 11개 엔진 통합 관리
 * - 마이그레이션 진행 상황
 * - 11개 엔진 실시간 상태
 * - 사고과정 로그 통합
 * - 성능 모니터링 대시보드
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain,
  Database,
  Zap,
  Settings,
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';

// 분리된 탭 컴포넌트들 import
import AIEngineOverviewTab from '@/components/admin/ai-engine-tabs/AIEngineOverviewTab';
import AIEngineMigrationTab from '@/components/admin/ai-engine-tabs/AIEngineMigrationTab';
import AIEngineStatusTab from '@/components/admin/ai-engine-tabs/AIEngineStatusTab';
import AIEngineTrainingTab from '@/components/admin/ai-engine-tabs/AIEngineTrainingTab';
import AIEngineDataTab from '@/components/admin/ai-engine-tabs/AIEngineDataTab';
import AIEnginePerformanceTab from '@/components/admin/ai-engine-tabs/AIEnginePerformanceTab';
import GoogleAIManagementTab from '@/components/admin/ai-engine-tabs/GoogleAIManagementTab';
import { PredictionDashboard } from '@/components/prediction/PredictionDashboard';
import {
  MigrationStatus,
  EngineStatus,
  ServerStats,
  OverallStats,
} from '@/components/admin/ai-engine-tabs/types';

export default function IntegratedAIEngineDashboard() {
  const router = useRouter();
  const { adminMode } = useUnifiedAdminStore();
  const [migrationStatus, setMigrationStatus] =
    useState<MigrationStatus | null>(null);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [isMigrating, setIsMigrating] = useState(false);
  const [engines, setEngines] = useState<EngineStatus[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔄 실시간 서버 통계
  const [serverStats, setServerStats] = useState<ServerStats>({
    total: 0,
    online: 0,
    warning: 0,
    offline: 0,
  });

  // 접근 권한 체크
  useEffect(() => {
    if (!adminMode.isAuthenticated) {
      router.push('/');
      return;
    }
  }, [adminMode.isAuthenticated, router]);

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    if (adminMode.isAuthenticated) {
      initializeData();
    }
  }, [adminMode.isAuthenticated]);

  /**
   * 🔄 실시간 서버 통계 가져오기
   */
  const fetchServerStats = async () => {
    try {
      const response = await fetch('/api/servers?limit=50');
      if (response.ok) {
        const data = await response.json();
        const servers = data.servers || [];

        const stats = {
          total: servers.length,
          online: servers.filter((s: any) => s.status === 'healthy').length,
          warning: servers.filter((s: any) => s.status === 'warning').length,
          offline: servers.filter((s: any) => s.status === 'critical').length,
        };

        setServerStats(stats);
        console.log('📊 서버 통계 업데이트:', stats);
      }
    } catch (error) {
      console.error('❌ 서버 통계 로드 실패:', error);
    }
  };

  // 엔진 상태가 로드된 후 주기적 업데이트 설정
  useEffect(() => {
    if (engines.length === 0) return;

    const interval = setInterval(refreshEngineStatus, 5000);
    return () => clearInterval(interval);
  }, [engines.length]);

  // 서버 통계 주기적 업데이트
  useEffect(() => {
    if (adminMode.isAuthenticated) {
      fetchServerStats();
      const interval = setInterval(fetchServerStats, 10000);
      return () => clearInterval(interval);
    }
  }, [adminMode.isAuthenticated]);

  // 관리자 인증이 되지 않은 경우 접근 차단 화면 표시
  if (!adminMode.isAuthenticated) {
    return (
      <main>
        <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
          <div className='text-center p-8 bg-gray-800 rounded-lg border border-gray-700 max-w-md mx-4'>
            <Lock className='w-16 h-16 text-orange-400 mx-auto mb-4' />
            <h2 className='text-xl font-bold text-white mb-2'>
              관리자 인증 필요
            </h2>
            <p className='text-gray-300 mb-6'>
              AI 관리자 페이지에 접근하려면 관리자 로그인이 필요합니다.
            </p>
            <button
              onClick={() => router.push('/')}
              className='flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors mx-auto'
            >
              <ArrowLeft className='w-4 h-4' />
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </main>
    );
  }

  /**
   * 🔄 초기 데이터 로드
   */
  const initializeData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 AI 엔진 대시보드 초기화 시작...');

      // 마이그레이션 상태 확인
      try {
        const migrationResponse = await fetch(
          '/api/ai/migration?action=status'
        );
        if (migrationResponse.ok) {
          const migrationData = await migrationResponse.json();
          console.log('✅ 마이그레이션 상태:', migrationData);
        }
      } catch (migrationError) {
        console.warn(
          '⚠️ 마이그레이션 상태 확인 실패 (무시됨):',
          migrationError
        );
      }

      // 엔진 상태 초기화
      console.log('🔧 AI 엔진 상태 초기화...');
      initializeEngineStatus();
      console.log('✅ AI 엔진 대시보드 초기화 완료');
    } catch (error) {
      console.error('❌ 초기 데이터 로드 실패:', error);
      setError('데이터 로드에 실패했습니다. 페이지를 새로고침해보세요.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 🔧 AI 엔진 상태 초기화
   */
  const initializeEngineStatus = async () => {
    try {
      console.log('🔍 AI 엔진 상태 API 호출...');
      const response = await fetch('/api/ai/engines/status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('📊 AI 엔진 상태 데이터:', data);

      if (data.engines && Array.isArray(data.engines)) {
        setEngines(data.engines);
        console.log(`✅ ${data.engines.length}개 AI 엔진 상태 로드 완료`);
      } else {
        console.warn('⚠️ 엔진 데이터 형식이 올바르지 않음, 목업 데이터 사용');
        setEngines(getMockEngines());
      }
    } catch (error) {
      console.error('❌ AI 엔진 상태 로드 실패:', error);
      console.log('🔄 목업 데이터로 대체...');
      setEngines(getMockEngines());
    }
  };

  /**
   * 🔄 엔진 상태 새로고침
   */
  const refreshEngineStatus = async () => {
    try {
      const response = await fetch('/api/ai/engines/status');
      if (response.ok) {
        const data = await response.json();
        if (data.engines && Array.isArray(data.engines)) {
          setEngines(data.engines);
        }
      }
    } catch (error) {
      console.error('❌ 엔진 상태 새로고침 실패:', error);
    }
  };

  /**
   * 🚀 마이그레이션 시작
   */
  const startMigration = async () => {
    setIsMigrating(true);
    setMigrationProgress(0);

    try {
      // 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setMigrationProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      const response = await fetch('/api/ai/migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          engines: engines.map(e => e.name),
        }),
      });

      const result = await response.json();
      clearInterval(progressInterval);
      setMigrationProgress(100);

      if (response.ok) {
        setMigrationStatus(result);
        console.log('✅ 마이그레이션 완료:', result);
      } else {
        throw new Error(result.error || '마이그레이션 실패');
      }
    } catch (error) {
      console.error('❌ 마이그레이션 실패:', error);
    } finally {
      setIsMigrating(false);
      setTimeout(() => setMigrationProgress(0), 2000);
    }
  };

  /**
   * 📊 전체 통계 계산 - 실제 데이터 기반
   */
  const getOverallStats = (): OverallStats => {
    if (engines.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        activeEngines: 0,
        avgAccuracy: 0,
      };
    }

    const totalRequests = engines.reduce(
      (sum, engine) => sum + engine.requests,
      0
    );
    const avgResponseTime = Math.round(
      engines.reduce((sum, engine) => sum + engine.responseTime, 0) /
        engines.length
    );
    const activeEngines = engines.filter(
      engine => engine.status === 'active'
    ).length;
    const avgAccuracy = Math.round(
      engines.reduce((sum, engine) => sum + engine.accuracy, 0) / engines.length
    );

    return {
      totalRequests,
      avgResponseTime,
      activeEngines,
      avgAccuracy,
    };
  };

  /**
   * 🎭 목업 엔진 데이터
   */
  const getMockEngines = (): EngineStatus[] => [
    {
      name: 'GPT-4o',
      type: 'opensource',
      status: 'active',
      requests: 15420,
      accuracy: 94,
      responseTime: 120,
      lastUsed: '2분 전',
    },
    {
      name: 'Claude-3.5',
      type: 'opensource',
      status: 'active',
      requests: 12890,
      accuracy: 92,
      responseTime: 95,
      lastUsed: '1분 전',
    },
    {
      name: 'Gemini Pro',
      type: 'opensource',
      status: 'active',
      requests: 9876,
      accuracy: 89,
      responseTime: 110,
      lastUsed: '3분 전',
    },
    {
      name: 'Korean AI v2',
      type: 'custom',
      status: 'training',
      requests: 5432,
      accuracy: 87,
      responseTime: 85,
      lastUsed: '10분 전',
    },
    {
      name: 'Server Monitor AI',
      type: 'custom',
      status: 'active',
      requests: 8765,
      accuracy: 91,
      responseTime: 75,
      lastUsed: '30초 전',
    },
  ];

  const stats = getOverallStats();

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6 flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <div className='w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto'></div>
          <h2 className='text-2xl font-bold'>AI 엔진 대시보드 로딩 중...</h2>
          <p className='text-slate-300'>
            11개 AI 엔진 상태를 확인하고 있습니다.
          </p>
        </div>
      </div>
    );
  }

  // 오류 상태 표시
  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6 flex items-center justify-center'>
        <div className='text-center space-y-4 max-w-md'>
          <AlertTriangle className='w-16 h-16 text-red-400 mx-auto' />
          <h2 className='text-2xl font-bold text-red-400'>오류 발생</h2>
          <p className='text-slate-300'>{error}</p>
          <button
            onClick={() => {
              setError(null);
              initializeData();
            }}
            className='flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg mx-auto'
          >
            <RefreshCw className='w-4 h-4' />
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6'>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* 헤더 */}
        <div className='text-center space-y-4'>
          <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
            🚀 통합 AI 엔진 관리 대시보드
          </h1>
          <p className='text-slate-300 text-lg'>
            11개 AI 엔진 + 마이그레이션 통합 관리 시스템
          </p>

          {/* 관리자 네비게이션 탭 추가 */}
          <div className='flex justify-center mt-6'>
            <div className='bg-slate-800/50 backdrop-blur-sm rounded-xl p-2 border border-slate-700'>
              <div className='flex gap-2'>
                <button className='px-4 py-2 bg-purple-600 text-white rounded-lg font-medium'>
                  AI 엔진 관리
                </button>
                <button
                  onClick={() => window.open('/admin/ai-analysis', '_blank')}
                  className='px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg font-medium transition-colors'
                >
                  AI 분석 모니터링
                </button>
                <button
                  onClick={() => window.open('/admin/mcp-monitoring', '_blank')}
                  className='px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg font-medium transition-colors'
                >
                  MCP 모니터링
                </button>
                <button
                  onClick={() => window.open('/admin/smart-fallback', '_blank')}
                  className='px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg font-medium transition-colors'
                >
                  스마트 폴백
                </button>
                <button
                  onClick={() =>
                    window.open('/admin/virtual-servers', '_blank')
                  }
                  className='px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg font-medium transition-colors'
                >
                  가상 서버
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 전체 통계 카드 */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <Card className='bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-blue-100 text-sm'>총 요청 수</p>
                  <p className='text-3xl font-bold text-white'>
                    {stats.totalRequests.toLocaleString()}
                  </p>
                </div>
                <BarChart3 className='w-12 h-12 text-blue-200' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-green-600 to-green-700 border-green-500'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-green-100 text-sm'>평균 정확도</p>
                  <p className='text-3xl font-bold text-white'>
                    {stats.avgAccuracy}%
                  </p>
                </div>
                <TrendingUp className='w-12 h-12 text-green-200' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-purple-100 text-sm'>평균 응답시간</p>
                  <p className='text-3xl font-bold text-white'>
                    {stats.avgResponseTime}ms
                  </p>
                </div>
                <Clock className='w-12 h-12 text-purple-200' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-orange-600 to-orange-700 border-orange-500'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-orange-100 text-sm'>활성 엔진</p>
                  <p className='text-3xl font-bold text-white'>
                    {stats.activeEngines}/{serverStats.total}
                  </p>
                </div>
                <Brain className='w-12 h-12 text-orange-200' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 탭 메뉴 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-8 bg-slate-800 border-slate-700'>
            <TabsTrigger
              value='overview'
              className='data-[state=active]:bg-purple-600'
            >
              <Brain className='w-4 h-4 mr-2' />
              개요
            </TabsTrigger>
            <TabsTrigger
              value='migration'
              className='data-[state=active]:bg-blue-600'
            >
              <Database className='w-4 h-4 mr-2' />
              마이그레이션
            </TabsTrigger>
            <TabsTrigger
              value='engines'
              className='data-[state=active]:bg-green-600'
            >
              <Zap className='w-4 h-4 mr-2' />
              엔진 상태
            </TabsTrigger>
            <TabsTrigger
              value='google-ai'
              className='data-[state=active]:bg-yellow-600'
            >
              <Settings className='w-4 h-4 mr-2' />
              Google AI
            </TabsTrigger>
            <TabsTrigger
              value='training'
              className='data-[state=active]:bg-cyan-600'
            >
              <Settings className='w-4 h-4 mr-2' />
              훈련 관리
            </TabsTrigger>
            <TabsTrigger
              value='data'
              className='data-[state=active]:bg-indigo-600'
            >
              <BarChart3 className='w-4 h-4 mr-2' />
              학습 데이터
            </TabsTrigger>
            <TabsTrigger
              value='performance'
              className='data-[state=active]:bg-orange-600'
            >
              <TrendingUp className='w-4 h-4 mr-2' />
              성능
            </TabsTrigger>
            <TabsTrigger
              value='prediction'
              className='data-[state=active]:bg-red-600'
            >
              <AlertTriangle className='w-4 h-4 mr-2' />
              예측
            </TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value='overview'>
            <AIEngineOverviewTab
              engines={engines}
              serverStats={serverStats}
              overallStats={stats}
              isLoading={isLoading}
              error={error}
              refreshEngineStatus={refreshEngineStatus}
            />
          </TabsContent>

          {/* 마이그레이션 탭 */}
          <TabsContent value='migration'>
            <AIEngineMigrationTab
              engines={engines}
              serverStats={serverStats}
              overallStats={stats}
              isLoading={isLoading}
              error={error}
              refreshEngineStatus={refreshEngineStatus}
              migrationStatus={migrationStatus}
              migrationProgress={migrationProgress}
              isMigrating={isMigrating}
              startMigration={startMigration}
            />
          </TabsContent>

          {/* 엔진 상태 탭 */}
          <TabsContent value='engines'>
            <AIEngineStatusTab
              engines={engines}
              serverStats={serverStats}
              overallStats={stats}
              isLoading={isLoading}
              error={error}
              refreshEngineStatus={refreshEngineStatus}
            />
          </TabsContent>

          {/* Google AI 관리 탭 */}
          <TabsContent value='google-ai'>
            <GoogleAIManagementTab />
          </TabsContent>

          {/* 훈련 관리 탭 */}
          <TabsContent value='training'>
            <AIEngineTrainingTab
              engines={engines}
              serverStats={serverStats}
              overallStats={stats}
              isLoading={isLoading}
              error={error}
              refreshEngineStatus={refreshEngineStatus}
            />
          </TabsContent>

          {/* 학습 데이터 탭 */}
          <TabsContent value='data'>
            <AIEngineDataTab
              engines={engines}
              serverStats={serverStats}
              overallStats={stats}
              isLoading={isLoading}
              error={error}
              refreshEngineStatus={refreshEngineStatus}
            />
          </TabsContent>

          {/* 성능 탭 */}
          <TabsContent value='performance'>
            <AIEnginePerformanceTab
              engines={engines}
              serverStats={serverStats}
              overallStats={stats}
              isLoading={isLoading}
              error={error}
              refreshEngineStatus={refreshEngineStatus}
            />
          </TabsContent>

          {/* 예측 분석 탭 */}
          <TabsContent value='prediction'>
            <div className='space-y-6'>
              <div className='bg-slate-800 rounded-lg p-6 border border-slate-700'>
                <h3 className='text-xl font-bold text-white mb-4 flex items-center gap-2'>
                  <AlertTriangle className='w-6 h-6 text-red-400' />
                  장애 예측 분석 대시보드
                </h3>
                <p className='text-slate-300 mb-6'>
                  AI 기반 예측 분석을 통해 시스템 장애를 사전에 감지하고
                  예방합니다.
                </p>
                <PredictionDashboard
                  className='mt-6'
                  serverId='web-server-01'
                  autoRefresh={true}
                  refreshInterval={20000}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
