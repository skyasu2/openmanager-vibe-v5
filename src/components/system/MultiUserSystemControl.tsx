/**
 * 다중 사용자 시스템 제어 컴포넌트
 *
 * 분산 락 기반 시스템 제어 UI
 * - 현재 제어자 표시
 * - 대기열 상태 시각화
 * - 실시간 상태 업데이트
 */

'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useMultiUserSystemControl } from '@/hooks/useMultiUserSystemControl';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Crown,
  Loader2,
  Lock,
  Play,
  RotateCcw,
  Settings,
  Square,
  Unlock,
  Users,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface MultiUserSystemControlProps {
  userId?: string;
  userName?: string;
  isAdmin?: boolean;
  adminKey?: string;
}

export function MultiUserSystemControl({
  userId = 'user_001',
  userName = '사용자',
  isAdmin = false,
  adminKey,
}: MultiUserSystemControlProps) {
  const [systemControlState, systemControlActions] = useMultiUserSystemControl({
    userId,
    userName,
    autoRefresh: true,
    refreshInterval: 3000,
    enableNotifications: true,
  });

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState(adminKey || '');

  const {
    systemState,
    isLoading,
    error,
    isLocked,
    canControl,
    currentController,
    queue,
    isWaiting,
    waitingPosition,
    userEstimatedWaitTime,
  } = systemControlState;

  const {
    startSystem,
    stopSystem,
    restartSystem,
    maintenanceMode,
    refreshStatus,
    cancelWaiting,
    forceUnlock,
  } = systemControlActions;

  // 시스템 상태에 따른 색상 및 아이콘
  const getSystemStateInfo = (state: string) => {
    switch (state) {
      case 'RUNNING':
        return { color: 'bg-green-500', icon: CheckCircle, text: '실행 중' };
      case 'STOPPED':
        return { color: 'bg-gray-500', icon: Square, text: '중지됨' };
      case 'STARTING':
        return { color: 'bg-blue-500', icon: Loader2, text: '시작 중' };
      case 'STOPPING':
        return { color: 'bg-orange-500', icon: Loader2, text: '중지 중' };
      case 'ERROR':
        return { color: 'bg-red-500', icon: XCircle, text: '오류' };
      case 'MAINTENANCE':
        return { color: 'bg-purple-500', icon: Settings, text: '유지보수' };
      default:
        return {
          color: 'bg-gray-400',
          icon: AlertTriangle,
          text: '알 수 없음',
        };
    }
  };

  const stateInfo = getSystemStateInfo(systemState);
  const StateIcon = stateInfo.icon;

  // 대기 시간 포맷팅
  const formatWaitTime = (milliseconds: number) => {
    const seconds = Math.round(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return minutes + '분 ' + remainingSeconds + '초';
    }
    return remainingSeconds + '초';
  };

  // 관리자 강제 락 해제
  const handleForceUnlock = async () => {
    if (!adminKeyInput.trim()) {
      alert('관리자 키를 입력해주세요.');
      return;
    }

    const success = await forceUnlock(adminKeyInput);
    if (success) {
      setShowAdminPanel(false);
      alert('시스템 락이 강제로 해제되었습니다.');
    }
  };

  return (
    <div className='space-y-6'>
      {/* 메인 시스템 상태 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <StateIcon
              className={`w-5 h-5 ${systemState === 'STARTING' || systemState === 'STOPPING' ? 'animate-spin' : ''}`}
            />
            시스템 상태: {stateInfo.text}
          </CardTitle>
          <CardDescription>
            {isLocked ? (
              <>
                현재 시스템이 <strong>{currentController?.userName}</strong>에
                의해 제어되고 있습니다.
              </>
            ) : (
              <>현재 시스템 제어가 가능합니다.</>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-4'>
          {/* 시스템 상태 인디케이터 */}
          <div className='flex items-center gap-3'>
            <div
              className={`w-3 h-3 rounded-full ${stateInfo.color} ${systemState === 'STARTING' || systemState === 'STOPPING' ? 'animate-pulse' : ''}`}
            />
            <Badge
              variant={systemState === 'RUNNING' ? 'default' : 'secondary'}
            >
              {stateInfo.text}
            </Badge>
          </div>

          {/* 현재 제어자 정보 */}
          {isLocked && currentController && (
            <Alert>
              <Lock className='h-4 w-4' />
              <AlertDescription>
                <div className='space-y-1'>
                  <div>
                    <strong>{currentController.userName}</strong>이(가){' '}
                    <Badge variant='outline'>{currentController.action}</Badge>{' '}
                    작업을 수행 중입니다.
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    남은 시간: {formatWaitTime(currentController.remainingTime)}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 사용자 대기 상태 */}
          {isWaiting && (
            <Alert className='border-blue-500 bg-blue-50'>
              <Clock className='h-4 w-4' />
              <AlertDescription>
                <div className='space-y-2'>
                  <div>대기열에 추가되었습니다.</div>
                  <div className='flex items-center gap-4 text-sm'>
                    <span>
                      대기 순서: <strong>{waitingPosition}번째</strong>
                    </span>
                    <span>
                      예상 대기 시간:{' '}
                      <strong>
                        {formatWaitTime(userEstimatedWaitTime || 0)}
                      </strong>
                    </span>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={cancelWaiting}
                    className='mt-2'
                  >
                    대기 취소
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 에러 메시지 */}
          {error && (
            <Alert variant='destructive'>
              <XCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* 시스템 제어 버튼들 */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
            <Button
              onClick={startSystem}
              disabled={!canControl || isLoading || systemState === 'RUNNING'}
              variant={systemState === 'STOPPED' ? 'default' : 'outline'}
              className='flex items-center gap-2'
            >
              {isLoading ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Play className='w-4 h-4' />
              )}
              시작
            </Button>

            <Button
              onClick={stopSystem}
              disabled={!canControl || isLoading || systemState === 'STOPPED'}
              variant={systemState === 'RUNNING' ? 'destructive' : 'outline'}
              className='flex items-center gap-2'
            >
              {isLoading ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Square className='w-4 h-4' />
              )}
              중지
            </Button>

            <Button
              onClick={restartSystem}
              disabled={!canControl || isLoading}
              variant='outline'
              className='flex items-center gap-2'
            >
              {isLoading ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <RotateCcw className='w-4 h-4' />
              )}
              재시작
            </Button>

            <Button
              onClick={maintenanceMode}
              disabled={!canControl || isLoading}
              variant='outline'
              className='flex items-center gap-2'
            >
              {isLoading ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Settings className='w-4 h-4' />
              )}
              유지보수
            </Button>
          </div>

          {/* 새로고침 버튼 */}
          <Button
            onClick={refreshStatus}
            variant='ghost'
            size='sm'
            className='w-full'
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              '상태 새로고침'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 대기열 상태 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='w-5 h-5' />
            대기열 상태
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className='grid grid-cols-2 gap-4 text-center'>
            <div>
              <div className='text-2xl font-bold text-blue-600'>
                {queue.length}
              </div>
              <div className='text-sm text-muted-foreground'>
                대기 중인 사용자
              </div>
            </div>
            <div>
              <div className='text-2xl font-bold text-orange-600'>
                {formatWaitTime(queue.estimatedWaitTime)}
              </div>
              <div className='text-sm text-muted-foreground'>
                예상 대기 시간
              </div>
            </div>
          </div>

          {queue.length > 0 && (
            <div className='mt-4'>
              <div className='text-sm text-muted-foreground mb-2'>
                대기열 진행률
              </div>
              <Progress
                value={queue.length > 0 ? 100 - queue.length * 10 : 0}
                className='w-full'
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 관리자 패널 */}
      {isAdmin && (
        <Card className='border-red-200'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-red-600'>
              <Crown className='w-5 h-5' />
              관리자 제어
            </CardTitle>
            <CardDescription>
              시스템 관리자 전용 기능입니다. 신중하게 사용하세요.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!showAdminPanel ? (
              <Button
                onClick={() => setShowAdminPanel(true)}
                variant='outline'
                className='w-full border-red-300 text-red-600 hover:bg-red-50'
              >
                관리자 패널 열기
              </Button>
            ) : (
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>관리자 키</label>
                  <input
                    type='password'
                    value={adminKeyInput}
                    onChange={e => setAdminKeyInput(e.target.value)}
                    placeholder='관리자 키를 입력하세요'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm'
                  />
                </div>

                <div className='flex gap-2'>
                  <Button
                    onClick={handleForceUnlock}
                    variant='destructive'
                    size='sm'
                    className='flex items-center gap-2'
                    disabled={!adminKeyInput.trim()}
                  >
                    <Unlock className='w-4 h-4' />
                    강제 락 해제
                  </Button>

                  <Button
                    onClick={() => setShowAdminPanel(false)}
                    variant='outline'
                    size='sm'
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 도움말 */}
      <Card className='bg-gray-50'>
        <CardContent className='pt-6'>
          <div className='text-sm text-muted-foreground space-y-1'>
            <p>
              <strong>사용법:</strong>
            </p>
            <p>• 시스템 제어는 한 번에 한 명의 사용자만 가능합니다</p>
            <p>• 다른 사용자가 제어 중일 때는 대기열에 자동으로 추가됩니다</p>
            <p>• 각 작업은 최대 5분간 유지되며, 자동으로 해제됩니다</p>
            <p>• 브라우저 알림을 통해 대기열 상태를 확인할 수 있습니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
