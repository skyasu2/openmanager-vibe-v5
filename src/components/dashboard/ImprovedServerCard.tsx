/**
 * 🌟 Improved Server Card v3.1 - AI 교차검증 개선판
 *
 * 기존 문제점 해결 + AI 교차검증 개선사항 반영:
 * - ✅ 가독성 대폭 향상 (메트릭 크기 증가, 색상 개선)
 * - ✅ 정보 밀도 최적화 (중요 정보 우선 표시)
 * - ✅ 인터랙션 강화 (실시간 피드백, 애니메이션)
 * - ✅ 호버 블러 효과 제거 (사용자 피드백 반영)
 * - ✅ 그래프 색상 직관적 매칭 (Critical→빨강, Warning→주황, Normal→녹색)
 * - ✅ 24시간 실시간 시간 표시
 * - 🆕 에러 바운더리 적용 (Codex 제안)
 * - 🆕 접근성 개선 강화 (Gemini 제안)
 * - 🆕 메트릭 값 검증 일관성 (Codex 제안)
 * - ✅ 반응형 디자인 완전 지원
 */

import React, { useCallback, useMemo } from 'react'; // 🧪 테스트 환경에서 JSX 트랜스폼을 위해 명시적 import 필요
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Server,
  Database,
  Globe,
  HardDrive,
  Archive,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
} from 'lucide-react';
import { memo, useEffect, useState, useRef, type FC, Fragment } from 'react';

// 공통 컴포넌트 import
import { ServerStatusIndicator } from '../shared/ServerStatusIndicator';
import { ServerMetricsChart } from '../shared/ServerMetricsChart';
import type { Server as ServerType } from '../../types/server';
import {
  getSafeServicesLength,
  getSafeValidServices,
  vercelSafeLog,
  isValidServer,
} from '@/lib/vercel-safe-utils';
import ServerCardErrorBoundary from '../error/ServerCardErrorBoundary';
import { useFixed24hMetrics } from '@/hooks/useFixed24hMetrics';
import { getServerStatusTheme, LAYOUT } from '../../styles/design-constants';

export interface ImprovedServerCardProps {
  server: ServerType;
  onClick: (server: ServerType) => void;
  variant?: 'compact' | 'standard' | 'detailed';
  showRealTimeUpdates?: boolean;
  index?: number;
  enableProgressiveDisclosure?: boolean;
}

const ImprovedServerCardInner: FC<ImprovedServerCardProps> = memo(
  ({
    server,
    onClick,
    variant = 'standard',
    showRealTimeUpdates = true,
    enableProgressiveDisclosure = true,
  }) => {
    // 🛡️ 5층 방어 시스템 Layer 1: 서버 객체 존재성 검증 (베르셀 서버리스 환경 대응)
    // TypeError: Cannot read properties of undefined (reading 'length') 완전 방지
    // 🛡️ 5층 방어 시스템 Layer 2: 필수 서버 속성 안전성 검증
    const safeServer = useMemo(
      () => ({
        id: server?.id || 'unknown',
        name: server?.name || '알 수 없는 서버',
        status: server?.status || 'unknown', // 🔧 수정: 'offline' → 'unknown' (기본값 변경)
        type: server.type || 'server',
        location: server.location || '서울',
        os: server.os || 'Ubuntu 22.04',
        ip: server.ip || '192.168.1.1',
        uptime: server.uptime || 0,
        cpu: typeof server.cpu === 'number' ? server.cpu : 50,
        memory: typeof server.memory === 'number' ? server.memory : 50,
        disk: typeof server.disk === 'number' ? server.disk : 30,
        network: typeof server.network === 'number' ? server.network : 25,
        alerts: server.alerts || 0,
        services: Array.isArray(server.services) ? server.services : [],
        lastUpdate: server.lastUpdate || new Date(),
      }),
      [server]
    );

    // 🚀 성능 추적 활성화 (개발환경 전용)

    const [isHovered, setIsHovered] = useState(false);
    const [showSecondaryInfo, setShowSecondaryInfo] = useState(false);
    const [showTertiaryInfo, setShowTertiaryInfo] = useState(false);
    const isMountedRef = useRef(true); // 비동기 상태 관리 개선 (Codex 제안)

    // 🎯 24시간 고정 데이터 + 1분 미세 변동 (KST 동기화)
    const { currentMetrics } = useFixed24hMetrics(server.id, 60000); // 1분 간격 업데이트

    // 🛡️ 메트릭 안전성 검증 (고정 데이터 기반)
    const realtimeMetrics = useMemo(() => {
      try {
        if (currentMetrics) {
          return {
            cpu: currentMetrics.cpu,
            memory: currentMetrics.memory,
            disk: currentMetrics.disk,
            network: currentMetrics.network,
          };
        }
        // 초기 로딩 시 서버 기본값 사용
        return {
          cpu: safeServer.cpu,
          memory: safeServer.memory,
          disk: safeServer.disk,
          network: safeServer.network,
        };
      } catch (error) {
        console.error(
          '⚠️ ImprovedServerCard: 메트릭 로드 실패, 안전한 기본값 사용',
          error
        );
        return {
          cpu: 50,
          memory: 50,
          disk: 30,
          network: 25,
        };
      }
    }, [
      currentMetrics,
      safeServer.cpu,
      safeServer.memory,
      safeServer.disk,
      safeServer.network,
    ]);

    // 컴포넌트 언마운트 추적
    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    // ✅ 실시간 메트릭 업데이트는 useFixed24hMetrics 훅에서 자동 처리됨
    // 기존 setInterval 로직 제거 (24시간 고정 데이터 시스템으로 대체)

    // 🎨 Material Design 3 토큰 기반 서버 상태별 테마 (5층 방어 시스템 적용)
    const statusTheme = useMemo(() => {
      try {
        // 서버 상태를 Material Design 3 표준 상태로 매핑 (베르셀 환경 안전성)
        const theme = getServerStatusTheme(safeServer.status); // 🔧 수정: 타입 어설션 (타입 통합 호환성)

        return {
          // Material Design 3 Surface 기반 배경 - 상태별 색상 적용
          cardBg: theme.background, // 상태별 배경 그라데이션
          cardBorder: theme.border, // 상태별 테두리
          cardStyle: {
            backgroundColor: 'transparent', // Tailwind CSS로 배경 처리
            borderColor: 'transparent', // Tailwind CSS로 테두리 처리
            color: 'inherit',
          },

          // 호버 효과 - 상태별 색상 반영
          hoverStyle: {
            borderColor: 'transparent',
            boxShadow:
              safeServer.status === 'online' // 🔧 수정: normalizedStatus → safeServer.status
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(16, 185, 129, 0.125)'
                : safeServer.status === 'warning'
                  ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(245, 158, 11, 0.125)'
                  : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(239, 68, 68, 0.125)',
          },

          // 상태 표시 - design-constants 사용
          statusColor: theme.statusColor,
          statusIcon:
            safeServer.status === 'online' ? ( // 🔧 수정: normalizedStatus → safeServer.status
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
            ),
          statusText:
            safeServer.status === 'online' // 🔧 수정: normalizedStatus → safeServer.status
              ? '정상'
              : safeServer.status === 'warning'
                ? '경고'
                : '심각',

          // 실시간 펄스 - 상태별 색상
          pulse: {
            backgroundColor: theme.accentColor,
          },

          // 액센트 색상 - 상태별 색상
          accent: {
            color: theme.accentColor,
          },
        };
      } catch (error) {
        console.error('⚠️ statusTheme 생성 실패, 기본 테마 사용', error);
        return {
          cardBg: 'bg-gray-50',
          cardBorder: 'border-gray-200',
          cardStyle: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            color: 'inherit',
          },
          hoverStyle: {
            borderColor: 'transparent',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          },
          statusColor: { backgroundColor: '#f3f4f6', color: '#374151' },
          statusIcon: <AlertCircle className="h-4 w-4" aria-hidden="true" />,
          statusText: '오류',
          pulse: { backgroundColor: '#6b7280' },
          accent: { color: '#6b7280' },
        };
      }
    }, [safeServer.status]); // 상태별 의존성 최적화 (5층 방어 시스템 적용)

    // 🚀 서버 타입별 아이콘 메모이제이션 최적화 (5층 방어 시스템 적용)
    const serverIcon = useMemo(() => {
      try {
        switch (safeServer.type) {
          case 'web':
            return <Globe className="h-5 w-5" aria-hidden="true" />;
          case 'database':
            return <Database className="h-5 w-5" aria-hidden="true" />;
          case 'storage':
            return <HardDrive className="h-5 w-5" aria-hidden="true" />;
          case 'backup':
            return <Archive className="h-5 w-5" aria-hidden="true" />;
          case 'app':
          default:
            return <Server className="h-5 w-5" aria-hidden="true" />;
        }
      } catch (error) {
        console.error('⚠️ serverIcon 생성 실패, 기본 아이콘 사용', error);
        return <Server className="h-5 w-5" aria-hidden="true" />;
      }
    }, [safeServer.type]);

    // 🚀 OS별 아이콘/이모지 메모이제이션 최적화 (5층 방어 시스템 적용)
    const osIcon = useMemo(() => {
      try {
        const os = (safeServer.os || '').toLowerCase();

        if (
          os.includes('ubuntu') ||
          os.includes('debian') ||
          os.includes('linux')
        ) {
          return (
            <span
              className="text-base"
              title={safeServer.os}
              aria-label={`운영체제: ${safeServer.os}`}
            >
              🐧
            </span>
          );
        } else if (
          os.includes('centos') ||
          os.includes('red hat') ||
          os.includes('rhel')
        ) {
          return (
            <span
              className="text-base"
              title={safeServer.os}
              aria-label={`운영체제: ${safeServer.os}`}
            >
              🎩
            </span>
          );
        } else if (os.includes('windows')) {
          return (
            <span
              className="text-base"
              title={safeServer.os}
              aria-label={`운영체제: ${safeServer.os}`}
            >
              🪟
            </span>
          );
        }
        return null;
      } catch (error) {
        console.error('⚠️ osIcon 생성 실패', error);
        return null;
      }
    }, [safeServer.os]);

    // Material Design 3 배리언트별 스타일 (Typography 토큰 기반) - 메모이제이션 최적화
    const variantStyles = useMemo(() => {
      switch (variant) {
        case 'compact':
          return {
            container: `${LAYOUT.padding.card.mobile} min-h-[300px]`,
            titleSize: 'text-lg font-medium',
            metricSize: 'text-sm font-medium',
            progressHeight: 'h-2',
            spacing: 'space-y-3',
            showServices: true,
            maxServices: 2,
            showDetails: false,
          };
        case 'detailed':
          return {
            container: `${LAYOUT.padding.card.desktop} min-h-[380px]`,
            titleSize: 'text-xl font-semibold',
            metricSize: 'text-base font-normal',
            progressHeight: 'h-3',
            spacing: 'space-y-4',
            showServices: true,
            maxServices: 4,
            showDetails: true,
          };
        default: // standard
          return {
            container: `${LAYOUT.padding.card.tablet} min-h-[340px]`,
            titleSize: 'text-lg font-semibold',
            metricSize: 'text-base font-normal',
            progressHeight: 'h-2.5',
            spacing: 'space-y-3',
            showServices: true,
            maxServices: 3,
            showDetails: true,
          };
      }
    }, [variant]);

    // 🔄 Progressive Disclosure 호버 핸들러
    const handleMouseEnter = useCallback(() => {
      setIsHovered(true);
      if (enableProgressiveDisclosure) {
        setShowSecondaryInfo(true);
      }
    }, [enableProgressiveDisclosure]);

    const handleMouseLeave = useCallback(() => {
      setIsHovered(false);
      if (enableProgressiveDisclosure && !showTertiaryInfo) {
        setShowSecondaryInfo(false);
      }
    }, [enableProgressiveDisclosure, showTertiaryInfo]);

    // 🎯 Progressive Disclosure 클릭 토글
    const handleExpandToggle = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowTertiaryInfo((prev) => !prev);
        if (!showTertiaryInfo) {
          setShowSecondaryInfo(true);
        }
      },
      [showTertiaryInfo]
    );

    // 🚀 클릭 핸들러 메모이제이션 (5층 방어 시스템 적용)
    const handleClick = useCallback(() => {
      try {
        // 안전한 서버 객체로 콜백 호출
        onClick(safeServer);
      } catch (error) {
        console.error('⚠️ handleClick 실행 실패', error);
      }
    }, [safeServer, onClick]); // safeServer.id 대신 전체 객체를 의존성에 포함

    // 🎯 키보드 접근성 개선 (Gemini 제안)
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      },
      [handleClick]
    );

    return (
      <button
        type="button"
        className={`md3-state-layer md3-card-hover group relative w-full cursor-pointer overflow-hidden rounded-2xl border-2 text-left ${statusTheme.cardBg} ${statusTheme.cardBorder} ${variantStyles.container} focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:ring-offset-2`}
        style={{
          ...statusTheme.cardStyle,
          transition: `all ${'300ms'} ${'cubic-bezier(0.2, 0.0, 0, 1.0)'}`,
        }}
        onMouseEnter={(e) => {
          handleMouseEnter();
          Object.assign(e.currentTarget.style, statusTheme.hoverStyle);
        }}
        onMouseLeave={(e) => {
          handleMouseLeave();
          Object.assign(e.currentTarget.style, statusTheme.cardStyle);
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`${safeServer.name} 서버 - ${statusTheme.statusText} 상태. CPU ${Math.round((realtimeMetrics && realtimeMetrics.cpu) || 50)}%, 메모리 ${Math.round((realtimeMetrics && realtimeMetrics.memory) || 50)}% 사용 중`}
        tabIndex={0}
      >
        {/* 실시간 활동 인디케이터 */}
        {showRealTimeUpdates && (
          <div className="absolute right-3 top-3 z-10" aria-hidden="true">
            <div
              className="h-2 w-2 animate-pulse rounded-full shadow-lg"
              style={statusTheme.pulse}
              title="실시간 업데이트 중"
            />
          </div>
        )}

        {/* 헤더 - Progressive Disclosure 컨트롤 추가 */}
        <header className="mb-4 flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className="rounded-lg p-2.5 shadow-sm"
              style={statusTheme.statusColor}
              role="img"
              aria-label={`서버 타입: ${safeServer.type}`}
            >
              {serverIcon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3
                  className={`${variantStyles.titleSize} truncate`}
                  style={{ color: statusTheme.cardStyle.color }}
                  id={`server-${safeServer.id}-title`}
                >
                  {safeServer.name}
                </h3>
                {osIcon}
              </div>
              <div
                className={`flex items-center gap-2 ${'text-sm font-medium'}`}
                style={statusTheme.accent}
              >
                <MapPin className="h-3 w-3" aria-hidden="true" />
                <span aria-label="서버 위치">{safeServer.location}</span>
                {variantStyles.showDetails && (
                  <>
                    <span aria-hidden="true">•</span>
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span aria-label="현재 시간">
                      {new Date().toLocaleTimeString('ko-KR', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ServerStatusIndicator
              status={safeServer.status}
              size="md"
              showText={true}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium shadow-sm"
            />

            {/* Progressive Disclosure 확장/축소 버튼 */}
            {enableProgressiveDisclosure && (
              <button
                type="button"
                onClick={handleExpandToggle}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-200 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label={
                  showTertiaryInfo ? '상세 정보 숨기기' : '상세 정보 보기'
                }
                title={showTertiaryInfo ? '상세 정보 숨기기' : '상세 정보 보기'}
              >
                {showTertiaryInfo ? (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                )}
              </button>
            )}
          </div>
        </header>

        {/* 📈 Progressive Disclosure 메트릭 섹션 - 3단계 정보 공개 */}
        <section
          className={variantStyles.spacing}
          aria-labelledby={`server-${safeServer.id}-title`}
        >
          {/* 🎯 Level 1: 핵심 메트릭 (CPU, 메모리) - 상시 표시 */}
          <div className="space-y-3">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-3 w-3 text-red-500" aria-hidden="true" />
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                핵심 지표
              </h4>
              <div className="ml-auto text-xs text-gray-500">Level 1</div>
            </div>
            <div
              className="grid grid-cols-2 gap-6"
              role="group"
              aria-label="주요 서버 메트릭"
            >
              <div className="flex transform justify-center transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-lg">
                <ServerMetricsChart
                  type="cpu"
                  value={(realtimeMetrics && realtimeMetrics.cpu) || 50}
                  status={safeServer.status}
                  size="md"
                  showLabel={true}
                />
              </div>
              <div className="flex transform justify-center transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-lg">
                <ServerMetricsChart
                  type="memory"
                  value={(realtimeMetrics && realtimeMetrics.memory) || 50}
                  status={safeServer.status}
                  size="md"
                  showLabel={true}
                />
              </div>
            </div>
          </div>

          {/* 🔹 Level 2: 보조 메트릭 (디스크, 네트워크) - 호버 시 표시 */}
          <div
            className={`space-y-3 overflow-hidden transition-all duration-300 ${
              showSecondaryInfo
                ? 'max-h-96 translate-y-0 transform opacity-100'
                : 'max-h-0 -translate-y-4 transform opacity-0'
            }`}
          >
            <div className="mb-2 flex items-center gap-2">
              <HardDrive className="h-3 w-3 text-blue-400" aria-hidden="true" />
              <h4 className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                보조 지표
              </h4>
              <div className="ml-auto text-xs text-gray-500">Level 2</div>
            </div>
            <div
              className="grid grid-cols-2 gap-4 opacity-90"
              role="group"
              aria-label="보조 서버 메트릭"
            >
              <div className="flex transform justify-center transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 hover:opacity-100 hover:shadow-md">
                <ServerMetricsChart
                  type="disk"
                  value={(realtimeMetrics && realtimeMetrics.disk) || 30}
                  status={safeServer.status}
                  size="md"
                  showLabel={true}
                />
              </div>
              <div className="flex transform justify-center transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 hover:opacity-100 hover:shadow-md">
                <ServerMetricsChart
                  type="network"
                  value={(realtimeMetrics && realtimeMetrics.network) || 25}
                  status={safeServer.status}
                  size="md"
                  showLabel={true}
                />
              </div>
            </div>
          </div>

          {/* 🔸 Level 3: 상세 정보 (운영체제, 업타임, IP 등) - 클릭 시 표시 */}
          <div
            className={`space-y-4 overflow-hidden transition-all duration-500 ${
              showTertiaryInfo
                ? 'max-h-96 translate-y-0 transform opacity-100'
                : 'max-h-0 -translate-y-8 transform opacity-0'
            }`}
          >
            <div className="mb-3 flex items-center gap-2 border-t border-gray-200/50 pt-4">
              <Zap className="h-3 w-3 text-purple-400" aria-hidden="true" />
              <h4 className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">
                상세 정보
              </h4>
              <div className="ml-auto text-xs text-gray-500">Level 3</div>
            </div>

            {/* 운영체제 및 기본 정보 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    OS
                  </div>
                  <div className="font-medium text-gray-700">
                    {server.os || 'Ubuntu 22.04'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    업타임
                  </div>
                  <div className="font-medium text-gray-700">
                    {server.uptime || '72d 14h 23m'}
                  </div>
                </div>
              </div>
            </div>

            {/* IP 및 네트워크 정보 */}
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  IP 주소
                </span>
                <span className="font-mono font-medium text-gray-700">
                  {server.ip || `192.168.1.${10 + (parseInt(server.id) % 240)}`}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  마지막 업데이트
                </span>
                <span className="font-medium text-gray-700">
                  {new Date().toLocaleString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* 성능 요약 */}
            <div className="rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-3">
              <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                성능 요약
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="flex flex-col items-center">
                  <ServerMetricsChart
                    type="cpu"
                    value={Math.round(
                      (realtimeMetrics && realtimeMetrics.cpu) || 50
                    )}
                    status={safeServer.status}
                    size="sm"
                    showLabel={true}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <ServerMetricsChart
                    type="memory"
                    value={Math.round(
                      (realtimeMetrics && realtimeMetrics.memory) || 50
                    )}
                    status={safeServer.status}
                    size="sm"
                    showLabel={true}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <ServerMetricsChart
                    type="disk"
                    value={Math.round(
                      (realtimeMetrics && realtimeMetrics.disk) || 30
                    )}
                    status={safeServer.status}
                    size="sm"
                    showLabel={true}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <ServerMetricsChart
                    type="network"
                    value={Math.round(
                      (realtimeMetrics && realtimeMetrics.network) || 25
                    )}
                    status={safeServer.status}
                    size="sm"
                    showLabel={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 서비스 상태 - Progressive Disclosure Level 2에 포함 (5층 방어 시스템 완전 적용) */}
        {variantStyles.showServices &&
          (() => {
            try {
              // 🛡️ 5층 방어 시스템 완전 적용 - safeServer 사용
              if (!isValidServer(safeServer)) {
                console.warn('⚠️ Layer 5: safeServer 객체가 유효하지 않음');
                return false;
              }
              const servicesLength = getSafeServicesLength(safeServer);
              if (typeof servicesLength !== 'number') {
                console.warn('⚠️ Layer 5: servicesLength가 숫자가 아님');
                return false;
              }
              return servicesLength > 0;
            } catch (error) {
              console.error('❌ Layer 5: validServices 체크 중 에러:', error);
              return false;
            }
          })() &&
          (showSecondaryInfo || !enableProgressiveDisclosure) && (
            <footer
              className={`mt-4 transition-all duration-300 ${
                showSecondaryInfo || !enableProgressiveDisclosure
                  ? 'translate-y-0 transform opacity-100'
                  : '-translate-y-2 transform opacity-0'
              }`}
              role="complementary"
              aria-label="서비스 상태 목록"
            >
              <div className="flex flex-wrap gap-2">
                {(() => {
                  try {
                    // 🛡️ 5층 방어 시스템 완전 적용 - 서비스 리스트 안전 생성
                    const validServices = getSafeValidServices(safeServer);
                    if (!Array.isArray(validServices)) {
                      console.error('⚠️ Layer 5: validServices가 배열이 아님');
                      return [];
                    }

                    const slicedServices = validServices.slice(
                      0,
                      variantStyles.maxServices
                    );
                    return slicedServices
                      .map((service, idx) => {
                        // 각 서비스 객체 안전성 검증
                        if (!service || typeof service !== 'object') {
                          console.warn(
                            `⚠️ Layer 5: 서비스 ${idx} 유효하지 않음`
                          );
                          return null;
                        }

                        const serviceName = service.name || `서비스 ${idx + 1}`;
                        const serviceStatus = service.status || 'unknown';

                        return (
                          <div
                            key={`${safeServer.id}-service-${idx}`}
                            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium shadow-sm transition-colors ${
                              serviceStatus === 'running'
                                ? 'border-green-300 bg-green-50 text-green-700'
                                : serviceStatus === 'stopped'
                                  ? 'border-red-300 bg-red-50 text-red-700'
                                  : 'border-yellow-300 bg-yellow-50 text-yellow-700'
                            }`}
                            role="status"
                            aria-label={`${serviceName} 서비스: ${
                              serviceStatus === 'running'
                                ? '실행중'
                                : serviceStatus === 'stopped'
                                  ? '중단'
                                  : '경고'
                            }`}
                          >
                            <div
                              className={`h-1.5 w-1.5 rounded-full ${
                                serviceStatus === 'running'
                                  ? 'bg-green-500'
                                  : serviceStatus === 'stopped'
                                    ? 'bg-red-500'
                                    : 'bg-yellow-500'
                              }`}
                              aria-hidden="true"
                            />
                            <span>{serviceName}</span>
                          </div>
                        );
                      })
                      .filter(Boolean); // null 요소 제거
                  } catch (error) {
                    console.error('⚠️ Layer 5: 서비스 렌더링 실패', error);
                    return [];
                  }
                })()}
                {(() => {
                  try {
                    // 🛡️ 5층 방어 시스템 완전 적용 - remainingServices 안전 계산
                    if (!isValidServer(safeServer)) {
                      vercelSafeLog(
                        'Invalid safeServer object in ImprovedServerCard',
                        safeServer
                      );
                      return null;
                    }

                    // 서비스 수 안전 계산
                    const validServicesCount =
                      getSafeServicesLength(safeServer);
                    if (
                      typeof validServicesCount !== 'number' ||
                      isNaN(validServicesCount)
                    ) {
                      console.warn(
                        '⚠️ Layer 5: validServicesCount가 유효한 숫자가 아님'
                      );
                      return null;
                    }

                    const maxServices = variantStyles.maxServices || 3;
                    const remainingCount = validServicesCount - maxServices;

                    if (remainingCount <= 0) return null;

                    return (
                      <div
                        className="flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-500"
                        aria-label={`${remainingCount}개 서비스 더 있음`}
                      >
                        +{Math.max(0, remainingCount)} more
                      </div>
                    );
                  } catch (error) {
                    console.error(
                      '❌ Layer 5: remainingServices 렌더링 중 에러:',
                      error
                    );
                    return null;
                  }
                })()}
              </div>
            </footer>
          )}

        {/* 호버 효과 - 블러 효과 제거됨 (사용자 피드백 반영) */}
        <Fragment>
          {isHovered && (
            <div
              className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 to-purple-500/5"
              aria-hidden="true"
            />
          )}
        </Fragment>
      </button>
    );
  }
);

ImprovedServerCardInner.displayName = 'ImprovedServerCardInner';

// 🛡️ 에러 바운더리로 감싼 최종 컴포넌트 (Codex 제안 반영)
const ImprovedServerCard: FC<ImprovedServerCardProps> = ({
  server,
  ...props
}) => {
  // 서버 객체가 유효하지 않으면 안전한 로딩 카드 표시
  const _isValidServerObject =
    server && typeof server === 'object' && server.id;

  if (!_isValidServerObject) {
    console.warn(
      '⚠️ ImprovedServerCard Layer 1: 서버 객체가 유효하지 않음 - 안전한 로딩 카드 표시',
      {
        server: server ? 'exists' : 'null/undefined',
        type: typeof server,
        hasId: server?.id ? 'yes' : 'no',
      }
    );
    return (
      <div className="animate-pulse rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-600"></div>
            <div className="h-3 w-1/2 rounded bg-gray-300 dark:bg-gray-600"></div>
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          서버 데이터 로딩 중... (Layer 1 Safe Mode)
        </div>
      </div>
    );
  }

  return (
    <ServerCardErrorBoundary>
      <ImprovedServerCardInner server={server} {...props} />
    </ServerCardErrorBoundary>
  );
};

ImprovedServerCard.displayName = 'ImprovedServerCard';

export default ImprovedServerCard;
