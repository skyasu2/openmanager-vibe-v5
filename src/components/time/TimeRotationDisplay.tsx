'use client';

import { useTimeControl } from '@/hooks/useTimeRotation';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  Pause, 
  Play, 
  Square, 
  Sun, 
  Moon, 
  Coffee,
  Briefcase,
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';

interface TimeRotationDisplayProps {
  className?: string;
  showControls?: boolean;
  compact?: boolean;
}

/**
 * 🕐 시간 회전 표시 컴포넌트
 * 
 * 24시간 데이터 회전 시스템의 현재 상태를 표시하고
 * 시간 제어 기능을 제공합니다.
 */
export function TimeRotationDisplay({ 
  className, 
  showControls = false, 
  compact = false 
}: TimeRotationDisplayProps) {
  const { 
    timeDisplay, 
    controlState, 
    actions,
    timeState 
  } = useTimeControl();
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 시간대별 아이콘
  const getTimeIcon = (hour: number) => {
    if (hour >= 6 && hour < 12) return Sun;        // 오전
    if (hour >= 12 && hour < 18) return Briefcase; // 오후 (업무시간)
    if (hour >= 18 && hour < 22) return Coffee;    // 저녁
    return Moon;                                    // 밤/새벽
  };
  
  // 시간대별 색상
  const getTimeColor = (hour: number) => {
    if (hour >= 6 && hour < 12) return 'text-yellow-600 bg-yellow-50';    // 오전
    if (hour >= 12 && hour < 18) return 'text-blue-600 bg-blue-50';       // 오후
    if (hour >= 18 && hour < 22) return 'text-orange-600 bg-orange-50';   // 저녁
    return 'text-indigo-600 bg-indigo-50';                                 // 밤
  };
  
  const TimeIcon = getTimeIcon(timeState.simulatedHour);
  const timeColorClass = getTimeColor(timeState.simulatedHour);
  
  // 컴팩트 모드
  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2',
        timeColorClass,
        className
      )}>
        <TimeIcon className="h-4 w-4" />
        <div className="text-sm font-medium">
          {timeDisplay.current}
        </div>
        <div className="text-xs opacity-75">
          {timeDisplay.cycle}
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      'rounded-xl border border-gray-200 bg-white shadow-sm',
      className
    )}>
      {/* 메인 시간 표시 */}
      <div 
        className={cn(
          'flex items-center justify-between p-4 cursor-pointer',
          showControls && 'border-b border-gray-100'
        )}
        onClick={() => showControls && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn('rounded-lg p-2', timeColorClass)}>
            <TimeIcon className="h-5 w-5" />
          </div>
          
          <div>
            <div className="text-lg font-bold text-gray-900">
              {timeDisplay.current}
            </div>
            <div className="text-sm text-gray-600">
              {timeDisplay.cycle} • {timeDisplay.progress} • {timeDisplay.status}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 상태 인디케이터 */}
          <div className={cn(
            'h-2 w-2 rounded-full',
            timeState.isActive 
              ? (timeState.isPaused ? 'bg-yellow-400' : 'bg-green-400')
              : 'bg-gray-400'
          )} />
          
          {showControls && (
            <ChevronDown 
              className={cn(
                'h-4 w-4 text-gray-400 transition-transform',
                isExpanded && 'transform rotate-180'
              )} 
            />
          )}
        </div>
      </div>
      
      {/* 제어 패널 */}
      {showControls && isExpanded && (
        <div className="p-4 space-y-4">
          {/* 기본 제어 */}
          <div className="flex items-center gap-2">
            <button
              onClick={actions.start}
              disabled={!controlState.canStart}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                controlState.canStart
                  ? 'bg-green-50 text-green-700 hover:bg-green-100'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              )}
            >
              <Play className="h-4 w-4" />
              시작
            </button>
            
            <button
              onClick={actions.pause}
              disabled={!controlState.canPause}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                controlState.canPause
                  ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              )}
            >
              <Pause className="h-4 w-4" />
              일시정지
            </button>
            
            <button
              onClick={actions.resume}
              disabled={!controlState.canResume}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                controlState.canResume
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              )}
            >
              <RotateCcw className="h-4 w-4" />
              재개
            </button>
            
            <button
              onClick={actions.stop}
              disabled={!controlState.canStop}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                controlState.canStop
                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              )}
            >
              <Square className="h-4 w-4" />
              중지
            </button>
          </div>
          
          {/* 프리셋 시간 점프 */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">
              시간 점프 (테스트용)
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={actions.jumpToPresets.morning}
                className="flex flex-col items-center gap-1 rounded-lg bg-yellow-50 px-3 py-2 text-xs hover:bg-yellow-100 transition-colors"
              >
                <Sun className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-800">오전 8시</span>
                <span className="text-yellow-600">업무시작</span>
              </button>
              
              <button
                onClick={actions.jumpToPresets.peak}
                className="flex flex-col items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs hover:bg-blue-100 transition-colors"
              >
                <Briefcase className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800">오후 3시</span>
                <span className="text-blue-600">최대피크</span>
              </button>
              
              <button
                onClick={actions.jumpToPresets.evening}
                className="flex flex-col items-center gap-1 rounded-lg bg-orange-50 px-3 py-2 text-xs hover:bg-orange-100 transition-colors"
              >
                <Coffee className="h-4 w-4 text-orange-600" />
                <span className="text-orange-800">저녁 7시</span>
                <span className="text-orange-600">저녁시간</span>
              </button>
              
              <button
                onClick={actions.jumpToPresets.night}
                className="flex flex-col items-center gap-1 rounded-lg bg-indigo-50 px-3 py-2 text-xs hover:bg-indigo-100 transition-colors"
              >
                <Moon className="h-4 w-4 text-indigo-600" />
                <span className="text-indigo-800">새벽 2시</span>
                <span className="text-indigo-600">백업시간</span>
              </button>
            </div>
          </div>
          
          {/* 설명 */}
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <div className="font-medium mb-1">🕐 시간 시뮬레이션 정보</div>
            <div>• 30초 실제 시간 = 1시간 시뮬레이션</div>
            <div>• 전체 24시간 = 12분 실제 시간</div>
            <div>• 서버 메트릭은 시간대별로 자동 조정됩니다</div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 🎯 간단한 시간 표시기 (헤더용)
 */
export function TimeRotationHeader({ className }: { className?: string }) {
  return (
    <TimeRotationDisplay 
      className={className}
      showControls={false}
      compact={true}
    />
  );
}

/**
 * 🎛️ 시간 제어 패널 (관리자용)
 */
export function TimeRotationControlPanel({ className }: { className?: string }) {
  return (
    <TimeRotationDisplay 
      className={className}
      showControls={true}
      compact={false}
    />
  );
}