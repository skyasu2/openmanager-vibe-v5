'use client';

import { AIEnginesPanel } from '@/components/dev-tools/AIEnginesPanel';
import { ServicesMonitor } from '@/components/dev-tools/ServicesMonitor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSystemUpdateStats } from '@/utils/update-prevention';
import {
  AlertTriangle,
  BarChart3,
  Download,
  Key,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface KeyManagerStatus {
  timestamp: string;
  environment: string;
  keyManager: string;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    missing: number;
    successRate: number;
  };
  services?: Array<{
    service: string;
    status: 'active' | 'missing' | 'invalid';
    source: 'env' | 'default' | 'encrypted';
    preview: string;
    lastChecked: string;
  }>;
}

export default function DevToolsPage() {
  const [keyManager, setKeyManager] = useState<KeyManagerStatus | null>(null);
  const [keyManagerLoading, setKeyManagerLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [updateStats, setUpdateStats] = useState<any>(null);
  const [updateStatsLoading, setUpdateStatsLoading] = useState(false);

  const fetchKeyManagerStatus = async () => {
    setKeyManagerLoading(true);
    try {
      const response = await fetch('/api/admin/key-manager');
      if (response.ok) {
        const data = await response.json();
        setKeyManager(data);
      }
    } catch (error) {
      console.error('키 매니저 상태 확인 실패:', error);
    } finally {
      setKeyManagerLoading(false);
    }
  };

  const fetchUpdateStats = async () => {
    setUpdateStatsLoading(true);
    try {
      const stats = await getSystemUpdateStats();
      setUpdateStats(stats);
    } catch (error) {
      console.error('갱신 방지 통계 확인 실패:', error);
    } finally {
      setUpdateStatsLoading(false);
    }
  };

  const handleQuickSetup = async () => {
    try {
      const response = await fetch('/api/admin/quick-setup', {
        method: 'POST',
      });
      if (response.ok) {
        console.log('빠른 설정 완료');
        // 상태 새로고침
        fetchKeyManagerStatus();
      }
    } catch (error) {
      console.error('빠른 설정 실패:', error);
    }
  };

  const handleGenerateEnv = async () => {
    try {
      const response = await fetch('/api/admin/generate-env', {
        method: 'POST',
      });
      if (response.ok) {
        console.log('환경 변수 생성 완료');
      }
    } catch (error) {
      console.error('환경 변수 생성 실패:', error);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'env':
        return '🔧';
      case 'encrypted':
        return '🔒';
      default:
        return '📄';
    }
  };

  useEffect(() => {
    fetchKeyManagerStatus();
    fetchUpdateStats();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchKeyManagerStatus();
        fetchUpdateStats();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800'>
      <div className='container mx-auto px-6 py-8'>
        {/* 헤더 */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-100'>
                🛠️ 개발 도구
              </h1>
              <p className='text-slate-600 dark:text-slate-400 mt-2'>
                시스템 상태 모니터링 및 개발 유틸리티
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                size='sm'
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className='w-4 h-4 mr-2' />
                자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue='services' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='services'>서비스 상태</TabsTrigger>
            <TabsTrigger value='ai-engines'>AI 엔진</TabsTrigger>
            <TabsTrigger value='key-manager'>키 매니저</TabsTrigger>
            <TabsTrigger value='system'>시스템 통계</TabsTrigger>
          </TabsList>

          <TabsContent value='services' className='space-y-6'>
            <ServicesMonitor
              autoRefresh={autoRefresh}
              onRefresh={() => console.log('서비스 상태 새로고침됨')}
            />
          </TabsContent>

          <TabsContent value='ai-engines' className='space-y-6'>
            <AIEnginesPanel />
          </TabsContent>

          <TabsContent value='key-manager' className='space-y-6'>
            {/* 키 매니저 상태 */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2'>
                    <Key className='w-6 h-6' />키 매니저 상태
                  </CardTitle>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleQuickSetup}
                    >
                      <Settings className='w-4 h-4 mr-2' />
                      빠른 설정
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleGenerateEnv}
                    >
                      <Download className='w-4 h-4 mr-2' />
                      ENV 생성
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={fetchKeyManagerStatus}
                      disabled={keyManagerLoading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${keyManagerLoading ? 'animate-spin' : ''}`}
                      />
                      새로고침
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  환경변수 및 API 키 상태 모니터링
                </CardDescription>
              </CardHeader>
              <CardContent>
                {keyManager && (
                  <div className='space-y-6'>
                    {/* 요약 통계 */}
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                      <Card>
                        <CardContent className='p-4'>
                          <div className='text-center'>
                            <p className='text-2xl font-bold'>
                              {keyManager.summary.total}
                            </p>
                            <p className='text-sm text-slate-600 dark:text-slate-400'>
                              총 키
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className='p-4'>
                          <div className='text-center'>
                            <p className='text-2xl font-bold text-green-600'>
                              {keyManager.summary.valid}
                            </p>
                            <p className='text-sm text-slate-600 dark:text-slate-400'>
                              유효
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className='p-4'>
                          <div className='text-center'>
                            <p className='text-2xl font-bold text-red-600'>
                              {keyManager.summary.invalid}
                            </p>
                            <p className='text-sm text-slate-600 dark:text-slate-400'>
                              무효
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className='p-4'>
                          <div className='text-center'>
                            <p className='text-2xl font-bold text-yellow-600'>
                              {keyManager.summary.missing}
                            </p>
                            <p className='text-sm text-slate-600 dark:text-slate-400'>
                              누락
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* 서비스별 키 상태 */}
                    {keyManager.services && (
                      <div className='space-y-3'>
                        <h4 className='text-lg font-medium text-slate-700 dark:text-slate-300'>
                          서비스별 키 상태
                        </h4>
                        <div className='grid gap-3'>
                          {keyManager.services.map((service, index) => (
                            <Card key={index}>
                              <CardContent className='p-4'>
                                <div className='flex items-center justify-between'>
                                  <div className='flex items-center gap-3'>
                                    <span className='text-2xl'>
                                      {getSourceIcon(service.source)}
                                    </span>
                                    <div>
                                      <h5 className='font-medium'>
                                        {service.service}
                                      </h5>
                                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                                        {service.preview}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge
                                    variant={
                                      service.status === 'active'
                                        ? 'default'
                                        : service.status === 'missing'
                                          ? 'destructive'
                                          : 'secondary'
                                    }
                                  >
                                    {service.status}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='system' className='space-y-6'>
            {/* 갱신 방지 통계 */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2'>
                    <BarChart3 className='w-6 h-6' />
                    시스템 갱신 방지 통계
                  </CardTitle>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={fetchUpdateStats}
                    disabled={updateStatsLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${updateStatsLoading ? 'animate-spin' : ''}`}
                    />
                    새로고침
                  </Button>
                </div>
                <CardDescription>
                  시스템 자동 갱신 방지 및 안정성 통계
                </CardDescription>
              </CardHeader>
              <CardContent>
                {updateStats ? (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <Card>
                        <CardContent className='p-4'>
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='text-sm text-slate-600 dark:text-slate-400'>
                                방지된 갱신
                              </p>
                              <p className='text-2xl font-bold'>
                                {updateStats.preventedUpdates || 0}
                              </p>
                            </div>
                            <Shield className='w-8 h-8 text-green-500' />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className='p-4'>
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='text-sm text-slate-600 dark:text-slate-400'>
                                시스템 안정성
                              </p>
                              <p className='text-2xl font-bold'>
                                {updateStats.stability || '99.9'}%
                              </p>
                            </div>
                            <BarChart3 className='w-8 h-8 text-blue-500' />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className='p-4'>
                          <div className='flex items-center justify-between'>
                            <div>
                              <p className='text-sm text-slate-600 dark:text-slate-400'>
                                경고 수
                              </p>
                              <p className='text-2xl font-bold'>
                                {updateStats.warnings || 0}
                              </p>
                            </div>
                            <AlertTriangle className='w-8 h-8 text-yellow-500' />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className='bg-slate-50 dark:bg-slate-800 p-4 rounded-lg'>
                      <h4 className='text-sm font-medium text-slate-700 dark:text-slate-300 mb-2'>
                        상세 정보:
                      </h4>
                      <pre className='text-xs text-slate-600 dark:text-slate-400 overflow-x-auto'>
                        {JSON.stringify(updateStats, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className='text-center py-8'>
                    <BarChart3 className='w-12 h-12 text-slate-400 mx-auto mb-4' />
                    <p className='text-slate-600 dark:text-slate-400'>
                      시스템 통계를 불러오는 중...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 시스템 정리 도구 */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Trash2 className='w-6 h-6' />
                  시스템 정리 도구
                </CardTitle>
                <CardDescription>
                  개발 중 누적된 임시 파일 및 캐시 정리
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <Button variant='outline' className='h-auto p-4'>
                    <div className='text-left'>
                      <p className='font-medium'>로그 파일 정리</p>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        개발 로그 및 임시 파일 삭제
                      </p>
                    </div>
                  </Button>
                  <Button variant='outline' className='h-auto p-4'>
                    <div className='text-left'>
                      <p className='font-medium'>캐시 초기화</p>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Next.js 빌드 캐시 정리
                      </p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
