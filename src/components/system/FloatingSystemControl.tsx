'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Power,
  Play,
  StopCircle,
  ChevronUp,
  ChevronDown,
  Settings,
  Activity,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { timerManager } from '../../utils/TimerManager';

interface SystemHealth {
  hasError: boolean;
  errorType: 'critical' | 'warning' | null;
  errorMessage: string;
  lastCheck: number;
}

interface FloatingSystemControlProps {
  systemState: any;
  aiAgentState: any;
  isSystemActive: boolean;
  isSystemPaused: boolean;
  onStartSystem: () => Promise<void>;
  onStopSystem: () => Promise<void>;
  onResumeSystem: () => Promise<void>;
}

export default function FloatingSystemControl({
  systemState,
  aiAgentState,
  isSystemActive,
  isSystemPaused,
  onStartSystem,
  onStopSystem,
  onResumeSystem,
}: FloatingSystemControlProps) {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    hasError: false,
    errorType: null,
    errorMessage: '',
    lastCheck: Date.now(),
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  // 시스템 건강성 체크
  const checkSystemHealth = useCallback(() => {
    try {
      const hasAIError =
        systemState?.state === 'error' || aiAgentState?.state === 'error';
      const isSystemDown = !isSystemActive && !isSystemPaused;

      let errorType: 'critical' | 'warning' | null = null;
      let errorMessage = '';

      if (hasAIError) {
        errorType = 'critical';
        errorMessage = 'AI 에이전트 엔진에 문제가 발생했습니다';
      } else if (isSystemDown) {
        errorType = 'warning';
        errorMessage = '시스템이 비활성 상태입니다';
      }

      const hasError = errorType !== null;

      setSystemHealth({
        hasError,
        errorType,
        errorMessage,
        lastCheck: Date.now(),
      });

      // 에러 발생 시 자동으로 상단으로 이동
      if (hasError && isMinimized) {
        setIsMinimized(false);
        setIsExpanded(true);
      }
    } catch (error) {
      console.error('시스템 건강성 체크 실패:', error);
    }
  }, [systemState, aiAgentState, isSystemActive, isSystemPaused, isMinimized]);

  useEffect(() => {
    checkSystemHealth();

    // TimerManager를 사용한 헬스체크
    timerManager.register({
      id: 'floating-system-health-check',
      callback: checkSystemHealth,
      interval: 5000,
      priority: 'high',
      enabled: true,
    });

    return () => {
      timerManager.unregister('floating-system-health-check');
    };
  }, [checkSystemHealth]);

  const getStatusColor = () => {
    if (systemHealth.hasError) {
      return systemHealth.errorType === 'critical'
        ? 'bg-red-500'
        : 'bg-yellow-500';
    }
    return isSystemActive ? 'bg-green-500' : 'bg-gray-500';
  };

  const getStatusText = () => {
    if (systemHealth.hasError) {
      return systemHealth.errorMessage;
    }
    if (isSystemActive) return '시스템 정상 운영 중';
    if (isSystemPaused) return '시스템 일시 정지됨';
    return '시스템 시작이 필요합니다';
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) setIsExpanded(false);
  };

  // 플로팅 시스템 제어판 제거됨 (웹 알람 삭제에 따라)
  return null;
}
