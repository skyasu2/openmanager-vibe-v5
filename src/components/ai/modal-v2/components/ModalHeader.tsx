'use client';

interface ModalHeaderProps {
  onClose: () => void;
}

export default function ModalHeader({ onClose }: ModalHeaderProps) {
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
          className="h-9 w-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
          title="설정"
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