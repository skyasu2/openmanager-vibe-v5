'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Activity, Layers, X, Sparkles } from 'lucide-react';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useToast } from '@/components/ui/ToastNotification';

// 카드 데이터
const cardData = [
  {
    id: 'ai-agent',
    title: 'MCP 기반 AI 에이전트',
    description: 'Model Context Protocol로 구동하는 차세대 AI',
    icon: Bot,
    gradient: 'from-blue-500 via-pink-500 to-cyan-400',
    features: [
      'MCP 표준 프로토콜 기반 AI 추론',
      '자연어로 서버 상태 질의',
      '지능형 근본원인 분석',
      '예측적 알림 및 권장사항'
    ],
    requiresAI: true,
    isAICard: true // AI 카드 특별 애니메이션
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
    requiresAI: false
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
    requiresAI: false
  },
  {
    id: 'vibe-coding',
    title: '✨ Vibe Coding',
    description: 'Cursor + Claude로 만드는 창의적 개발 경험',
    icon: Sparkles,
    gradient: 'from-amber-400 via-orange-500 to-yellow-600',
    features: [
      'Cursor AI 기반 페어 프로그래밍',
      'Claude Sonnet과 실시간 협업',
      '창의적이고 직관적인 코딩',
      '인간과 AI의 완벽한 하모니'
    ],
    requiresAI: false,
    isSpecial: true, // 황금카드 특수 효과
    isVibeCard: true // 바이브 코딩 카드 특별 애니메이션
  }
];

export default function FeatureCardsGrid() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showDevModal, setShowDevModal] = useState(false);
  
  const { aiAgent } = useUnifiedAdminStore();
  const { warning } = useToast();

  const handleCardClick = (cardId: string) => {
    const card = cardData.find(c => c.id === cardId);
    
    if (card?.requiresAI && !aiAgent.isEnabled) {
      // AI 에이전트가 필요한 기능에 일반 사용자가 접근할 때
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

  // AI 단어에 그라데이션 애니메이션 적용하는 함수
  const renderTextWithAIGradient = (text: string) => {
    if (!text.includes('AI')) return text;
    
    return text.split(/(AI)/g).map((part, index) => {
      if (part === 'AI') {
        return (
          <motion.span
            key={index}
            className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-bold"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundSize: '200% 200%'
            }}
          >
            {part}
          </motion.span>
        );
      }
      return part;
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {cardData.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="group cursor-pointer relative"
            onClick={() => handleCardClick(card.id)}
          >
            <div className={`relative p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300 h-full ${
              card.isSpecial ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30' : ''
            }`}>
              {/* 그라데이션 배경 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
              
              {/* AI 카드 특별 이색 그라데이션 애니메이션 */}
              {card.isAICard && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-pink-500/30 to-cyan-400/30 rounded-2xl"
                  animate={{
                    background: [
                      'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(236,72,153,0.3) 50%, rgba(34,197,94,0.3) 100%)',
                      'linear-gradient(135deg, rgba(236,72,153,0.3) 0%, rgba(34,197,94,0.3) 50%, rgba(59,130,246,0.3) 100%)',
                      'linear-gradient(135deg, rgba(34,197,94,0.3) 0%, rgba(59,130,246,0.3) 50%, rgba(236,72,153,0.3) 100%)',
                      'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(236,72,153,0.3) 50%, rgba(34,197,94,0.3) 100%)'
                    ]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              
              {/* 바이브 코딩 카드 황금 그라데이션 애니메이션 */}
              {card.isVibeCard && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-amber-400/20 via-orange-500/20 to-yellow-600/20 rounded-2xl"
                  animate={{
                    background: [
                      'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(249,115,22,0.2) 50%, rgba(234,179,8,0.2) 100%)',
                      'linear-gradient(135deg, rgba(234,179,8,0.2) 0%, rgba(251,191,36,0.2) 50%, rgba(249,115,22,0.2) 100%)',
                      'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(234,179,8,0.2) 50%, rgba(251,191,36,0.2) 100%)',
                      'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(249,115,22,0.2) 50%, rgba(234,179,8,0.2) 100%)'
                    ],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              
              {/* 특별 카드 황금 효과 (기존) */}
              {card.isSpecial && !card.isVibeCard && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-amber-400/20 via-orange-500/20 to-pink-500/20 rounded-2xl"
                  animate={{
                    opacity: [0.1, 0.3, 0.1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              
              {/* 아이콘 */}
              <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 relative z-10 ${
                card.isSpecial ? 'shadow-lg shadow-amber-500/25' : ''
              } ${
                card.isAICard ? 'shadow-lg shadow-pink-500/25' : ''
              }`}>
                {card.isAICard ? (
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    <card.icon className="w-5 h-5 text-white" />
                  </motion.div>
                ) : card.isVibeCard ? (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <card.icon className="w-5 h-5 text-white" />
                  </motion.div>
                ) : (
                  <card.icon className="w-5 h-5 text-white" />
                )}
              </div>
              
              {/* 컨텐츠 */}
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-white transition-colors">
                  {renderTextWithAIGradient(card.title)}
                </h3>
                <p className="text-white/70 text-xs leading-relaxed group-hover:text-white/90 transition-colors">
                  {renderTextWithAIGradient(card.description)}
                </p>
                
                {/* AI 에이전트 필요 표시 */}
                {card.requiresAI && !aiAgent.isEnabled && (
                  <div className="mt-2 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-300 text-xs text-center">
                    AI 에이전트 모드 필요
                  </div>
                )}

                {/* 특별 카드 배지 */}
                {card.isSpecial && (
                  <div className="mt-2 px-2 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full text-amber-300 text-xs text-center">
                    ✨ 황금 경험
                  </div>
                )}
              </div>
              
              {/* 호버 효과 */}
              <div className={`absolute inset-0 ring-2 ring-transparent transition-all duration-300 rounded-2xl ${
                card.isAICard 
                  ? 'group-hover:ring-pink-400/50 group-hover:shadow-lg group-hover:shadow-pink-500/25'
                  : card.isSpecial 
                  ? 'group-hover:ring-amber-400/50 group-hover:shadow-lg group-hover:shadow-amber-500/25' 
                  : 'group-hover:ring-white/30'
              }`} />
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
            className={`relative w-full max-w-md bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl ${
              selectedCardData.isSpecial ? 'border-amber-500/50 bg-gradient-to-br from-gray-900/95 to-amber-900/20' : ''
            } ${
              selectedCardData.isAICard ? 'border-pink-500/50 bg-gradient-to-br from-gray-900/95 to-pink-900/20' : ''
            }`}
          >
            {/* 헤더 */}
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${selectedCardData.gradient} rounded-lg flex items-center justify-center ${
                    selectedCardData.isSpecial ? 'shadow-lg shadow-amber-500/25' : ''
                  } ${
                    selectedCardData.isAICard ? 'shadow-lg shadow-pink-500/25' : ''
                  }`}>
                    {selectedCardData.isAICard ? (
                      <motion.div
                        animate={{
                          rotate: [0, 360],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{
                          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        }}
                      >
                        <selectedCardData.icon className="w-5 h-5 text-white" />
                      </motion.div>
                    ) : selectedCardData.isVibeCard ? (
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <selectedCardData.icon className="w-5 h-5 text-white" />
                      </motion.div>
                    ) : (
                      <selectedCardData.icon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {renderTextWithAIGradient(selectedCardData.title)}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {renderTextWithAIGradient(selectedCardData.description)}
                    </p>
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
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                      selectedCardData.isAICard 
                        ? 'bg-pink-400' 
                        : selectedCardData.isSpecial 
                        ? 'bg-amber-400' 
                        : 'bg-green-400'
                    }`} />
                    <span className="text-gray-300">
                      {renderTextWithAIGradient(feature)}
                    </span>
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
            <span>
              {renderTextWithAIGradient('AI 에이전트 모드를 활성화해주세요')}
            </span>
          </div>
        </motion.div>
      )}
    </>
  );
} 