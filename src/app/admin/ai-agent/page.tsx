'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import AIAgentAdminDashboard from '../../../components/ai/AIAgentAdminDashboard';
import { Shield, AlertTriangle, Lock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIAgentAdminPage() {
  const router = useRouter();
  const { aiAgent } = useUnifiedAdminStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 보안 검증
  useEffect(() => {
    const checkAuthorization = () => {
      // AI 모드가 활성화되어 있고 인증된 상태인지 확인
      if (aiAgent.isEnabled && aiAgent.isAuthenticated) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
      setIsLoading(false);
    };

    checkAuthorization();
  }, [aiAgent.isEnabled, aiAgent.isAuthenticated]);

  // 권한이 없을 때 표시할 컴포넌트
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-red-500/20 border border-red-500/50 rounded-xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-4">
            🔒 접근 권한이 필요합니다
          </h2>
          
          <div className="space-y-3 text-red-200 text-sm mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>AI 에이전트 모드가 활성화되어야 합니다</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>관리자 권한으로 인증되어야 합니다</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              홈으로 돌아가기
            </button>
            
            <p className="text-gray-400 text-xs">
              홈 화면에서 프로필 → 통합 설정 → AI 모드를 활성화한 후 다시 시도하세요.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // 권한이 있을 때 정상적인 관리자 페이지 표시
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 관리자 헤더 */}
      <div className="bg-red-600 text-white py-2 px-4">
        <div className="flex items-center justify-between">
          {/* 왼쪽: 홈 버튼 */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 hover:bg-red-700 px-3 py-1 rounded-lg transition-colors"
          >
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <i className="fas fa-server text-white text-xs"></i>
            </div>
            <span className="text-sm font-medium">OpenManager</span>
          </button>
          
          {/* 중앙: 관리자 모드 표시 */}
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">🧠 AI 관리자 모드 - 보안 영역</span>
          </div>
          
          {/* 오른쪽: 대시보드 버튼 */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2 hover:bg-red-700 px-3 py-1 rounded-lg transition-colors"
          >
            <i className="fas fa-tachometer-alt text-white text-xs"></i>
            <span className="text-sm font-medium">대시보드</span>
          </button>
        </div>
      </div>
      
      {/* 관리자 대시보드 */}
      <AIAgentAdminDashboard />
    </div>
  );
} 