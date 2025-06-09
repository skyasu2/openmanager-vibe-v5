/**
 * 🚀 Enhanced Toast System with Shadcn UI
 *
 * Shadcn UI Toast 컴포넌트를 활용한 개선된 알림 시스템
 * - Toast, Toaster 컴포넌트 사용
 * - 서버 모니터링에 최적화된 알림 타입
 * - 액션 버튼 및 자동 해제 기능
 */

'use client';

import React from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Server,
  Activity,
  Zap,
} from 'lucide-react';

export interface ServerAlert {
  id: string;
  serverId: string;
  serverName: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'response_time' | 'custom';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  resolved?: boolean;
  actionRequired?: boolean;
}

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class EnhancedToastSystem {
  // 서버 알림 표시
  static showServerAlert(alert: ServerAlert) {
    const { severity, type, message, serverName, actionRequired } = alert;

    const getIcon = () => {
      switch (severity) {
        case 'critical':
          return <XCircle className='h-4 w-4' />;
        case 'warning':
          return <AlertTriangle className='h-4 w-4' />;
        case 'info':
          return <Info className='h-4 w-4' />;
        default:
          return <Server className='h-4 w-4' />;
      }
    };

    const getVariant = (): 'default' | 'destructive' => {
      return severity === 'critical' ? 'destructive' : 'default';
    };

    const getDuration = () => {
      switch (severity) {
        case 'critical':
          return 0; // 수동으로만 닫기
        case 'warning':
          return 10000; // 10초
        case 'info':
          return 5000; // 5초
        default:
          return 5000;
      }
    };

    toast({
      title: `${serverName} - ${severity.toUpperCase()}`,
      description: message,
      variant: getVariant(),
      duration: getDuration(),
      action: actionRequired ? (
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            // 서버 상세 페이지로 이동 또는 액션 수행
            console.log(`서버 ${serverName} 상세 보기`);
          }}
        >
          상세 보기
        </Button>
      ) : undefined,
    });
  }

  // 성공 알림
  static showSuccess(
    title: string,
    description?: string,
    options?: Partial<ToastOptions>
  ) {
    toast({
      title: `✅ ${title}`,
      description,
      duration: options?.duration || 3000,
      action: options?.action ? (
        <Button variant='outline' size='sm' onClick={options.action.onClick}>
          {options.action.label}
        </Button>
      ) : undefined,
    });
  }

  // 오류 알림
  static showError(
    title: string,
    description?: string,
    options?: Partial<ToastOptions>
  ) {
    toast({
      title: `❌ ${title}`,
      description,
      variant: 'destructive',
      duration: options?.duration || 5000,
      action: options?.action ? (
        <Button variant='outline' size='sm' onClick={options.action.onClick}>
          {options.action.label}
        </Button>
      ) : undefined,
    });
  }

  // 정보 알림
  static showInfo(
    title: string,
    description?: string,
    options?: Partial<ToastOptions>
  ) {
    toast({
      title: `ℹ️ ${title}`,
      description,
      duration: options?.duration || 4000,
      action: options?.action ? (
        <Button variant='outline' size='sm' onClick={options.action.onClick}>
          {options.action.label}
        </Button>
      ) : undefined,
    });
  }

  // 경고 알림
  static showWarning(
    title: string,
    description?: string,
    options?: Partial<ToastOptions>
  ) {
    toast({
      title: `⚠️ ${title}`,
      description,
      duration: options?.duration || 6000,
      action: options?.action ? (
        <Button variant='outline' size='sm' onClick={options.action.onClick}>
          {options.action.label}
        </Button>
      ) : undefined,
    });
  }

  // 서버 상태 변경 알림
  static showServerStatusChange(
    serverName: string,
    oldStatus: string,
    newStatus: string,
    onViewDetails?: () => void
  ) {
    const isImprovement =
      (oldStatus === 'offline' && newStatus === 'online') ||
      (oldStatus === 'warning' && newStatus === 'online');

    const isDeterioration =
      (oldStatus === 'online' &&
        (newStatus === 'warning' || newStatus === 'offline')) ||
      (oldStatus === 'warning' && newStatus === 'offline');

    if (isImprovement) {
      this.showSuccess(
        `${serverName} 상태 개선`,
        `${oldStatus} → ${newStatus}`,
        {
          action: onViewDetails
            ? {
                label: '상세 보기',
                onClick: onViewDetails,
              }
            : undefined,
        }
      );
    } else if (isDeterioration) {
      this.showError(`${serverName} 상태 악화`, `${oldStatus} → ${newStatus}`, {
        action: onViewDetails
          ? {
              label: '상세 보기',
              onClick: onViewDetails,
            }
          : undefined,
      });
    } else {
      this.showInfo(`${serverName} 상태 변경`, `${oldStatus} → ${newStatus}`, {
        action: onViewDetails
          ? {
              label: '상세 보기',
              onClick: onViewDetails,
            }
          : undefined,
      });
    }
  }

  // 성능 메트릭 알림
  static showPerformanceAlert(
    serverName: string,
    metric: 'cpu' | 'memory' | 'disk',
    value: number,
    threshold: number,
    onOptimize?: () => void
  ) {
    const getMetricIcon = () => {
      switch (metric) {
        case 'cpu':
          return <Zap className='h-4 w-4' />;
        case 'memory':
          return <Activity className='h-4 w-4' />;
        case 'disk':
          return <Server className='h-4 w-4' />;
        default:
          return <AlertTriangle className='h-4 w-4' />;
      }
    };

    const getMetricName = () => {
      switch (metric) {
        case 'cpu':
          return 'CPU 사용률';
        case 'memory':
          return '메모리 사용률';
        case 'disk':
          return '디스크 사용률';
        default:
          return '리소스 사용률';
      }
    };

    const severity = value >= threshold * 1.2 ? 'critical' : 'warning';

    toast({
      title: `${serverName} - ${getMetricName()}`,
      description: `${getMetricName()}이 ${value}%로 임계값(${threshold}%)을 초과했습니다.`,
      variant: severity === 'critical' ? 'destructive' : 'default',
      duration: severity === 'critical' ? 0 : 8000,
      action: onOptimize ? (
        <Button variant='outline' size='sm' onClick={onOptimize}>
          최적화
        </Button>
      ) : undefined,
    });
  }

  // 배치 알림 (여러 서버 동시 알림)
  static showBatchAlert(
    title: string,
    servers: string[],
    severity: 'info' | 'warning' | 'critical',
    onViewAll?: () => void
  ) {
    const getIcon = () => {
      switch (severity) {
        case 'critical':
          return <XCircle className='h-4 w-4' />;
        case 'warning':
          return <AlertTriangle className='h-4 w-4' />;
        case 'info':
          return <Info className='h-4 w-4' />;
        default:
          return <Server className='h-4 w-4' />;
      }
    };

    toast({
      title: `${title} (${servers.length}대)`,
      description: `영향받는 서버: ${servers.slice(0, 3).join(', ')}${servers.length > 3 ? ` 외 ${servers.length - 3}대` : ''}`,
      variant: severity === 'critical' ? 'destructive' : 'default',
      duration: severity === 'critical' ? 0 : 10000,
      action: onViewAll ? (
        <Button variant='outline' size='sm' onClick={onViewAll}>
          전체 보기
        </Button>
      ) : undefined,
    });
  }

  // AI 분석 완료 알림
  static showAIAnalysisComplete(
    analysisType: string,
    insights: number,
    onViewResults?: () => void
  ) {
    toast({
      title: `🤖 AI 분석 완료 - ${analysisType}`,
      description: `${insights}개의 인사이트가 발견되었습니다.`,
      duration: 5000,
      action: onViewResults ? (
        <Button variant='outline' size='sm' onClick={onViewResults}>
          결과 보기
        </Button>
      ) : undefined,
    });
  }
}

export default EnhancedToastSystem;
export { EnhancedToastSystem };
