'use client';

import { useState } from 'react';
import FunctionCard from './FunctionCard';
import { FunctionType } from '../types';

interface FunctionCardsProps {
  selectedFunction: FunctionType;
  selectFunction: (functionType: FunctionType) => void;
  layout?: 'desktop' | 'mobile';
}

// 전체 기능 카드 데이터
const ALL_FUNCTION_CARDS = [
  // 페이지 1
  [
    {
      type: 'auto-report' as FunctionType,
      title: '자동 장애보고서',
      icon: '🚨'
    },
    {
      type: 'performance' as FunctionType,
      title: '성능 분석',
      icon: '📊'
    },
    {
      type: 'log-analysis' as FunctionType,
      title: '로그 분석',
      icon: '🔍'
    },
    {
      type: 'trend-analysis' as FunctionType,
      title: '트렌드 분석',
      icon: '📈'
    },
    {
      type: 'quick-diagnosis' as FunctionType,
      title: '빠른 진단',
      icon: '⚡'
    },
    {
      type: 'solutions' as FunctionType,
      title: '해결책 제안',
      icon: '🛠️'
    }
  ],
  // 페이지 2
  [
    {
      type: 'resource-usage' as any,
      title: '리소스 사용량',
      icon: '💾'
    },
    {
      type: 'security-check' as any,
      title: '보안 점검',
      icon: '🔒'
    },
    {
      type: 'deployment-history' as any,
      title: '배포 이력',
      icon: '🚀'
    },
    {
      type: 'backup-status' as any,
      title: '백업 상태',
      icon: '💾'
    },
    {
      type: 'network-traffic' as any,
      title: '네트워크 트래픽',
      icon: '🌐'
    },
    {
      type: 'config-checker' as any,
      title: '설정 검사',
      icon: '⚙️'
    }
  ],
  // 페이지 3
  [
    {
      type: 'api-monitor' as any,
      title: 'API 모니터',
      icon: '🔌'
    },
    {
      type: 'database-health' as any,
      title: 'DB 상태',
      icon: '🗄️'
    },
    {
      type: 'user-activity' as any,
      title: '사용자 활동',
      icon: '👥'
    },
    {
      type: 'service-health' as any,
      title: '서비스 상태',
      icon: '🏥'
    },
    {
      type: 'cost-analysis' as any,
      title: '비용 분석',
      icon: '💰'
    },
    {
      type: 'scheduled-tasks' as any,
      title: '예약 작업',
      icon: '🕒'
    }
  ]
];

export default function FunctionCards({
  selectedFunction,
  selectFunction,
  layout = 'desktop'
}: FunctionCardsProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = ALL_FUNCTION_CARDS.length;
  
  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };
  
  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };
  
  // 현재 페이지의 카드들
  const currentCards = ALL_FUNCTION_CARDS[currentPage];
  
  return (
    <div className="w-full">
      <div className="relative">
        {/* 네비게이션 버튼 - 왼쪽 */}
        <button
          onClick={prevPage}
          className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center z-10 hover:bg-gray-50 transition-colors"
          aria-label="이전 페이지"
        >
          <i className="fas fa-chevron-left text-gray-600"></i>
        </button>
        
        {/* 카드 컨테이너 */}
        <div className="overflow-hidden py-1">
          <div 
            className="transition-transform duration-300 ease-in-out transform"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            <div className={`grid ${layout === 'mobile' ? 'grid-cols-3 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-3'} gap-3`}>
              {currentCards.map((card) => (
                <FunctionCard
                  key={card.type}
                  type={card.type}
                  title={card.title}
                  icon={card.icon}
                  isSelected={selectedFunction === card.type}
                  onClick={selectFunction}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* 네비게이션 버튼 - 오른쪽 */}
        <button
          onClick={nextPage}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center z-10 hover:bg-gray-50 transition-colors"
          aria-label="다음 페이지"
        >
          <i className="fas fa-chevron-right text-gray-600"></i>
        </button>
      </div>
      
      {/* 페이지 인디케이터 */}
      <div className="flex items-center justify-center mt-4">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`w-2 h-2 rounded-full mx-1 transition-all ${
              i === currentPage ? 'bg-indigo-600 w-4' : 'bg-gray-300'
            }`}
            aria-label={`페이지 ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
} 