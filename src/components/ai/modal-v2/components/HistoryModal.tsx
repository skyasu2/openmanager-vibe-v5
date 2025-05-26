'use client';

import { HistoryItem } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
}

export default function HistoryModal({
  isOpen,
  onClose,
  historyItems,
  onSelectItem
}: HistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden flex items-center justify-center animate-fade-in">
      {/* 모달 배경 */}
      <div 
        className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 모달 컨테이너 */}
      <div 
        className="relative bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-xl max-h-[80vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="bg-indigo-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fas fa-history text-xl"></i>
            <h3 className="text-lg font-semibold">대화 히스토리</h3>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* 모달 내용 */}
        <div className="p-4 max-h-[calc(80vh-64px)] overflow-y-auto">
          {historyItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-history text-gray-400 text-xl"></i>
              </div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">히스토리가 없습니다</h4>
              <p className="text-gray-500 text-sm">
                질문을 하면 여기에 대화 내역이 저장됩니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyItems.map((item) => (
                <HistoryCard 
                  key={item.id}
                  item={item}
                  onClick={() => onSelectItem(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 히스토리 카드 컴포넌트
function HistoryCard({ item, onClick }: { item: HistoryItem; onClick: () => void }) {
  // 타임스탬프 포맷팅
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 답변 텍스트 축약
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-indigo-50 hover:border-indigo-200 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <i className="fas fa-question text-indigo-600 text-xs"></i>
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-800">{item.question}</p>
          <p className="text-sm text-gray-500 mt-1">{truncateText(item.answer)}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{formatDate(item.timestamp)}</span>
            <button className="text-xs text-indigo-600 hover:text-indigo-800">
              <i className="fas fa-arrow-right mr-1"></i>
              불러오기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 