/**
 * 🎯 통합 프로필 버튼 v3.0 - 2025.06.27 KST
 *
 * ✅ 통합 실시간 스토어 사용
 * ✅ 중복 API 호출 제거
 * ✅ 30분 타이머 기능 유지
 * ✅ 메모리 최적화
 */

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Activity,
  AlertTriangle,
  Clock,
  LogOut,
  Play,
  Settings,
  Shield,
  Square,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// 통합 실시간 스토어 사용
import { useRealtimeControl, useSystemStatus } from '@/stores/globalRealtimeStore';

interface SystemStats {
  uptime: number;
  memoryUsage: number;
  activeProcesses: number;
  status: 'running' | 'stopped' | 'error';
}

function UnifiedProfileButton() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [is30MinTimerActive, setIs30MinTimerActive] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // 🔄 통합 실시간 데이터 사용
  const { systemStatus } = useSystemStatus();
  const { isPolling, startPolling, stopPolling } = useRealtimeControl();

  // 시스템 통계 추출
  const systemStats: SystemStats = {
    uptime: systemStatus?.uptime || 0,
    memoryUsage: systemStatus?.memoryUsage?.percentage || 0,
    activeProcesses: Object.keys(systemStatus?.processes || {}).length,
    status: systemStatus?.health === 'healthy' ? 'running' :
      systemStatus?.health === 'critical' ? 'error' : 'stopped'
  };

  // 🎮 시스템 시작
  const handleSystemStart = useCallback(async () => {
    try {
      console.log('🚀 시스템 시작 요청 (KST):', new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));

      const response = await fetch('/api/system/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 시스템 시작 성공:', result);

        // 실시간 폴링이 중단되어 있으면 재시작
        if (!isPolling) {
          startPolling();
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 시스템 시작 실패:', error);
    }
  }, [isPolling, startPolling]);

  // ⏹️ 시스템 정지
  const handleSystemStop = useCallback(async () => {
    try {
      console.log('⏹️ 시스템 정지 요청 (KST):', new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));

      const response = await fetch('/api/system/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 시스템 정지 성공:', result);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 시스템 정지 실패:', error);
    }
  }, []);

  // ⏰ 30분 타이머 시작
  const start30MinTimer = useCallback(() => {
    if (is30MinTimerActive) return;

    console.log('⏰ 30분 안정성 타이머 시작');
    setIs30MinTimerActive(true);
    setTimerRemaining(30 * 60); // 30분 = 1800초

    // 30분 후 자동 정지
    timerRef.current = setTimeout(() => {
      handleSystemStop();
      setIs30MinTimerActive(false);
      setTimerRemaining(0);
      console.log('⏰ 30분 타이머 완료 - 시스템 자동 정지');
    }, 30 * 60 * 1000);

    // 1초마다 카운트다운 업데이트
    countdownRef.current = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) {
          setIs30MinTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [is30MinTimerActive, handleSystemStop]);

  // ⏹️ 30분 타이머 중단
  const stop30MinTimer = useCallback(() => {
    if (!is30MinTimerActive) return;

    console.log('⏹️ 30분 타이머 중단');

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    setIs30MinTimerActive(false);
    setTimerRemaining(0);
  }, [is30MinTimerActive]);

  // 컴포넌트 언마운트시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // 상태별 색상 및 아이콘
  const getStatusConfig = () => {
    switch (systemStats.status) {
      case 'running':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          icon: Play,
          text: '실행 중'
        };
      case 'error':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          icon: AlertTriangle,
          text: '오류'
        };
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          icon: Square,
          text: '정지됨'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}시간 ${minutes}분`;
  };

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-10 w-10 rounded-full p-0'>
          <Avatar className='h-10 w-10'>
            <AvatarImage src='/avatar.png' alt='관리자' />
            <AvatarFallback className='bg-gradient-to-r from-blue-500 to-purple-600 text-white'>
              관리
            </AvatarFallback>
          </Avatar>

          {/* 상태 인디케이터 */}
          <div
            className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${statusConfig.color}`}
          />

          {/* 30분 타이머 인디케이터 */}
          {is30MinTimerActive && (
            <div className='absolute -top-1 -left-1 h-4 w-4 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center'>
              <Clock className='h-2 w-2 text-white' />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className='w-80 p-4' align='end' forceMount>
        {/* 사용자 정보 */}
        <DropdownMenuLabel className='font-normal'>
          <div className='flex items-center space-x-3'>
            <Avatar className='h-12 w-12'>
              <AvatarImage src='/avatar.png' alt='관리자' />
              <AvatarFallback className='bg-gradient-to-r from-blue-500 to-purple-600 text-white'>
                관리
              </AvatarFallback>
            </Avatar>
            <div>
              <p className='text-sm font-medium'>시스템 관리자</p>
              <p className='text-xs text-muted-foreground'>
                OpenManager Vibe v5
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* 시스템 상태 요약 */}
        <div className={`p-3 rounded-lg ${statusConfig.bgColor} mb-3`}>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center space-x-2'>
              <StatusIcon className={`h-4 w-4 ${statusConfig.textColor}`} />
              <span className={`text-sm font-medium ${statusConfig.textColor}`}>
                {statusConfig.text}
              </span>
            </div>
            <Badge variant='outline' className='text-xs'>
              실시간 연결: {isPolling ? '활성' : '비활성'}
            </Badge>
          </div>

          <div className='grid grid-cols-3 gap-2 text-xs'>
            <div className='text-center'>
              <div className='font-medium'>{formatUptime(systemStats.uptime)}</div>
              <div className='text-muted-foreground'>업타임</div>
            </div>
            <div className='text-center'>
              <div className='font-medium'>{systemStats.memoryUsage}%</div>
              <div className='text-muted-foreground'>메모리</div>
            </div>
            <div className='text-center'>
              <div className='font-medium'>{systemStats.activeProcesses}</div>
              <div className='text-muted-foreground'>프로세스</div>
            </div>
          </div>
        </div>

        {/* 30분 타이머 상태 */}
        {is30MinTimerActive && (
          <div className='p-3 bg-orange-50 rounded-lg mb-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Clock className='h-4 w-4 text-orange-600' />
                <span className='text-sm font-medium text-orange-600'>
                  30분 안정성 타이머
                </span>
              </div>
              <Badge variant='outline' className='text-orange-600 border-orange-200'>
                {formatTime(timerRemaining)}
              </Badge>
            </div>
            <p className='text-xs text-orange-600 mt-1'>
              남은 시간 후 자동으로 시스템이 정지됩니다
            </p>
          </div>
        )}

        {/* 시스템 제어 버튼 */}
        <div className='space-y-2 mb-3'>
          <div className='grid grid-cols-2 gap-2'>
            <Button
              onClick={handleSystemStart}
              disabled={systemStats.status === 'running'}
              size='sm'
              className='flex items-center space-x-2'
            >
              <Play className='h-4 w-4' />
              <span>시작</span>
            </Button>

            <Button
              onClick={handleSystemStop}
              disabled={systemStats.status !== 'running'}
              variant='outline'
              size='sm'
              className='flex items-center space-x-2'
            >
              <Square className='h-4 w-4' />
              <span>정지</span>
            </Button>
          </div>

          <div className='grid grid-cols-2 gap-2'>
            <Button
              onClick={start30MinTimer}
              disabled={is30MinTimerActive || systemStats.status !== 'running'}
              variant='outline'
              size='sm'
              className='flex items-center space-x-2'
            >
              <Clock className='h-4 w-4' />
              <span>30분 타이머</span>
            </Button>

            <Button
              onClick={stop30MinTimer}
              disabled={!is30MinTimerActive}
              variant='outline'
              size='sm'
              className='flex items-center space-x-2'
            >
              <Square className='h-4 w-4' />
              <span>타이머 중단</span>
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* 메뉴 항목들 */}
        <DropdownMenuItem className='cursor-pointer'>
          <User className='mr-2 h-4 w-4' />
          <span>프로필</span>
        </DropdownMenuItem>

        <DropdownMenuItem className='cursor-pointer'>
          <Shield className='mr-2 h-4 w-4' />
          <span>관리자 모드</span>
        </DropdownMenuItem>

        <DropdownMenuItem className='cursor-pointer'>
          <Activity className='mr-2 h-4 w-4' />
          <span>시스템 모니터링</span>
        </DropdownMenuItem>

        <DropdownMenuItem className='cursor-pointer'>
          <Settings className='mr-2 h-4 w-4' />
          <span>설정</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className='cursor-pointer text-red-600'>
          <LogOut className='mr-2 h-4 w-4' />
          <span>로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Named export와 default export
export { UnifiedProfileButton };
export default UnifiedProfileButton;
