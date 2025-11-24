/**
 * 🧪 Real-time Auth Status Checker
 *
 * 개발/테스트용 인증 상태 실시간 모니터링 컴포넌트
 * GitHub OAuth 및 게스트 세션 상태를 실시간으로 확인
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  User as UserIcon,
  Github,
  Clock,
} from 'lucide-react';

interface GuestUserData {
  id?: string;
  name?: string;
  email?: string;
  createdAt?: string;
  preferences?: Record<string, unknown>;
  type?: string;
}

interface AuthStatus {
  timestamp: string;
  supabaseSession: {
    active: boolean;
    user: User | null;
    provider: string | null;
    error: string | null;
  };
  guestSession: {
    active: boolean;
    sessionId: string | null;
    userData: GuestUserData | null;
    cookies: {
      sessionId: boolean;
      authType: boolean;
    };
  };
  environment: {
    hasSupabaseUrl: boolean;
    hasAnonKey: boolean;
    nodeEnv: string;
    isClient: boolean;
  };
}

export default function AuthStatusChecker() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const checkAuthStatus = async () => {
    setIsLoading(true);

    try {
      // Supabase 세션 확인
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      // 게스트 세션 확인
      const guestSessionId = localStorage.getItem('auth_session_id');
      const authType = localStorage.getItem('auth_type');
      const guestUserData = localStorage.getItem('auth_user');

      // 쿠키 확인
      const cookieSessionId = document.cookie.includes('guest_session_id=');
      const cookieAuthType = document.cookie.includes('auth_type=guest');

      const status: AuthStatus = {
        timestamp: new Date().toISOString(),
        supabaseSession: {
          active: !!session,
          user: session?.user || null,
          provider: session?.user?.app_metadata?.provider || null,
          error: sessionError?.message || null,
        },
        guestSession: {
          active: authType === 'guest' && !!guestSessionId,
          sessionId: guestSessionId,
          userData: guestUserData ? JSON.parse(guestUserData) : null,
          cookies: {
            sessionId: cookieSessionId,
            authType: cookieAuthType,
          },
        },
        environment: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          nodeEnv:
            process.env.NEXT_PUBLIC_NODE_ENV ||
            process.env.NODE_ENV ||
            'unknown',
          isClient: typeof window !== 'undefined',
        },
      };

      setAuthStatus(status);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Auth status check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 자동 새로고침
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        void checkAuthStatus();
      }, 3000); // 3초마다
      return () => clearInterval(interval);
    }
    // autoRefresh가 false인 경우 cleanup 함수 없음
    return undefined;
  }, [autoRefresh]);

  // 초기 로드
  useEffect(() => {
    void checkAuthStatus();
  }, []);

  const getAuthStatusBadge = () => {
    if (!authStatus) return <Badge variant="secondary">로딩 중...</Badge>;

    const { supabaseSession, guestSession } = authStatus;

    if (supabaseSession.active) {
      return (
        <Badge variant="default" className="bg-green-600">
          <Github className="mr-1 h-3 w-3" />
          GitHub 인증됨
        </Badge>
      );
    }

    if (guestSession.active) {
      return (
        <Badge variant="secondary" className="bg-blue-600">
          <UserIcon className="mr-1 h-3 w-3" />
          게스트 활성
        </Badge>
      );
    }

    return (
      <Badge variant="destructive">
        <XCircle className="mr-1 h-3 w-3" />
        인증 없음
      </Badge>
    );
  };

  const testGitHubOAuth = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'read:user user:email',
        },
      });

      if (error) {
        alert(`GitHub OAuth 테스트 실패: ${error.message}`);
      }
    } catch (error) {
      alert(`GitHub OAuth 테스트 오류: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!authStatus) {
    return (
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            인증 상태 확인 중...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl space-y-4">
      {/* 상태 헤더 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              실시간 인증 상태 모니터
            </div>
            <div className="flex items-center gap-2">
              {getAuthStatusBadge()}
              {lastRefresh && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="mr-1 h-3 w-3" />
                  {lastRefresh.toLocaleTimeString('ko-KR')}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={checkAuthStatus}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              새로고침
            </Button>
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
            >
              {autoRefresh ? '자동 새로고침 중지' : '자동 새로고침 시작'}
            </Button>
            <Button
              onClick={testGitHubOAuth}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub OAuth 테스트
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Supabase 세션 상태 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Supabase GitHub OAuth
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">세션 활성:</span>
              {authStatus.supabaseSession.active ? (
                <Badge variant="default" className="bg-green-600">
                  활성
                </Badge>
              ) : (
                <Badge variant="secondary">비활성</Badge>
              )}
            </div>

            {authStatus.supabaseSession.user && (
              <>
                <div className="text-sm">
                  <strong>사용자 ID:</strong>{' '}
                  {authStatus.supabaseSession.user.id}
                </div>
                <div className="text-sm">
                  <strong>이메일:</strong>{' '}
                  {authStatus.supabaseSession.user.email}
                </div>
                <div className="text-sm">
                  <strong>이름:</strong>{' '}
                  {authStatus.supabaseSession.user.user_metadata?.full_name ||
                    'N/A'}
                </div>
                <div className="text-sm">
                  <strong>Provider:</strong>{' '}
                  {authStatus.supabaseSession.provider || 'N/A'}
                </div>
              </>
            )}

            {authStatus.supabaseSession.error && (
              <div className="text-sm text-red-500">
                <strong>에러:</strong> {authStatus.supabaseSession.error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 게스트 세션 상태 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              게스트 세션
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">세션 활성:</span>
              {authStatus.guestSession.active ? (
                <Badge variant="default" className="bg-blue-600">
                  활성
                </Badge>
              ) : (
                <Badge variant="secondary">비활성</Badge>
              )}
            </div>

            {authStatus.guestSession.sessionId && (
              <div className="text-sm">
                <strong>세션 ID:</strong>{' '}
                {authStatus.guestSession.sessionId.substring(0, 20)}...
              </div>
            )}

            {authStatus.guestSession.userData && (
              <>
                <div className="text-sm">
                  <strong>이름:</strong> {authStatus.guestSession.userData.name}
                </div>
                <div className="text-sm">
                  <strong>타입:</strong> {authStatus.guestSession.userData.type}
                </div>
              </>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>쿠키 세션 ID:</span>
                {authStatus.guestSession.cookies.sessionId ? (
                  <Badge variant="outline" className="bg-green-50">
                    존재
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50">
                    없음
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>쿠키 Auth Type:</span>
                {authStatus.guestSession.cookies.authType ? (
                  <Badge variant="outline" className="bg-green-50">
                    게스트
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50">
                    없음
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 환경 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            환경 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div className="flex items-center justify-between">
              <span>Supabase URL:</span>
              {authStatus.environment.hasSupabaseUrl ? (
                <Badge variant="outline" className="bg-green-50">
                  설정됨
                </Badge>
              ) : (
                <Badge variant="destructive">미설정</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>Anon Key:</span>
              {authStatus.environment.hasAnonKey ? (
                <Badge variant="outline" className="bg-green-50">
                  설정됨
                </Badge>
              ) : (
                <Badge variant="destructive">미설정</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span>환경:</span>
              <Badge variant="outline">{authStatus.environment.nodeEnv}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>클라이언트:</span>
              {authStatus.environment.isClient ? (
                <Badge variant="outline" className="bg-green-50">
                  브라우저
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-blue-50">
                  서버
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 원시 데이터 (개발용) */}
      {process.env.NEXT_PUBLIC_NODE_ENV ||
        (process.env.NODE_ENV === 'development' && (
          <Card>
            <CardHeader>
              <CardTitle>원시 데이터 (개발용)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-64 overflow-auto rounded bg-gray-100 p-4 text-xs">
                {JSON.stringify(authStatus, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
