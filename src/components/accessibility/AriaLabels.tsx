/**
 * 🏷️ ARIA Labels - 완성된 접근성 레이블링 시스템
 *
 * Vercel 하이드레이션 안전:
 * - SSR 호환 ARIA 속성
 * - 동적 레이블 생성
 * - 다국어 지원 (한국어 우선)
 * - WCAG 2.1 완전 준수
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import { useAccessibility } from '../../context/AccessibilityProvider';

// 🌐 한국어 ARIA 레이블 사전
const ariaLabels = {
  // 네비게이션
  navigation: {
    main: '주요 네비게이션',
    breadcrumb: '현재 페이지 위치',
    pagination: '페이지 네비게이션',
    tabs: '탭 목록',
    menu: '메뉴',
    search: '검색',
  },

  // 서버 대시보드
  dashboard: {
    title: '서버 대시보드',
    serverGrid: '서버 목록 그리드',
    serverCard: '서버 카드',
    serverStatus: '서버 상태',
    serverMetrics: '서버 메트릭',
    cpuUsage: 'CPU 사용률',
    memoryUsage: '메모리 사용률',
    diskUsage: '디스크 사용률',
    networkUsage: '네트워크 사용률',
    uptime: '가동 시간',
    alerts: '알림',
    lastUpdate: '마지막 업데이트',
  },

  // 폼 요소
  form: {
    required: '필수 입력 항목',
    optional: '선택 입력 항목',
    invalid: '잘못된 입력',
    valid: '올바른 입력',
    loading: '로딩 중',
    submit: '제출',
    cancel: '취소',
    clear: '지우기',
    search: '검색',
    filter: '필터링',
  },

  // 상태 메시지
  status: {
    online: '온라인 상태',
    offline: '오프라인 상태',
    warning: '경고 상태',
    critical: '심각한 상태',
    loading: '데이터 로딩 중',
    error: '오류 발생',
    success: '성공',
    info: '정보',
  },

  // 액션
  action: {
    edit: '편집',
    delete: '삭제',
    view: '보기',
    download: '다운로드',
    upload: '업로드',
    refresh: '새로고침',
    settings: '설정',
    close: '닫기',
    expand: '확장',
    collapse: '축소',
    select: '선택',
    deselect: '선택 해제',
  },
} as const;

// 🎯 ARIA 레이블 Hook
export const useAriaLabels = () => {
  const { isClient, announce } = useAccessibility();

  // 동적 레이블 생성
  const generateLabel = useCallback(
    (key: string, context?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let label: unknown = ariaLabels;

      for (const k of keys) {
        if (label && typeof label === 'object' && k in label) {
          label = (label as Record<string, unknown>)[k];
        } else {
          return key; // 키를 찾을 수 없으면 원본 반환
        }
      }

      if (typeof label === 'string' && context) {
        // 템플릿 변수 치환
        return label.replace(/\{(\w+)\}/g, (match, variable) => {
          return context[variable]?.toString() || match;
        });
      }

      return typeof label === 'string' ? label : key;
    },
    []
  );

  // 서버 상태별 레이블
  const getServerStatusLabel = useCallback(
    (
      status: 'online' | 'offline' | 'warning' | 'critical',
      serverName?: string
    ): string => {
      const statusLabel = generateLabel(`status.${status}`);
      return serverName ? `${serverName} - ${statusLabel}` : statusLabel;
    },
    [generateLabel]
  );

  // 메트릭 레이블 생성
  const getMetricLabel = useCallback(
    (
      metric: 'cpu' | 'memory' | 'disk' | 'network',
      value: number,
      unit: '%' | 'GB' | 'MB' | 'KB' = '%'
    ): string => {
      const metricLabel = generateLabel(`dashboard.${metric}Usage`);
      return `${metricLabel}: ${value}${unit}`;
    },
    [generateLabel]
  );

  // 알림과 함께 레이블 사용
  const announceLabel = useCallback(
    (
      key: string,
      context?: Record<string, string | number>,
      priority: 'polite' | 'assertive' = 'polite'
    ) => {
      if (!isClient) return;

      const label = generateLabel(key, context);
      announce(label, priority);
    },
    [isClient, generateLabel, announce]
  );

  return {
    labels: ariaLabels,
    generateLabel,
    getServerStatusLabel,
    getMetricLabel,
    announceLabel,
  };
};

// 🏷️ ARIA 레이블 컴포넌트들

// 서버 카드용 ARIA 속성
interface ServerCardAriaProps {
  serverId: string;
  serverName: string;
  status: 'online' | 'offline' | 'warning' | 'critical';
  cpu: number;
  memory: number;
  disk: number;
  alerts: number;
  uptime: string;
}

export const useServerCardAria = (props: ServerCardAriaProps) => {
  const { getServerStatusLabel, getMetricLabel } = useAriaLabels();

  return useMemo(
    () => ({
      // 카드 전체
      card: {
        role: 'article',
        'aria-labelledby': `server-title-${props.serverId}`,
        'aria-describedby': `server-status-${props.serverId} server-metrics-${props.serverId}`,
      },

      // 서버 제목
      title: {
        id: `server-title-${props.serverId}`,
        'aria-label': `서버 ${props.serverName}`,
      },

      // 서버 상태
      status: {
        id: `server-status-${props.serverId}`,
        role: 'status',
        'aria-label': getServerStatusLabel(props.status, props.serverName),
        'aria-live': 'polite',
      },

      // 메트릭 영역
      metrics: {
        id: `server-metrics-${props.serverId}`,
        role: 'group',
        'aria-label': `${props.serverName} 서버 메트릭`,
      },

      // 개별 메트릭
      cpu: {
        'aria-label': getMetricLabel('cpu', props.cpu),
        role: 'progressbar',
        'aria-valuenow': props.cpu,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuetext': `CPU 사용률 ${props.cpu}%`,
      },

      memory: {
        'aria-label': getMetricLabel('memory', props.memory),
        role: 'progressbar',
        'aria-valuenow': props.memory,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuetext': `메모리 사용률 ${props.memory}%`,
      },

      disk: {
        'aria-label': getMetricLabel('disk', props.disk),
        role: 'progressbar',
        'aria-valuenow': props.disk,
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuetext': `디스크 사용률 ${props.disk}%`,
      },

      // 알림
      alerts: {
        'aria-label': `알림 ${props.alerts}개`,
        'aria-live': props.alerts > 0 ? 'assertive' : 'off',
      },

      // 업타임
      uptime: {
        'aria-label': `가동 시간: ${props.uptime}`,
        'aria-live': 'polite',
      },

      // 액션 버튼들
      actions: {
        view: {
          'aria-label': `${props.serverName} 서버 상세 보기`,
        },
        refresh: {
          'aria-label': `${props.serverName} 서버 데이터 새로고침`,
        },
        settings: {
          'aria-label': `${props.serverName} 서버 설정`,
        },
      },
    }),
    [props, getServerStatusLabel, getMetricLabel]
  );
};

// 대시보드용 ARIA 속성
interface DashboardAriaProps {
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  warningServers: number;
  isLoading: boolean;
}

export const useDashboardAria = (props: DashboardAriaProps) => {
  const { generateLabel } = useAriaLabels();

  return useMemo(
    () => ({
      // 메인 대시보드
      main: {
        id: 'main-content',
        role: 'main',
        'aria-label': generateLabel('dashboard.title'),
        'aria-busy': props.isLoading,
      },

      // 통계 영역
      stats: {
        role: 'region',
        'aria-label': '서버 통계',
        'aria-live': 'polite',
      },

      // 서버 그리드
      grid: {
        id: 'server-grid',
        role: 'grid',
        'aria-label': generateLabel('dashboard.serverGrid'),
        'aria-rowcount': Math.ceil(props.totalServers / 3), // 3열 가정
        'aria-colcount': 3,
        'aria-busy': props.isLoading,
      },

      // 로딩 상태
      loading: {
        role: 'status',
        'aria-label': generateLabel('status.loading'),
        'aria-live': 'polite',
      },

      // 통계 요약
      summary: {
        'aria-label': `총 서버 ${props.totalServers}대, 온라인 ${props.onlineServers}대, 오프라인 ${props.offlineServers}대, 경고 ${props.warningServers}대`,
        'aria-live': 'polite',
      },
    }),
    [props, generateLabel]
  );
};

// 폼 요소용 ARIA 속성 생성기
interface FormFieldAriaProps {
  id: string;
  label: string;
  required?: boolean;
  invalid?: boolean;
  errorMessage?: string;
  helpText?: string;
}

export const useFormFieldAria = (props: FormFieldAriaProps) => {
  const { generateLabel } = useAriaLabels();

  return useMemo(() => {
    const describedByIds: string[] = [];

    if (props.helpText) {
      describedByIds.push(`${props.id}-help`);
    }

    if (props.invalid && props.errorMessage) {
      describedByIds.push(`${props.id}-error`);
    }

    return {
      field: {
        id: props.id,
        'aria-labelledby': `${props.id}-label`,
        'aria-describedby':
          describedByIds.length > 0 ? describedByIds.join(' ') : undefined,
        'aria-required': props.required,
        'aria-invalid': props.invalid,
      },

      label: {
        id: `${props.id}-label`,
        htmlFor: props.id,
        children: (
          <>
            {props.label}
            {props.required && (
              <span title={generateLabel('form.required')} aria-hidden="true"> *</span>
            )}
          </>
        ),
      },

      help: props.helpText
        ? {
            id: `${props.id}-help`,
            children: props.helpText,
          }
        : undefined,

      error:
        props.invalid && props.errorMessage
          ? {
              id: `${props.id}-error`,
              role: 'alert',
              'aria-live': 'assertive',
              children: props.errorMessage,
            }
          : undefined,
    };
  }, [props, generateLabel]);
};

// 🎯 ARIA 레이블 유틸리티 컴포넌트
export const AriaLiveRegion: React.FC<{
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}> = ({ message, priority = 'polite', className = 'sr-only' }) => {
  const { isClient } = useAccessibility();

  if (!isClient || !message) return null;

  return (
    <output
      className={className}
      aria-live={priority}
      aria-atomic="true"
    >
      {message}
    </output>
  );
};

export default useAriaLabels;
