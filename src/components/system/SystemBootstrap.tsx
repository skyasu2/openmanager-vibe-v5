'use client';

import { useEffect, useState } from 'react';

/**
 * 🚀 시스템 부트스트랩 컴포넌트
 *
 * 기능:
 * - MCP 서버 자동 웜업 (Render 서버 웨이크업)
 * - Google AI 연결 확인
 * - 시스템 초기화 상태 관리
 */
export function SystemBootstrap() {
  const [bootstrapStatus, setBootstrapStatus] = useState<{
    mcpWarmup: 'pending' | 'success' | 'failed';
    googleAI: 'pending' | 'success' | 'failed';
    completed: boolean;
  }>({
    mcpWarmup: 'pending',
    googleAI: 'pending',
    completed: false,
  });

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      console.log('🚀 시스템 부트스트랩 시작...');

      // 1. MCP 웜업 실행
      try {
        console.log('🔥 MCP 서버 웜업 시작...');
        const mcpResponse = await fetch('/api/mcp/warmup', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (isMounted) {
          if (mcpResponse.ok) {
            const mcpData = await mcpResponse.json();
            console.log('✅ MCP 웜업 성공:', mcpData);
            setBootstrapStatus(prev => ({ ...prev, mcpWarmup: 'success' }));
          } else {
            console.warn('⚠️ MCP 웜업 실패:', mcpResponse.status);
            setBootstrapStatus(prev => ({ ...prev, mcpWarmup: 'failed' }));
          }
        }
      } catch (error) {
        console.error('❌ MCP 웜업 오류:', error);
        if (isMounted) {
          setBootstrapStatus(prev => ({ ...prev, mcpWarmup: 'failed' }));
        }
      }

      // 2. Google AI 상태 확인
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
            setBootstrapStatus(prev => ({ ...prev, googleAI: 'success' }));
          } else {
            console.warn('⚠️ Google AI 상태 확인 실패:', googleResponse.status);
            setBootstrapStatus(prev => ({ ...prev, googleAI: 'failed' }));
          }
        }
      } catch (error) {
        console.error('❌ Google AI 상태 확인 오류:', error);
        if (isMounted) {
          setBootstrapStatus(prev => ({ ...prev, googleAI: 'failed' }));
        }
      }

      // 3. 부트스트랩 완료
      if (isMounted) {
        setBootstrapStatus(prev => ({ ...prev, completed: true }));
        console.log('🎉 시스템 부트스트랩 완료');
      }
    };

    // 페이지 로드 후 1초 뒤에 부트스트랩 실행 (UI 렌더링 우선)
    const timer = setTimeout(bootstrap, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // 부트스트랩 상태를 개발자 도구에서만 표시 (프로덕션에서는 숨김)
  if (process.env.NODE_ENV === 'development' && !bootstrapStatus.completed) {
    return (
      <div className='fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-lg shadow-lg text-xs z-50'>
        <div className='flex items-center space-x-2'>
          <div className='animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full'></div>
          <span>시스템 초기화 중...</span>
        </div>
        <div className='mt-2 space-y-1'>
          <div className='flex items-center space-x-2'>
            <div
              className={`w-2 h-2 rounded-full ${
                bootstrapStatus.mcpWarmup === 'success'
                  ? 'bg-green-500'
                  : bootstrapStatus.mcpWarmup === 'failed'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
              }`}
            ></div>
            <span>MCP 웜업</span>
          </div>
          <div className='flex items-center space-x-2'>
            <div
              className={`w-2 h-2 rounded-full ${
                bootstrapStatus.googleAI === 'success'
                  ? 'bg-green-500'
                  : bootstrapStatus.googleAI === 'failed'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
              }`}
            ></div>
            <span>Google AI</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
