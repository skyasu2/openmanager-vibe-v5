'use client';

import { useRouter } from 'next/navigation';

interface ModalHeaderProps {
  onClose: () => void;
}

export default function ModalHeader({ onClose }: ModalHeaderProps) {
  const router = useRouter();

  const handleAdminAccess = () => {
    console.log('🔧 AI 에이전트 설정(관리자) 버튼 클릭됨');
    
    try {
      // 관리자 세션 정보 설정
      const timestamp = Date.now();
      localStorage.setItem('admin_session_id', `ai_admin_${timestamp}`);
      localStorage.setItem('admin_auth_token', `ai_admin_${timestamp}`);
      sessionStorage.setItem('admin_authorized', 'true');
      sessionStorage.setItem('admin_access_source', 'ai_agent_modal');
      
      console.log('✅ AI 에이전트 관리자 세션 설정 완료');
      
      // 모달 닫기
      onClose();
      
      // 관리자 페이지로 이동
      setTimeout(() => {
        console.log('🚀 AI 에이전트 관리자 페이지로 이동');
        router.push('/admin/ai-agent');
      }, 200);
      
    } catch (error) {
      console.error('❌ AI 에이전트 관리자 접근 중 에러:', error);
      // 에러 발생 시 직접 이동
      onClose();
      setTimeout(() => {
        window.location.href = '/admin/ai-agent';
      }, 200);
    }
  };
  return (
    <div className="bg-gradient-to-r from-indigo-700 to-purple-700 h-16 flex items-center justify-between px-6 text-white shadow-md">
      {/* 로고 및 제목 */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
          <i className="fas fa-robot text-white text-xl"></i>
        </div>
        <h2 className="text-xl font-bold">AI 에이전트</h2>
      </div>

      {/* 헤더 아이콘 */}
      <div className="flex items-center gap-3">
        <button 
          onClick={handleAdminAccess}
          className="h-9 w-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors hover:scale-110 transform"
          title="AI 에이전트 관리자 설정"
        >
          <i className="fas fa-cog"></i>
        </button>
        
        <button 
          onClick={onClose}
          className="h-9 w-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-red-500/80 transition-colors"
          title="닫기"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
} 