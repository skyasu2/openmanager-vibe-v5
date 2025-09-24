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
import dynamic from 'next/dynamic';
import { memo, useCallback, useEffect, useState, useMemo, useRef, type FC, Fragment } from 'react';
import type { Server as ServerType } from '../../types/server';
import { ServerCardLineChart } from '../shared/ServerMetricsLineChart';
import { usePerformanceTracking } from '@/utils/performance';
import ServerCardErrorBoundary from '../error/ServerCardErrorBoundary';
import { validateMetricValue, validateServerMetrics, generateSafeMetricValue, type MetricType } from '../../utils/metricValidation';
import { getServerStatusTheme, getTypographyClass, COMMON_ANIMATIONS, LAYOUT, type ServerStatus } from '../../styles/design-constants';
// 🚀 Vercel 호환 접근성 기능 추가
import { useAccessibilityOptional } from '@/context/AccessibilityProvider';
import { useServerCardAria } from '../accessibility/AriaLabels';

interface ImprovedServerCardProps {
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
    index = 0,
    enableProgressiveDisclosure = true,
  }) => {
    // 🚀 성능 추적 활성화 (개발환경 전용)
    const performanceStats = usePerformanceTracking(`ImprovedServerCard-${server.id}`);
    
    const [isHovered, setIsHovered] = useState(false);
    const [showSecondaryInfo, setShowSecondaryInfo] = useState(false);
    const [showTertiaryInfo, setShowTertiaryInfo] = useState(false);
    const isMountedRef = useRef(true); // 비동기 상태 관리 개선 (Codex 제안)
    
    // 초기 메트릭 값 검증 적용
    const [realtimeMetrics, setRealtimeMetrics] = useState(() => 
      validateServerMetrics({
        cpu: server.cpu,
        memory: server.memory,
        disk: server.disk,
        network: server.network || 25,
      })
    );
    
    // 🚀 Vercel 호환 접근성 Hook (선택적 사용)
    const accessibility = useAccessibilityOptional();
    const isAccessibilityEnabled = !!accessibility?.isClient;
    
    // ARIA 속성 생성 (접근성 활성화 시에만)
    const ariaProps = useMemo(() => {
      if (!isAccessibilityEnabled) return {};
      
      return useServerCardAria({
        serverId: server.id,
        serverName: server.name,
        status: server.status as 'online' | 'offline' | 'warning' | 'critical',
        cpu: realtimeMetrics.cpu,
        memory: realtimeMetrics.memory,
        disk: realtimeMetrics.disk,
        alerts: typeof server.alerts === 'number' ? server.alerts : 0,
        uptime: `${server.uptime || 0}시간`,
      });
    }, [isAccessibilityEnabled, server, realtimeMetrics]);

    // 컴포넌트 언마운트 추적
    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    // 실시간 메트릭 업데이트 시뮬레이션 (안정화 버전 + 검증 강화)
    useEffect(() => {
      if (!showRealTimeUpdates) return;

      const interval = setInterval(
        () => {
          // 컴포넌트가 언마운트된 경우 setState 방지 (Codex 제안)
          if (!isMountedRef.current) return;

          setRealtimeMetrics((prev) => ({
            // 안전한 메트릭 값 생성 함수 사용
            cpu: generateSafeMetricValue(prev.cpu, 3, 'cpu'),
            memory: generateSafeMetricValue(prev.memory, 2, 'memory'),
            disk: generateSafeMetricValue(prev.disk, 0.5, 'disk'),
            network: generateSafeMetricValue(prev.network, 5, 'network'),
          }));
        },
        45000 + index * 1000 // 🎯 데이터 수집 간격 최적화 (45초 + 서버별 지연)
      );

      return () => clearInterval(interval);
    }, [showRealTimeUpdates, index]);

    // 🎨 Material Design 3 토큰 기반 서버 상태별 테마 (메모이제이션 최적화)
    const statusTheme = useMemo(() => {
      // 서버 상태를 Material Design 3 표준 상태로 매핑
      const normalizedStatus: ServerStatus =
        server.status === 'online' || server.status === 'healthy'
          ? 'healthy'
          : server.status === 'critical' || server.status === 'offline'
            ? 'critical'
            : server.status === 'warning'
              ? 'warning'
              : 'healthy'; // 기본값

      const theme = getServerStatusTheme(normalizedStatus);
      
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
          boxShadow: normalizedStatus === 'healthy' 
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(16, 185, 129, 0.125)'
            : normalizedStatus === 'warning'
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(245, 158, 11, 0.125)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(239, 68, 68, 0.125)',
        },
        
        // 상태 표시 - design-constants 사용
        statusColor: theme.statusColor,
        statusIcon: normalizedStatus === 'healthy' 
          ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          : <AlertCircle className="h-4 w-4" aria-hidden="true" />,
        statusText: normalizedStatus === 'healthy' 
          ? '정상' 
          : normalizedStatus === 'warning' 
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
    }, [server.status]); // 상태별 의존성 최적화 (Gemini 제안 반영)

    // 🚀 서버 타입별 아이콘 메모이제이션 최적화
    const serverIcon = useMemo(() => {
      switch (server.type) {
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
    }, [server.type]);

    // 🚀 OS별 아이콘/이모지 메모이제이션 최적화
    const osIcon = useMemo(() => {
      const os = server.os?.toLowerCase() || '';

      if (
        os.includes('ubuntu') ||
        os.includes('debian') ||
        os.includes('linux')
      ) {
        return (
          <span className="text-base" title={server.os} aria-label={`운영체제: ${server.os}`}>
            🐧
          </span>
        );
      } else if (
        os.includes('centos') ||
        os.includes('red hat') ||
        os.includes('rhel')
      ) {
        return (
          <span className="text-base" title={server.os} aria-label={`운영체제: ${server.os}`}>
            🎩
          </span>
        );
      } else if (os.includes('windows')) {
        return (
          <span className="text-base" title={server.os} aria-label={`운영체제: ${server.os}`}>
            🪟
          </span>
        );
      }
      return null;
    }, [server.os]);

    // 🚀 알림 수 계산 메모이제이션 최적화
    const alertCount = useMemo(() => {
      if (typeof server.alerts === 'number') return server.alerts;
      if (Array.isArray(server.alerts) && server.alerts) return server.alerts.length;
      return 0;
    }, [server.alerts]);

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
    const handleExpandToggle = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setShowTertiaryInfo(prev => !prev);
      if (!showTertiaryInfo) {
        setShowSecondaryInfo(true);
      }
    }, [showTertiaryInfo]);

    // 🚀 클릭 핸들러 메모이제이션 (성능 최적화)
    const handleClick = useCallback(() => {
      onClick(server);
    }, [server.id, onClick]); // 의존성 최적화

    // 🎯 키보드 접근성 개선 (Gemini 제안)
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    }, [handleClick]);

    return (
      <button
        type="button"
        className={`
          relative cursor-pointer rounded-2xl border-2 w-full overflow-hidden text-left group
          md3-state-layer md3-card-hover
          ${statusTheme.cardBg} ${statusTheme.cardBorder}
          ${variantStyles.container}
          focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:ring-offset-2
        `}
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
        aria-label={`${server.name} 서버 - ${statusTheme.statusText} 상태. CPU ${Math.round(realtimeMetrics.cpu)}%, 메모리 ${Math.round(realtimeMetrics.memory)}% 사용 중`}
        role="button"
        tabIndex={0}
      >
        {/* 실시간 활동 인디케이터 */}
        {showRealTimeUpdates && (
          <div className="absolute right-3 top-3 z-10" aria-hidden="true">
            <div
              className="h-2 w-2 rounded-full shadow-lg animate-pulse"
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
              aria-label={`서버 타입: ${server.type}`}
            >
              {serverIcon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3
                  className={`${variantStyles.titleSize} truncate`}
                  style={{ color: statusTheme.cardStyle.color }}
                  id={`server-${server.id}-title`}
                >
                  {server.name}
                </h3>
                {osIcon}
              </div>
              <div 
                className={`flex items-center gap-2 ${'text-sm font-medium'}`}
                style={statusTheme.accent}
              >
                <MapPin className="h-3 w-3" aria-hidden="true" />
                <span aria-label="서버 위치">{server.location || '서울'}</span>
                {variantStyles.showDetails && (
                  <>
                    <span aria-hidden="true">•</span>
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span aria-label="현재 시간">
                      {new Date().toLocaleTimeString('ko-KR', { 
                        hour12: false, 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 shadow-sm ${'text-sm font-medium'}`}
              style={statusTheme.statusColor}
              role="status"
              aria-label={`서버 상태: ${statusTheme.statusText}`}
            >
              {statusTheme.statusIcon}
              <span className="font-semibold">
                {statusTheme.statusText}
              </span>
            </div>
            
            {/* Progressive Disclosure 확장/축소 버튼 */}
            {enableProgressiveDisclosure && (
              <button
                type="button"
                onClick={handleExpandToggle}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label={showTertiaryInfo ? '상세 정보 숨기기' : '상세 정보 보기'}
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
          aria-labelledby={`server-${server.id}-title`}
        >
          {/* 🎯 Level 1: 핵심 메트릭 (CPU, 메모리) - 상시 표시 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-3 w-3 text-red-500" aria-hidden="true" />
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                핵심 지표
              </h4>
              <div className="ml-auto text-xs text-gray-500">Level 1</div>
            </div>
            <div className="grid grid-cols-2 gap-6" role="group" aria-label="주요 서버 메트릭">
              <div className="transform transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-1 hover:shadow-lg">
                <ServerCardLineChart
                  label="CPU"
                  value={realtimeMetrics.cpu}
                  type="cpu"
                  showRealTimeUpdates={showRealTimeUpdates}
                  serverStatus={server.status}
                />
              </div>
              <div className="transform transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-1 hover:shadow-lg">
                <ServerCardLineChart
                  label="메모리"
                  value={realtimeMetrics.memory}
                  type="memory"
                  showRealTimeUpdates={showRealTimeUpdates}
                  serverStatus={server.status}
                />
              </div>
            </div>
          </div>

          {/* 🔹 Level 2: 보조 메트릭 (디스크, 네트워크) - 호버 시 표시 */}
          <div 
            className={`space-y-3 transition-all duration-300 overflow-hidden ${
              showSecondaryInfo 
                ? 'max-h-96 opacity-100 transform translate-y-0' 
                : 'max-h-0 opacity-0 transform -translate-y-4'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="h-3 w-3 text-blue-400" aria-hidden="true" />
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                보조 지표
              </h4>
              <div className="ml-auto text-xs text-gray-500">Level 2</div>
            </div>
            <div className="grid grid-cols-2 gap-4 opacity-90" role="group" aria-label="보조 서버 메트릭">
              <div className="transform transition-all duration-300 ease-out hover:opacity-100 hover:scale-105 hover:-translate-y-0.5 hover:shadow-md">
                <ServerCardLineChart
                  label="디스크"
                  value={realtimeMetrics.disk}
                  type="disk"
                  showRealTimeUpdates={showRealTimeUpdates}
                  serverStatus={server.status}
                />
              </div>
              <div className="transform transition-all duration-300 ease-out hover:opacity-100 hover:scale-105 hover:-translate-y-0.5 hover:shadow-md">
                <ServerCardLineChart
                  label="네트워크"
                  value={realtimeMetrics.network}
                  type="network"
                  showRealTimeUpdates={showRealTimeUpdates}
                  serverStatus={server.status}
                />
              </div>
            </div>
          </div>

          {/* 🔸 Level 3: 상세 정보 (운영체제, 업타임, IP 등) - 클릭 시 표시 */}
          <div 
            className={`space-y-4 transition-all duration-500 overflow-hidden ${
              showTertiaryInfo 
                ? 'max-h-96 opacity-100 transform translate-y-0' 
                : 'max-h-0 opacity-0 transform -translate-y-8'
            }`}
          >
            <div className="flex items-center gap-2 mb-3 pt-4 border-t border-gray-200/50">
              <Zap className="h-3 w-3 text-purple-400" aria-hidden="true" />
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                상세 정보
              </h4>
              <div className="ml-auto text-xs text-gray-500">Level 3</div>
            </div>
            
            {/* 운영체제 및 기본 정보 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <Globe className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">OS</div>
                  <div className="font-medium text-gray-700">{server.os || 'Ubuntu 22.04'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">업타임</div>
                  <div className="font-medium text-gray-700">{server.uptime || '72d 14h 23m'}</div>
                </div>
              </div>
            </div>
            
            {/* IP 및 네트워크 정보 */}
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 uppercase tracking-wide">IP 주소</span>
                <span className="font-mono font-medium text-gray-700">
                  {server.ip || `192.168.1.${10 + (parseInt(server.id) % 240)}`}
                </span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 uppercase tracking-wide">마지막 업데이트</span>
                <span className="font-medium text-gray-700">
                  {new Date().toLocaleString('ko-KR', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
            
            {/* 성능 요약 */}
            <div className="px-3 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">성능 요약</div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">{Math.round(realtimeMetrics.cpu)}%</div>
                  <div className="text-xs text-gray-500">CPU</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{Math.round(realtimeMetrics.memory)}%</div>
                  <div className="text-xs text-gray-500">RAM</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">{Math.round(realtimeMetrics.disk)}%</div>
                  <div className="text-xs text-gray-500">DISK</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">{Math.round(realtimeMetrics.network)}%</div>
                  <div className="text-xs text-gray-500">NET</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 서비스 상태 - Progressive Disclosure Level 2에 포함 */}
        {variantStyles.showServices &&
          Array.isArray(server.services) && server.services && server.services.length > 0 &&
          (showSecondaryInfo || !enableProgressiveDisclosure) && (
            <footer 
              className={`mt-4 transition-all duration-300 ${
                showSecondaryInfo || !enableProgressiveDisclosure
                  ? 'opacity-100 transform translate-y-0'
                  : 'opacity-0 transform -translate-y-2'
              }`} 
              role="complementary" 
              aria-label="서비스 상태 목록"
            >
              <div className="flex flex-wrap gap-2">
                {(server.services || [])
                  .slice(0, variantStyles.maxServices)
                  .filter((service) => service && typeof service === 'object' && service.name)
                  .map((service, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium shadow-sm transition-colors ${
                        service.status === 'running'
                          ? 'border-green-300 bg-green-50 text-green-700'
                          : service.status === 'stopped'
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : 'border-yellow-300 bg-yellow-50 text-yellow-700'
                      }`}
                      role="status"
                      aria-label={`${service.name} 서비스: ${
                        service.status === 'running' ? '실행중' : 
                        service.status === 'stopped' ? '중단' : '경고'
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          service.status === 'running'
                            ? 'bg-green-500'
                            : service.status === 'stopped'
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
                        }`}
                        aria-hidden="true"
                      />
                      <span>{service.name}</span>
                    </div>
                  ))}
                {(Array.isArray(server.services) ? server.services.length : 0) > variantStyles.maxServices && (
                  <div
                    className="flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-500"
                    aria-label={`${(Array.isArray(server.services) ? server.services.length : 0) - variantStyles.maxServices}개 서비스 더 있음`}
                  >
                    +{(Array.isArray(server.services) ? server.services.length : 0) - variantStyles.maxServices} more
                  </div>
                )}
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
const ImprovedServerCard: FC<ImprovedServerCardProps> = (props) => {
  return (
    <ServerCardErrorBoundary>
      <ImprovedServerCardInner {...props} />
    </ServerCardErrorBoundary>
  );
};

ImprovedServerCard.displayName = 'ImprovedServerCard';

export default ImprovedServerCard;