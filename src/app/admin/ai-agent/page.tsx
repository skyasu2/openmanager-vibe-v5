'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EnhancedAdminDashboard from '../../../components/ai/EnhancedAdminDashboard';
import { Shield, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AIAgentAdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 로컬 스토리지에서 관리자 세션 확인
      const sessionId = localStorage.getItem('admin_session_id');
      const authToken = localStorage.getItem('admin_auth_token');
      const sessionAuth = sessionStorage.getItem('admin_authorized');

      if (!sessionId || !authToken || !sessionAuth) {
        throw new Error('관리자 인증이 필요합니다.');
      }

      // 서버에서 세션 검증
      const response = await fetch(`/api/auth/admin?sessionId=${sessionId}`);
      const result = await response.json();

      if (result.success) {
        setIsAuthenticated(true);
      } else {
        throw new Error(result.error || '세션이 유효하지 않습니다.');
      }

    } catch (err) {
      console.error('Authentication check failed:', err);
      setError(err instanceof Error ? err.message : '인증 확인 실패');
      
      // 인증 실패 시 관리자 관련 정보 삭제
      localStorage.removeItem('admin_session_id');
      localStorage.removeItem('admin_auth_token');
      sessionStorage.removeItem('admin_authorized');
      
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnToDashboard = () => {
    router.push('/dashboard');
  };

  const handleRetry = () => {
    checkAuthentication();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">인증 확인 중...</h2>
          <p className="text-gray-600">관리자 권한을 확인하고 있습니다.</p>
        </div>
      </div>
    );
  }

  if (error || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">접근 거부</h2>
          <p className="text-gray-600 mb-6">
            {error || '관리자 권한이 필요합니다.'}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
            
            <button
              onClick={handleReturnToDashboard}
              className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              대시보드로 돌아가기
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>관리자 접근 방법:</strong><br/>
              1. 대시보드에서 프로필 버튼 클릭<br/>
              2. &quot;관리자 모드&quot; 선택<br/>
              3. 관리자 계정으로 인증
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 관리자 헤더 */}
      <div className="bg-red-600 text-white py-2 px-4">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-medium">관리자 모드 - 보안 영역</span>
        </div>
      </div>
      
      {/* 관리자 대시보드 */}
      <EnhancedAdminDashboard />
    </div>
  );
} 