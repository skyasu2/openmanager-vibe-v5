/**
 * 🌐 실시간 시스템 상태 공유 컴포넌트 v3
 *
 * 모든 사용자가 자유롭게 시스템 제어 가능
 * - 실시간 상태 브로드캐스트
 * - 제어 히스토리 시각화
 * - 연결된 사용자 목록
 * - 베르셀 환경 최적화
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useRealTimeSystemControl } from '@/hooks/useRealTimeSystemControl';
import {
  Activity,
  CheckCircle,
  Clock,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Settings,
  Square,
  Users,
  Wifi,
  WifiOff,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

export interface RealTimeSystemControlProps {
  userId?: string;
  userName?: string;
  enableNotifications?: boolean;
  showUserList?: boolean;
  showActionHistory?: boolean;
  className?: string;
}

export function RealTimeSystemControl({
  userId,
  userName = '익명 사용자',
  enableNotifications = true,
  showUserList = true,
  showActionHistory = true,
  className = '',
}: RealTimeSystemControlProps) {
  const [state, actions] = useRealTimeSystemControl({
    userId,
    userName,
    enableNotifications,
  });

  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // 시스템 상태에 따른 UI 정보
  const getSystemStateInfo = () => {
    switch (state.systemState) {
      case 'RUNNING':
        return {
          text: '실행 중',
          color: 'bg-green-500',
          icon: Activity,
          description: '시스템이 정상적으로 실행 중입니다.',
        };
      case 'STARTING':
        return {
          text: '시작 중',
          color: 'bg-yellow-500',
          icon: Loader2,
          description: '시스템이 시작되고 있습니다.',
        };
      case 'STOPPING':
        return {
          text: '중지 중',
          color: 'bg-orange-500',
          icon: Loader2,
          description: '시스템이 중지되고 있습니다.',
        };
      case 'STOPPED':
        return {
          text: '중지됨',
          color: 'bg-gray-500',
          icon: Square,
          description: '시스템이 중지된 상태입니다.',
        };
      case 'MAINTENANCE':
        return {
          text: '유지보수',
          color: 'bg-purple-500',
          icon: Settings,
          description: '유지보수 모드입니다.',
        };
      case 'ERROR':
        return {
          text: '오류',
          color: 'bg-red-500',
          icon: XCircle,
          description: '시스템에 오류가 발생했습니다.',
        };
      default:
        return {
          text: '알 수 없음',
          color: 'bg-gray-400',
          icon: XCircle,
          description: '시스템 상태를 확인할 수 없습니다.',
        };
    }
  };

  const stateInfo = getSystemStateInfo();
  const StateIcon = stateInfo.icon;

  // 액션 실행 래퍼
  const executeAction = async (
    actionName: string,
    actionFn: () => Promise<boolean>
  ) => {
    setActionInProgress(actionName);
    try {
      await actionFn();
    } finally {
      setActionInProgress(null);
    }
  };

  // 상대적 시간 포맷
  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return minutes + '분 ' + seconds + '초 전';
    }
    return seconds + '초 전';
  };

  // 액션 상태 아이콘
  const getActionStatusIcon = (status: string) => {
    switch (status) {
      case 'executing':
        return <Loader2 className='w-4 h-4 animate-spin text-yellow-500' />;
      case 'completed':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case 'failed':
        return <XCircle className='w-4 h-4 text-red-500' />;
      default:
        return <Clock className='w-4 h-4 text-gray-400' />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 연결 상태 알림 */}
      {!state.isConnected && (
        <Alert>
          <WifiOff className='h-4 w-4' />
          <AlertDescription>
            실시간 상태 스트림 연결이 끊어졌습니다. 자동으로 재연결을 시도하고
            있습니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 오류 알림 */}
      {state.error && (
        <Alert variant='destructive'>
          <XCircle className='h-4 w-4' />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* 메인 시스템 상태 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <StateIcon
              className={`w-5 h-5 ${state.systemState === 'STARTING' || state.systemState === 'STOPPING' ? 'animate-spin' : ''}`}
            />
            시스템 상태: {stateInfo.text}
            {state.isConnected ? (
              <Wifi className='w-4 h-4 text-green-500 ml-auto' />
            ) : (
              <WifiOff className='w-4 h-4 text-red-500 ml-auto' />
            )}
          </CardTitle>
          <CardDescription>
            {stateInfo.description}
            {state.lastAction && (
              <span className='block text-xs text-muted-foreground mt-1'>
                마지막 작업: {state.lastAction.userName}님이{' '}
                {formatRelativeTime(state.lastAction.timestamp)}에{' '}
                {state.lastAction.action}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* 시스템 상태 인디케이터 */}
          <div className='flex items-center gap-3'>
            <div
              className={`w-3 h-3 rounded-full ${stateInfo.color} ${state.systemState === 'STARTING' || state.systemState === 'STOPPING' ? 'animate-pulse' : ''}`}
            />
            <Badge
              variant={
                state.systemState === 'RUNNING' ? 'default' : 'secondary'
              }
            >
              {stateInfo.text}
            </Badge>
            {state.connectedUsers.length > 0 && (
              <Badge variant='outline' className='ml-auto'>
                <Users className='w-3 h-3 mr-1' />
                {state.connectedUsers.length}명 연결됨
              </Badge>
            )}
          </div>

          <Separator />

          {/* 시스템 제어 버튼들 */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
            <Button
              onClick={() => executeAction('start', actions.startSystem)}
              disabled={state.isLoading || actionInProgress !== null}
              className='flex items-center gap-2'
              variant={state.systemState === 'STOPPED' ? 'default' : 'outline'}
            >
              {actionInProgress === 'start' ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Play className='w-4 h-4' />
              )}
              시작
            </Button>

            <Button
              onClick={() => executeAction('stop', actions.stopSystem)}
              disabled={state.isLoading || actionInProgress !== null}
              className='flex items-center gap-2'
              variant={
                state.systemState === 'RUNNING' ? 'destructive' : 'outline'
              }
            >
              {actionInProgress === 'stop' ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Square className='w-4 h-4' />
              )}
              중지
            </Button>

            <Button
              onClick={() => executeAction('restart', actions.restartSystem)}
              disabled={state.isLoading || actionInProgress !== null}
              className='flex items-center gap-2'
              variant='outline'
            >
              {actionInProgress === 'restart' ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <RotateCcw className='w-4 h-4' />
              )}
              재시작
            </Button>

            <Button
              onClick={() =>
                executeAction('maintenance', actions.maintenanceMode)
              }
              disabled={state.isLoading || actionInProgress !== null}
              className='flex items-center gap-2'
              variant='outline'
            >
              {actionInProgress === 'maintenance' ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Settings className='w-4 h-4' />
              )}
              유지보수
            </Button>
          </div>

          {/* 새로고침 버튼 */}
          <Button
            onClick={actions.refreshStatus}
            disabled={state.isLoading}
            variant='ghost'
            size='sm'
            className='w-full'
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${state.isLoading ? 'animate-spin' : ''}`}
            />
            상태 새로고침
          </Button>
        </CardContent>
      </Card>

      {/* 연결된 사용자 목록 */}
      {showUserList && state.connectedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='w-5 h-5' />
              연결된 사용자 ({state.connectedUsers.length}명)
            </CardTitle>
            <CardDescription>
              현재 실시간 상태를 공유하고 있는 사용자들입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className='h-32'>
              <div className='space-y-2'>
                {state.connectedUsers.map((user, index) => (
                  <div
                    key={user.userId}
                    className='flex items-center justify-between p-2 bg-gray-50 rounded-lg'
                  >
                    <div className='flex items-center gap-2'>
                      <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                      <span className='font-medium'>{user.userName}</span>
                      {user.userId === userId && (
                        <Badge variant='secondary' className='text-xs'>
                          나
                        </Badge>
                      )}
                    </div>
                    <span className='text-xs text-muted-foreground'>
                      {formatRelativeTime(user.connectedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* 최근 액션 히스토리 */}
      {showActionHistory && state.recentActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='w-5 h-5' />
              최근 제어 히스토리
            </CardTitle>
            <CardDescription>
              최근 실행된 시스템 제어 액션들입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className='h-48'>
              <div className='space-y-3'>
                {state.recentActions.map(action => (
                  <div
                    key={action.id}
                    className='flex items-center justify-between p-3 border rounded-lg'
                  >
                    <div className='flex items-center gap-3'>
                      {getActionStatusIcon(action.status)}
                      <div>
                        <div className='font-medium flex items-center gap-2'>
                          {action.userName}
                          <Badge variant='outline' className='text-xs'>
                            {action.action}
                          </Badge>
                        </div>
                        {action.message && (
                          <div className='text-sm text-muted-foreground'>
                            {action.message}
                          </div>
                        )}
                        {action.duration && (
                          <div className='text-xs text-muted-foreground flex items-center gap-1'>
                            <Zap className='w-3 h-3' />
                            {action.duration}ms
                          </div>
                        )}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-xs text-muted-foreground'>
                        {formatRelativeTime(action.timestamp)}
                      </div>
                      <Badge
                        variant={
                          action.status === 'completed'
                            ? 'default'
                            : action.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className='text-xs'
                      >
                        {action.status === 'executing'
                          ? '실행 중'
                          : action.status === 'completed'
                            ? '완료'
                            : '실패'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* 도움말 */}
      <Card className='bg-blue-50'>
        <CardContent className='pt-6'>
          <div className='text-sm text-blue-600 space-y-1'>
            <p>
              <strong>🌐 실시간 상태 공유 방식:</strong>
            </p>
            <p>• 모든 사용자가 자유롭게 시스템을 제어할 수 있습니다</p>
            <p>• 시스템 상태와 제어 히스토리가 실시간으로 공유됩니다</p>
            <p>• 다른 사용자의 제어 행동이 즉시 반영됩니다</p>
            <p>• 연결이 끊어지면 자동으로 재연결을 시도합니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RealTimeSystemControl;
