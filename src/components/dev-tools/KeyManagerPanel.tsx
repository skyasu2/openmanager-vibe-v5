'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Key, RefreshCw, Zap } from 'lucide-react';
import { useState } from 'react';
import { KeyManagerStatus } from './types';
import { getSourceIcon, getStatusBadge, getStatusIcon } from './utils';

interface KeyManagerPanelProps {
  onStatusUpdate?: (status: KeyManagerStatus) => void;
}

export default function KeyManagerPanel({
  onStatusUpdate,
}: KeyManagerPanelProps) {
  const [keyManager, setKeyManager] = useState<KeyManagerStatus | null>(null);
  const [keyManagerLoading, setKeyManagerLoading] = useState(false);

  const fetchKeyManagerStatus = async () => {
    setKeyManagerLoading(true);
    try {
      const response = await fetch('/api/services/dev-key-manager');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setKeyManager(data);
      onStatusUpdate?.(data);
    } catch (error) {
      console.error('키 관리자 상태 확인 실패:', error);
      // 기본 데이터 설정
      const fallbackData: KeyManagerStatus = {
        timestamp: new Date().toISOString(),
        environment: 'development',
        keyManager: 'DevKeyManager',
        summary: {
          total: 0,
          valid: 0,
          invalid: 0,
          missing: 0,
          successRate: 0,
        },
        services: [],
      };
      setKeyManager(fallbackData);
    } finally {
      setKeyManagerLoading(false);
    }
  };

  const handleQuickSetup = async () => {
    setKeyManagerLoading(true);
    try {
      const response = await fetch(
        '/api/services/dev-key-manager/quick-setup',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (response.ok) {
        console.log('빠른 설정 완료');
        await fetchKeyManagerStatus();
      }
    } catch (error) {
      console.error('빠른 설정 실패:', error);
    } finally {
      setKeyManagerLoading(false);
    }
  };

  const handleGenerateEnv = async () => {
    try {
      const response = await fetch(
        '/api/services/dev-key-manager/generate-env'
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '.env.local';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('.env 파일 생성 완료');
      }
    } catch (error) {
      console.error('.env 생성 실패:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Key className='h-5 w-5' />
            <CardTitle>🔑 DevKeyManager</CardTitle>
          </div>
          <div className='flex space-x-2'>
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
            <Button
              variant='outline'
              size='sm'
              onClick={handleGenerateEnv}
              disabled={keyManagerLoading}
            >
              <Download className='h-4 w-4 mr-2' />
              .env 생성
            </Button>
            <Button
              size='sm'
              onClick={handleQuickSetup}
              disabled={keyManagerLoading}
            >
              <Zap className='h-4 w-4 mr-2' />
              빠른 설정
            </Button>
          </div>
        </div>
        <CardDescription>
          통합 API 키 관리 시스템 - 개발 효율성 우선
        </CardDescription>
      </CardHeader>
      <CardContent>
        {keyManager ? (
          <div className='space-y-4'>
            {/* 요약 정보 */}
            <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {keyManager.summary.total}
                </div>
                <div className='text-sm text-muted-foreground'>총 서비스</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {keyManager.summary.valid}
                </div>
                <div className='text-sm text-muted-foreground'>활성화</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-yellow-600'>
                  {keyManager.summary.invalid}
                </div>
                <div className='text-sm text-muted-foreground'>무효</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-red-600'>
                  {keyManager.summary.missing}
                </div>
                <div className='text-sm text-muted-foreground'>누락</div>
              </div>
              <div className='text-center'>
                <div
                  className={`text-2xl font-bold ${
                    keyManager.summary.successRate >= 80
                      ? 'text-green-600'
                      : 'text-yellow-600'
                  }`}
                >
                  {keyManager.summary.successRate}%
                </div>
                <div className='text-sm text-muted-foreground'>성공률</div>
              </div>
            </div>

            <Separator />

            {/* 서비스별 상태 */}
            {keyManager.services && (
              <div className='space-y-2'>
                <h4 className='font-semibold text-sm text-muted-foreground'>
                  서비스별 상태
                </h4>
                <div className='space-y-2'>
                  {keyManager.services.map((service, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors'
                    >
                      <div className='flex items-center space-x-3'>
                        {getStatusIcon(service.status)}
                        <div>
                          <div className='font-medium'>{service.service}</div>
                          <div className='text-xs text-muted-foreground'>
                            {service.preview}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center space-x-3'>
                        <div className='text-xs text-muted-foreground'>
                          {getSourceIcon(service.source)} {service.source}
                        </div>
                        {getStatusBadge(service.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 키 관리자 안내 */}
            <div className='bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg'>
              <div className='text-sm text-yellow-700 dark:text-yellow-300'>
                <p className='font-medium mb-1'>🔧 개발자 도구 안내:</p>
                <ul className='list-disc list-inside space-y-1 text-xs'>
                  <li>빠른 설정: 모든 API 키를 자동으로 설정합니다</li>
                  <li>.env 생성: 현재 설정을 .env.local 파일로 저장합니다</li>
                  <li>개발 환경에서만 사용하세요 (프로덕션 비권장)</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className='flex items-center justify-center py-8'>
            <RefreshCw className='h-6 w-6 animate-spin mr-2' />
            <span>키 관리자 상태를 확인하는 중...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
