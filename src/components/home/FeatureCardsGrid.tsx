'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Activity, Layers, X } from 'lucide-react';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useToast } from '@/components/ui/ToastNotification';

// 카드 데이터
const cardData = [
  {
    id: 'ai-agent',
    title: 'AI 에이전트',
    description: 'LLM 없이도 지능형 분석하는 차세대 AI',
    icon: Bot,
    gradient: 'from-purple-500 to-pink-600',
    features: [
      'LLM 비용 없는 실시간 AI 추론',
      '자연어로 서버 상태 질의',
      '지능형 근본원인 분석',
      '예측적 알림 및 권장사항'
    ],
    requiresAdmin: true
  },
  {
    id: 'prometheus',
    title: 'Prometheus 모니터링',
    description: '실시간 메트릭 수집 및 시각화',
    icon: Activity,
    gradient: 'from-cyan-500 to-blue-600',
    features: [
      '실시간 서버 메트릭 수집',
      '커스텀 알림 설정',
      '히스토리 데이터 분석',
      '다양한 시각화 차트'
    ],
    requiresAdmin: false
  },
  {
    id: 'tech-stack',
    title: '기술 스택',
    description: '현대적이고 확장 가능한 아키텍처',
    icon: Layers,
    gradient: 'from-emerald-500 to-teal-600',
    features: [
      'Next.js 15 + TypeScript',
      'Zustand 상태 관리',
      'Tailwind CSS 스타일링',
      'Vercel 배포 최적화'
    ],
    requiresAdmin: false
  }
];

export default function FeatureCardsGrid() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showDevModal, setShowDevModal] = useState(false);
  
  const { isAdminMode } = useUnifiedAdminStore();
  const { warning } = useToast();

  const handleCardClick = (cardId: string) => {
    const card = cardData.find(c => c.id === cardId);
    
    if (card?.requiresAdmin && !isAdminMode) {
      // 관리자 모드가 필요한 기능에 일반 사용자가 접근할 때
      setShowDevModal(true);
      setTimeout(() => setShowDevModal(false), 3000);
      return;
    }
    
    setSelectedCard(cardId);
  };

  const closeModal = () => {
    setSelectedCard(null);
  };

  const selectedCardData = cardData.find(card => card.id === selectedCard);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {cardData.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="group cursor-pointer"
            onClick={() => handleCardClick(card.id)}
          >
            <div className="relative p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300 h-full">
              {/* 그라데이션 배경 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
              
              {/* 아이콘 */}
              <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className="w-7 h-7 text-white" />
              </div>
              
              {/* 컨텐츠 */}
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">
                  {card.title}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed group-hover:text-white/90 transition-colors">
                  {card.description}
                </p>
                
                {/* 관리자 모드 필요 표시 */}
                {card.requiresAdmin && !isAdminMode && (
                  <div className="mt-3 px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-300 text-xs text-center">
                    관리자 모드 필요
                  </div>
                )}
              </div>
              
              {/* 호버 효과 */}
              <div className="absolute inset-0 ring-2 ring-transparent group-hover:ring-white/30 rounded-2xl transition-all duration-300" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* 상세 모달 */}
      {selectedCard && selectedCardData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl"
          >
            {/* 헤더 */}
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${selectedCardData.gradient} rounded-lg flex items-center justify-center`}>
                    <selectedCardData.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedCardData.title}</h2>
                    <p className="text-sm text-gray-400">{selectedCardData.description}</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* 기능 목록 */}
            <div className="p-6">
              <h3 className="text-white font-medium mb-4">주요 기능</h3>
              <ul className="space-y-3">
                {selectedCardData.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      )}

      {/* 개발 중 모달 */}
      {showDevModal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 bg-orange-500/90 text-white rounded-lg shadow-lg"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bot className="w-4 h-4" />
            <span>관리자 모드를 활성화해주세요</span>
          </div>
        </motion.div>
      )}
    </>
  );
} 