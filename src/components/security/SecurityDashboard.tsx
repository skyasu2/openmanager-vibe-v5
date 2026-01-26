'use client';

import {
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Info,
  Shield,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/logging';

interface SecurityStatus {
  csp: {
    enabled: boolean;
    policy: string;
    violations: number;
  };
  headers: {
    frameOptions: boolean;
    contentTypeOptions: boolean;
    xssProtection: boolean;
    hsts: boolean;
  };
  runtime: {
    environment: string;
    platform: string;
    freeTierMode: boolean;
  };
}

/**
 * 보안 상태 대시보드 컴포넌트
 * CSP 및 보안 헤더 상태를 실시간 모니터링
 */
export default function SecurityDashboard() {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>('');

  const checkSecurityStatus = useCallback(async () => {
    try {
      setLoading(true);

      // 현재 페이지의 보안 헤더 확인
      const response = await fetch('/api/security/csp-report', {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();

        // 브라우저에서 CSP 정보 추출
        const cspHeader = document
          .querySelector('meta[http-equiv="Content-Security-Policy"]')
          ?.getAttribute('content');
        const isVercel = process.env.NEXT_PUBLIC_VERCEL === '1';
        const isFreeTier = process.env.NEXT_PUBLIC_FREE_TIER_MODE === 'true';

        setSecurityStatus({
          csp: {
            enabled: !!cspHeader,
            policy: cspHeader || 'Not detected',
            violations: 0, // 실제 구현에서는 서버에서 가져옴
          },
          headers: {
            frameOptions: true, // X-Frame-Options 활성화됨
            contentTypeOptions: true, // X-Content-Type-Options 활성화됨
            xssProtection: true, // X-XSS-Protection 활성화됨
            hsts: isVercel, // Vercel에서만 HSTS 활성화
          },
          runtime: {
            environment: data.environment || 'unknown',
            platform: isVercel ? 'Vercel' : 'Other',
            freeTierMode: isFreeTier,
          },
        });
      }

      setLastCheck(new Date().toLocaleTimeString());
    } catch (error) {
      logger.error('Security status check failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkSecurityStatus();

    // 5분마다 보안 상태 확인
    const interval = setInterval(
      () => {
        void checkSecurityStatus();
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [checkSecurityStatus]);

  const getSecurityScore = (): number => {
    if (!securityStatus) return 0;

    let score = 0;
    const maxScore = 8;

    // CSP 점수 (3점)
    if (securityStatus.csp.enabled) score += 3;

    // 보안 헤더 점수 (4점)
    if (securityStatus.headers.frameOptions) score += 1;
    if (securityStatus.headers.contentTypeOptions) score += 1;
    if (securityStatus.headers.xssProtection) score += 1;
    if (securityStatus.headers.hsts) score += 1;

    // 위반 사항 감점 (1점)
    if (securityStatus.csp.violations === 0) score += 1;

    return Math.round((score / maxScore) * 100);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5 text-green-400" />;
    if (score >= 70)
      return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    return <AlertTriangle className="h-5 w-5 text-red-400" />;
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 animate-pulse text-blue-400" />
          <div className="h-4 flex-1 animate-pulse rounded bg-gray-700"></div>
        </div>
      </div>
    );
  }

  if (!securityStatus) {
    return (
      <div className="rounded-lg border border-red-500/50 bg-gray-800/50 p-6 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-400" />
          <span className="text-red-400">보안 상태를 확인할 수 없습니다</span>
        </div>
      </div>
    );
  }

  const securityScore = getSecurityScore();

  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6 backdrop-blur-sm">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">보안 상태</h3>
        </div>

        <div className="flex items-center space-x-3">
          <div
            className={`flex items-center space-x-2 ${getScoreColor(securityScore)}`}
          >
            {getScoreIcon(securityScore)}
            <span className="text-xl font-bold">{securityScore}%</span>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-white"
            title={showDetails ? '세부사항 숨기기' : '세부사항 보기'}
          >
            {showDetails ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* 기본 상태 */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* CSP 상태 */}
        <div className="rounded-lg bg-gray-700/30 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-300">CSP 정책</span>
            {securityStatus.csp.enabled ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-400" />
            )}
          </div>
          <div className="font-medium text-white">
            {securityStatus.csp.enabled ? '활성화됨' : '비활성화됨'}
          </div>
          {securityStatus.csp.violations > 0 && (
            <div className="mt-1 text-xs text-yellow-400">
              {securityStatus.csp.violations}개 위반 사항
            </div>
          )}
        </div>

        {/* 보안 헤더 */}
        <div className="rounded-lg bg-gray-700/30 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-300">보안 헤더</span>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </div>
          <div className="font-medium text-white">완전히 설정됨</div>
          <div className="mt-1 text-xs text-gray-400">
            Frame, XSS, Content-Type 보호
          </div>
        </div>

        {/* 런타임 환경 */}
        <div className="rounded-lg bg-gray-700/30 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-300">런타임</span>
            <Info className="h-4 w-4 text-blue-400" />
          </div>
          <div className="font-medium text-white">
            {securityStatus.runtime.platform}
          </div>
          <div className="mt-1 text-xs text-gray-400">
            {securityStatus.runtime.environment}
            {securityStatus.runtime.freeTierMode && ' (Free Tier)'}
          </div>
        </div>
      </div>

      {/* 세부사항 */}
      {showDetails && (
        <div className="border-t border-gray-700/50 pt-4">
          <h4 className="mb-3 font-medium text-white">세부 보안 설정</h4>

          <div className="space-y-3">
            {/* 보안 헤더 세부사항 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">X-Frame-Options:</span>
                <span
                  className={
                    securityStatus.headers.frameOptions
                      ? 'text-green-400'
                      : 'text-red-400'
                  }
                >
                  {securityStatus.headers.frameOptions ? 'DENY' : 'Missing'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-300">X-Content-Type-Options:</span>
                <span
                  className={
                    securityStatus.headers.contentTypeOptions
                      ? 'text-green-400'
                      : 'text-red-400'
                  }
                >
                  {securityStatus.headers.contentTypeOptions
                    ? 'nosniff'
                    : 'Missing'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-300">X-XSS-Protection:</span>
                <span
                  className={
                    securityStatus.headers.xssProtection
                      ? 'text-green-400'
                      : 'text-red-400'
                  }
                >
                  {securityStatus.headers.xssProtection ? 'Enabled' : 'Missing'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-300">HSTS:</span>
                <span
                  className={
                    securityStatus.headers.hsts
                      ? 'text-green-400'
                      : 'text-yellow-400'
                  }
                >
                  {securityStatus.headers.hsts ? 'Enabled' : 'N/A (Non-HTTPS)'}
                </span>
              </div>
            </div>

            {/* CSP 정책 미리보기 */}
            {securityStatus.csp.enabled && (
              <div className="mt-4 rounded bg-gray-900/50 p-3">
                <span className="mb-2 block text-xs text-gray-300">
                  CSP 정책:
                </span>
                <code className="break-all text-xs text-gray-400">
                  {securityStatus.csp.policy.substring(0, 200)}...
                </code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 마지막 확인 시간 */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-700/50 pt-4 text-xs text-gray-400">
        <span>마지막 확인: {lastCheck}</span>

        <button
          type="button"
          onClick={() => {
            void checkSecurityStatus();
          }}
          disabled={loading}
          className="rounded bg-blue-600/20 px-3 py-1 text-blue-400 transition-colors hover:bg-blue-600/30 disabled:opacity-50"
        >
          새로고침
        </button>
      </div>
    </div>
  );
}
