'use client';

import { useRouter } from 'next/navigation';
import AIAgentAdminDashboard from '../../../components/ai/AIAgentAdminDashboard';
import { Shield } from 'lucide-react';

export default function AIAgentAdminPage() {
  const router = useRouter();

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
            <span className="text-sm font-medium">관리자 모드 - 보안 영역</span>
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