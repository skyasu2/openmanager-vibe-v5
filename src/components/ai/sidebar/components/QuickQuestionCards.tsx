import React from 'react';
import {
  RefreshCw,
  AlertTriangle,
  Activity,
  TrendingUp,
  Shield,
} from 'lucide-react';

interface QuestionCard {
  id: string;
  keyword: string;
  question: string;
  priority: 'high' | 'medium' | 'low';
  category: 'status' | 'performance' | 'alert' | 'optimization';
}

interface QuickQuestionCardsProps {
  questions: QuestionCard[];
  onQuestionClick: (question: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const categoryIcons = {
  status: Activity,
  performance: TrendingUp,
  alert: AlertTriangle,
  optimization: Shield,
};

const priorityColors = {
  high: {
    bg: 'from-red-50 to-orange-50',
    border: 'border-red-200',
    text: 'text-red-700',
    keyword: 'text-red-800',
    icon: 'text-red-600',
  },
  medium: {
    bg: 'from-blue-50 to-cyan-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    keyword: 'text-blue-800',
    icon: 'text-blue-600',
  },
  low: {
    bg: 'from-green-50 to-emerald-50',
    border: 'border-green-200',
    text: 'text-green-700',
    keyword: 'text-green-800',
    icon: 'text-green-600',
  },
};

export default function QuickQuestionCards({
  questions,
  onQuestionClick,
  onRefresh,
  isLoading = false,
}: QuickQuestionCardsProps) {
  return (
    <div className='p-4 border-b border-gray-100 bg-gray-50'>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='text-sm font-medium text-gray-700'>
          빠른 질문 (서버 상태 기반)
        </h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className='p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50'
            title='질문 새로고침'
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className='grid grid-cols-2 gap-2'>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className='p-3 bg-gray-100 border border-gray-200 rounded-lg animate-pulse'
            >
              <div className='h-4 bg-gray-200 rounded mb-2'></div>
              <div className='h-3 bg-gray-200 rounded w-3/4'></div>
            </div>
          ))}
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-2'>
          {questions.map(card => {
            const colors = priorityColors[card.priority];
            const IconComponent = categoryIcons[card.category];

            return (
              <button
                key={card.id}
                onClick={() => onQuestionClick(card.question)}
                className={`p-3 bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-lg text-left hover:shadow-md hover:scale-105 transition-all group`}
              >
                <div className='flex items-start gap-2 mb-2'>
                  <IconComponent
                    className={`w-4 h-4 ${colors.icon} flex-shrink-0 mt-0.5`}
                  />
                  <div
                    className={`text-xs font-medium ${colors.keyword} leading-tight`}
                  >
                    {card.keyword}
                  </div>
                </div>
                <div
                  className={`text-xs ${colors.text} group-hover:text-gray-700 leading-relaxed`}
                >
                  클릭해서 질문하기
                </div>

                {/* 우선순위 인디케이터 */}
                <div className='flex items-center justify-between mt-2'>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      card.priority === 'high'
                        ? 'bg-red-400'
                        : card.priority === 'medium'
                          ? 'bg-blue-400'
                          : 'bg-green-400'
                    }`}
                  ></div>
                  <div className='text-xs text-gray-400 uppercase tracking-wide'>
                    {card.category}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 상태 표시 */}
      {!isLoading && questions.length === 0 && (
        <div className='text-center py-6 text-gray-500'>
          <Activity className='w-8 h-8 mx-auto mb-2 text-gray-400' />
          <p className='text-sm'>서버 상태를 확인하는 중...</p>
        </div>
      )}

      {/* 도움말 */}
      <div className='mt-3 text-xs text-gray-500 text-center'>
        💡 서버 상태에 따라 자동으로 업데이트됩니다
      </div>
    </div>
  );
}
