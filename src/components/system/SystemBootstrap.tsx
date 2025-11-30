'use client';

import { useEffect, useState } from 'react';
import { useGlobalSystemStore } from '@/stores/systemStore';

/**
 * 🚀 시스템 부트스트랩 컴포넌트
 *
 * ✅ 개선된 기능:
 * - 시스템이 실제로 시작된 상태일 때만 실행
 * - 사용자가 "시스템 시작" 버튼을 누르기 전에는 실행 안 함
 * - AI 백엔드 서버 자동 웜업
 * - Google AI 연결 확인
 * - 시스템 초기화 상태 관리
 */
export function SystemBootstrap(): JSX.Element | null {
  const { state: systemState, isSessionActive } = useGlobalSystemStore();

  const [bootstrapStatus, setBootstrapStatus] = useState({
    mcp: 'pending' as 'pending' | 'success' | 'failed',
    googleAI: 'pending' as 'pending' | 'success' | 'failed',
    redis: 'pending' as 'pending' | 'success' | 'failed',
    supabase: 'pending' as 'pending' | 'success' | 'failed',
    completed: false,
  });

  useEffect(() => {
    // 🚨 중요: 시스템이 시작되지 않은 상태에서는 부트스트랩 실행 안 함
    if (systemState === 'inactive' || !isSessionActive) {
      console.log('💤 시스템 부트스트랩 대기 중 - 시스템 시작 후 실행됩니다');
      return;
    }

    let isMounted = true;

    const bootstrap = async () => {
      console.log('🚀 시스템 부트스트랩 시작... (시스템 활성화 상태)');

      // 🎯 세션 캐시 확인 (브라우저 세션 동안 한 번만 체크)
      const sessionKey = 'system-bootstrap-cache';
      const cachedBootstrap = sessionStorage.getItem(sessionKey);

      if (cachedBootstrap) {
        try {
          const cached = JSON.parse(cachedBootstrap);
          const cacheAge = Date.now() - cached.timestamp;

          // 세션 캐시가 30분 이내면 재사용
          if (cacheAge < 30 * 60 * 1000) {
            console.log('📦 부트스트랩 캐시 사용 (세션 동안 유효)');
            if (isMounted) {
              setBootstrapStatus({ ...cached.status, completed: true });
            }
            return;
          }
        } catch {
          console.warn('⚠️ 부트스트랩 캐시 파싱 실패, 새로 시작');
        }
      }

      // 1. AI 백엔드 서버 상태 확인
      try {
        console.log('🔄 AI 백엔드 서버 상태 확인...');
        const mcpResponse = await fetch('/api/ai/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (isMounted) {
          if (mcpResponse.ok) {
            const mcpData = await mcpResponse.json();
            console.log(
              '✅ AI 백엔드 서버 상태:',
              mcpData.mcp?.enabled ? '활성화' : '비활성화'
            );
            setBootstrapStatus((prev) => ({ ...prev, mcp: 'success' }));
          } else {
            console.warn(
              '⚠️ AI 백엔드 서버 상태 확인 실패:',
              mcpResponse.status
            );
            setBootstrapStatus((prev) => ({ ...prev, mcp: 'failed' }));
          }
        }
      } catch (error) {
        console.error('❌ AI 백엔드 서버 상태 확인 오류:', error);
        if (isMounted) {
          setBootstrapStatus((prev) => ({ ...prev, mcp: 'failed' }));
        }
      }

      // 2. Google AI 상태 확인 (한 번만)
      try {
        console.log('🤖 Google AI 상태 확인...');
        const googleResponse = await fetch('/api/ai/google-ai/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (isMounted) {
          if (googleResponse.ok) {
            const googleData = await googleResponse.json();
            console.log(
              '✅ Google AI 상태 확인 완료:',
              googleData.enabled ? '활성화' : '비활성화'
            );
            setBootstrapStatus((prev) => ({ ...prev, googleAI: 'success' }));
          } else {
            console.warn('⚠️ Google AI 상태 확인 실패:', googleResponse.status);
            setBootstrapStatus((prev) => ({ ...prev, googleAI: 'failed' }));
          }
        }
      } catch (error) {
        console.error('❌ Google AI 상태 확인 오류:', error);
        if (isMounted) {
          setBootstrapStatus((prev) => ({ ...prev, googleAI: 'failed' }));
        }
      }

      // 3. Redis 상태 확인 (한 번만)
      try {
        console.log('🔴 Redis 상태 확인...');
        const redisResponse = await fetch('/api/redis/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (isMounted) {
          if (redisResponse.ok) {
            const redisData = await redisResponse.json();
            console.log(
              '✅ Redis 상태 확인 완료:',
              redisData._systemHealth || '연결됨'
            );
            setBootstrapStatus((prev) => ({ ...prev, redis: 'success' }));
          } else {
            console.warn('⚠️ Redis 상태 확인 실패:', redisResponse.status);
            setBootstrapStatus((prev) => ({ ...prev, redis: 'failed' }));
          }
        }
      } catch (error) {
        console.error('❌ Redis 상태 확인 오류:', error);
        if (isMounted) {
          setBootstrapStatus((prev) => ({ ...prev, redis: 'failed' }));
        }
      }

      // 4. Supabase 상태 확인 (한 번만)
      try {
        console.log('🟢 Supabase 상태 확인...');
        const supabaseResponse = await fetch('/api/database/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (isMounted) {
          if (supabaseResponse.ok) {
            const supabaseData = await supabaseResponse.json();
            console.log(
              '✅ Supabase 상태 확인 완료:',
              supabaseData.primary?.status || '연결됨'
            );
            setBootstrapStatus((prev) => ({ ...prev, supabase: 'success' }));
          } else {
            console.warn('⚠️ Supabase 상태 확인 실패:', supabaseResponse.status);
            setBootstrapStatus((prev) => ({ ...prev, supabase: 'failed' }));
          }
        }
      } catch (error) {
        console.error('❌ Supabase 상태 확인 오류:', error);
        if (isMounted) {
          setBootstrapStatus((prev) => ({ ...prev, supabase: 'failed' }));
        }
      }

      // 5. 부트스트랩 완료 및 캐시 저장
      if (isMounted) {
        const finalStatus = {
          mcp: bootstrapStatus.mcp,
          googleAI: bootstrapStatus.googleAI,
          redis: bootstrapStatus.redis,
          supabase: bootstrapStatus.supabase,
          completed: true,
        };

        setBootstrapStatus(finalStatus);

        // 세션 캐시에 저장 (브라우저 세션 동안 유효)
        try {
          sessionStorage.setItem(
            sessionKey,
            JSON.stringify({
              status: finalStatus,
              timestamp: Date.now(),
            })
          );
          console.log('💾 부트스트랩 상태 세션 캐시에 저장');
        } catch (error) {
          console.warn('⚠️ 세션 캐시 저장 실패:', error);
        }

        console.log('🎉 시스템 부트스트랩 완료 (세션 동안 재사용됨)');
      }
    };

    // 페이지 로드 후 5초 뒤에 부트스트랩 실행 (UI 렌더링 완료 후, 과도한 동시 요청 방지)
    const timer = setTimeout(() => {
      void bootstrap();
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [systemState, isSessionActive, bootstrapStatus]);

  // 시스템 초기화 상태 표시 제거됨 (웹 알람 삭제에 따라)
  return null;
}
