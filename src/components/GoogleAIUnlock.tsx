'use client';

import React, { useState, useEffect } from 'react';
import { googleAIManager } from '@/lib/google-ai-manager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Lock,
  Key,
  AlertCircle,
  CheckCircle,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

interface GoogleAIUnlockProps {
  onUnlocked?: () => void;
  children?: React.ReactNode;
}

export function GoogleAIUnlock({ onUnlocked, children }: GoogleAIUnlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyStatus, setKeyStatus] = useState(googleAIManager.getKeyStatus());
  const [showPassword, setShowPassword] = useState(false);

  // 컴포넌트 마운트 시 키 상태 확인
  useEffect(() => {
    checkKeyStatus();
  }, []);

  const checkKeyStatus = () => {
    const status = googleAIManager.getKeyStatus();
    setKeyStatus(status);

    // Google AI가 필요하지만 사용할 수 없는 경우 모달 열기
    if (!status.isAvailable && status.needsUnlock) {
      setIsOpen(true);
    }
  };

  const handleUnlock = async () => {
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // API 호출로 비밀번호 검증
      const response = await fetch('/api/google-ai/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setIsOpen(false);
        setPassword('');
        setKeyStatus(googleAIManager.getKeyStatus());
        onUnlocked?.();
      } else {
        setError(result.error || '잠금 해제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Google AI 잠금 해제 오류:', error);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleUnlock();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPassword('');
    setError('');
    setShowPassword(false);
  };

  // Google AI가 이미 사용 가능한 경우 children 렌더링
  if (keyStatus.isAvailable) {
    return <>{children}</>;
  }

  // 팀 설정이 없는 경우 안내 메시지
  if (!keyStatus.needsUnlock) {
    return (
      <div className='p-4 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-950 dark:border-orange-800'>
        <div className='flex items-center gap-2 mb-2'>
          <AlertCircle className='h-5 w-5 text-orange-600 dark:text-orange-400' />
          <h3 className='font-medium text-orange-800 dark:text-orange-200'>
            Google AI 설정 필요
          </h3>
        </div>
        <p className='text-sm text-orange-700 dark:text-orange-300 mb-3'>
          Google AI를 사용하려면 환경변수 설정이나 팀 설정이 필요합니다.
        </p>
        <div className='space-y-2 text-xs text-orange-600 dark:text-orange-400'>
          <div>
            <strong>방법 1:</strong> 개인 환경변수 설정 (권장)
            <code className='block mt-1 p-2 bg-orange-100 dark:bg-orange-900 rounded font-mono'>
              GOOGLE_AI_API_KEY=your_api_key_here
            </code>
          </div>
          <div>
            <strong>방법 2:</strong> 관리자에게 팀 비밀번호 문의
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 잠금 해제 버튼 */}
      <Button
        onClick={() => setIsOpen(true)}
        variant='outline'
        className='flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950'
      >
        <Lock className='h-4 w-4' />
        Google AI 잠금 해제
      </Button>

      {/* 잠금 해제 모달 */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Key className='h-5 w-5 text-blue-600' />
              Google AI 잠금 해제
            </DialogTitle>
            <DialogDescription>
              Google AI 기능을 사용하려면 팀 비밀번호를 입력해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {/* 보안 경고 */}
            <div className='p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800'>
              <div className='flex items-start gap-2'>
                <Shield className='h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0' />
                <div className='text-xs text-amber-700 dark:text-amber-300'>
                  <div className='font-medium mb-1'>🔒 보안 알림</div>
                  <div>
                    비밀번호는 관리자에게 문의하세요. 입력 후 자동으로
                    초기화됩니다.
                  </div>
                </div>
              </div>
            </div>

            {/* 현재 상태 표시 */}
            <div className='p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800'>
              <div className='flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300'>
                <AlertCircle className='h-4 w-4' />
                <span>개인 환경변수가 설정되지 않았습니다.</span>
              </div>
              <p className='text-xs text-blue-600 dark:text-blue-400 mt-1'>
                팀 설정을 사용하려면 관리자가 제공한 비밀번호가 필요합니다.
              </p>
            </div>

            {/* 비밀번호 입력 */}
            <div className='space-y-2'>
              <Label htmlFor='team-password' className='text-sm font-medium'>
                팀 비밀번호
              </Label>
              <div className='relative'>
                <Input
                  id='team-password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='관리자에게 문의한 비밀번호...'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className='pr-10'
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4 text-gray-400' />
                  ) : (
                    <Eye className='h-4 w-4 text-gray-400' />
                  )}
                </Button>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 버튼들 */}
            <div className='flex gap-2'>
              <Button
                onClick={handleUnlock}
                disabled={isLoading || !password.trim()}
                className='flex-1'
              >
                {isLoading ? (
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                ) : (
                  <Key className='h-4 w-4 mr-2' />
                )}
                잠금 해제
              </Button>

              <Button
                variant='outline'
                onClick={handleClose}
                disabled={isLoading}
              >
                취소
              </Button>
            </div>

            {/* 도움말 */}
            <div className='text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-2 border-t'>
              <p className='flex items-center gap-1'>
                <CheckCircle className='h-3 w-3 text-green-500' />
                <strong>권장:</strong> 개인 환경변수 설정 시 비밀번호 불필요
              </p>
              <code className='block p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono'>
                GOOGLE_AI_API_KEY=your_api_key_here
              </code>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* children은 잠금 해제 후에만 렌더링 */}
      {children}
    </>
  );
}

/**
 * Google AI 상태 표시 컴포넌트
 */
export function GoogleAIStatus() {
  const [keyStatus, setKeyStatus] = useState(googleAIManager.getKeyStatus());

  useEffect(() => {
    const checkStatus = () => {
      setKeyStatus(googleAIManager.getKeyStatus());
    };

    // 주기적으로 상태 확인 (선택적)
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusInfo = () => {
    switch (keyStatus.source) {
      case 'env':
        return {
          icon: <CheckCircle className='h-4 w-4 text-green-600' />,
          text: '개인 환경변수 사용 중',
          color: 'text-green-700 bg-green-50 border-green-200',
        };
      case 'team':
        return {
          icon: <CheckCircle className='h-4 w-4 text-blue-600' />,
          text: '팀 설정 사용 중',
          color: 'text-blue-700 bg-blue-50 border-blue-200',
        };
      default:
        return {
          icon: <Lock className='h-4 w-4 text-orange-600' />,
          text: 'Google AI 사용 불가',
          color: 'text-orange-700 bg-orange-50 border-orange-200',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-sm ${statusInfo.color}`}
    >
      {statusInfo.icon}
      <span>{statusInfo.text}</span>
    </div>
  );
}

export default GoogleAIUnlock;
